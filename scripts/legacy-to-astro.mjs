// Переносит старую страницу превью (папка с index.html, page.css, page.js) на Astro.
//
// Что делает:
//   • заголовок, описание, canonical и Open Graph → src/data/pages/<адрес>.json (раздел seo);
//   • каждую секцию внутри <main> → отдельный компонент src/components/<адрес>/NN-<имя>.astro,
//     разметка переносится как есть;
//   • стили → src/styles/<адрес>/, скрипты → src/scripts/<адрес>/, подключаются в том же порядке;
//   • картинки и прочие файлы папки → public/<адрес>/ (ссылки ./img/… продолжают работать);
//   • саму страницу → src/pages/<адрес>.astro.
//
// Это первый шаг переноса: компоненты получаются «как было». Дальше повторяющиеся блоки
// (цена, форма, вопросы, удостоверение) заменяются общими компонентами из src/components.
//
// Запуск из корня превью:
//   node scripts/legacy-to-astro.mjs <папка старой страницы> <адрес на сайте>
//   node scripts/legacy-to-astro.mjs ../preview/orkt orkt
//   node scripts/legacy-to-astro.mjs webinar-trauma webinar-ptsd
//   node scripts/legacy-to-astro.mjs glavnaya index        (главная: адрес /, блоки под именем home)
import fs from 'node:fs';
import path from 'node:path';

const [srcDir, route] = process.argv.slice(2);
if (!srcDir || !route) {
  console.error('Нужно: node scripts/legacy-to-astro.mjs <папка> <адрес>');
  process.exit(1);
}
const ROOT = process.cwd();
const html = fs.readFileSync(path.join(srcDir, 'index.html'), 'utf8');
// Главная: адрес «index» → страница src/pages/index.astro, блоки и данные — под именем home
const pageName = route === 'index' ? 'index' : route;
const slug = route === 'index' ? 'home' : route;
// Если исходник — папка превью в корне репозитория, она сама попадает в сборку (scripts/copy-legacy.mjs).
// Тогда относительные ссылки на её файлы (img/x.webp, page.js) ведём в неё: /glavnaya/img/x.webp.
const inRepo = path.resolve(srcDir, '..') === path.resolve(ROOT);
const assetBase = inRepo ? `/${path.basename(path.resolve(srcDir))}/` : null;
const RELATIVE = /^(?!\/|#|[a-z][a-z0-9+.-]*:|\{)(?:\.\/)?(.+)$/i;
const absolutize = (value) => {
  if (!assetBase) return value;
  const m = value.match(RELATIVE);
  return m ? assetBase + m[1] : value;
};
// Пути меняем только в разметке и стилях: внутри <script> они бывают кусками строк ('src="' + url + '"')
const absolutizeMarkup = (code) => !assetBase ? code : code.split(/(<script\b[\s\S]*?<\/script>)/i)
  .map((part, i) => (i % 2 ? part : absolutizeOutside(part))).join('');
const absolutizeOutside = (code) => code
  .replace(/\b(src|href|poster|data-src|data-original|data-bg)="([^"]*)"/g, (all, a, v) => `${a}="${absolutize(v)}"`)
  .replace(/\bsrcset="([^"]*)"/g, (all, v) => `srcset="${v.split(',').map((part) => {
    const [u, ...rest] = part.trim().split(/\s+/);
    return [absolutize(u), ...rest].join(' ');
  }).join(', ')}"`)
  .replace(/url\((['"]?)([^'")]+)\1\)/g, (all, q, v) => `url(${q}${absolutize(v)}${q})`);

// ---------- head ----------
const head = html.slice(0, html.indexOf('</head>'));
const pick = (re) => (head.match(re) || [])[1];
const unescape = (s) => (s ?? '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
const seo = {
  title: unescape(pick(/<title>([\s\S]*?)<\/title>/)).trim(),
  description: unescape(pick(/<meta name="description" content="([^"]*)"/)),
  canonical: pick(/<link rel="canonical" href="([^"]*)"/) || `https://modern-psy.ru/${route}`,
  ogImage: pick(/<meta property="og:image" content="([^"]*)"/),
};
const ogTitle = unescape(pick(/<meta property="og:title" content="([^"]*)"/));
const ogDescription = unescape(pick(/<meta property="og:description" content="([^"]*)"/));
if (ogTitle && ogTitle !== seo.title) seo.ogTitle = ogTitle;
if (ogDescription && ogDescription !== seo.description) seo.ogDescription = ogDescription;
const preconnect = [...head.matchAll(/<link rel="preconnect" href="([^"]*)"/g)].map((m) => m[1]);
const stylesheets = [...head.matchAll(/<link rel="stylesheet" href="([^"]*)"/g)].map((m) => m[1]);
const scripts = [...head.matchAll(/<script src="([^"]*)"[^>]*><\/script>/g)].map((m) => m[1]);
const externalHead = [...head.matchAll(/<link rel="stylesheet" href="(https?:[^"]*)"/g)].map((m) => m[1]);
// Внешние скрипты (виджет BotHelp и т.п.) остаются в <head> как были
const externalScripts = [...head.matchAll(/<script src="(https?:[^"]*)"([^>]*)><\/script>/g)].map((m) => `  <script slot="head" is:inline src="${m[1]}"${m[2]}></script>`);

// ---------- body ----------
const mainOpen = html.match(/<main\b[^>]*>/);
if (!mainOpen) throw new Error('в странице нет <main>');
const mainStart = mainOpen.index + mainOpen[0].length;
const mainEnd = html.lastIndexOf('</main>');
const inner = html.slice(mainStart, mainEnd);
const bodyOpen = html.match(/<body\b[^>]*>/);
const beforeMain = html.slice(bodyOpen.index + bodyOpen[0].length, mainOpen.index);
const afterMain = html.slice(mainEnd + '</main>'.length, html.lastIndexOf('</body>'));
// Копию шапки сайта внутри страницы (главная собирает её из apps/tilda/header) не переносим:
// на сайте Astro шапку и подвал ставит общий шаблон страницы (SiteHeader, SiteFooter).
const embeddedHeader = /ШАПКА САЙТА/.test(beforeMain);

// Простой разбор: делим содержимое <main> на элементы верхнего уровня.
// Комментарии и пробелы перед элементом прилипают к нему.
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
function topLevel(src) {
  const chunks = [];
  let depth = 0, sectionDepth = 0, start = 0;
  const re = /<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1>|<\/?([a-zA-Z][\w-]*)\b[^>]*?>/g;
  let m;
  while ((m = re.exec(src))) {
    const tok = m[0];
    if (tok.startsWith('<!--')) continue;
    if (m[1]) { // script/style целиком
      if (depth === 0) { chunks.push(src.slice(start, re.lastIndex)); start = re.lastIndex; }
      continue;
    }
    const name = m[2].toLowerCase();
    const closing = tok.startsWith('</');
    const selfClosing = VOID.has(name) || tok.endsWith('/>');
    // Внутри <section> считаем только сами секции: незакрытые <p> или <li>
    // в старой разметке не должны сбивать разбор.
    if (name === 'section') sectionDepth += closing ? -1 : 1;
    else if (sectionDepth > 0 || (closing && depth === 0)) continue;
    if (name === 'section' && (closing ? sectionDepth > 0 : sectionDepth > 1)) continue;
    if (closing) {
      depth--;
      if (depth === 0) { chunks.push(src.slice(start, re.lastIndex)); start = re.lastIndex; }
    } else if (!selfClosing) {
      depth++;
    } else if (depth === 0) {
      chunks.push(src.slice(start, re.lastIndex)); start = re.lastIndex;
    }
  }
  const rest = src.slice(start);
  if (rest.trim()) chunks.push(rest);
  return chunks;
}

// В Astro фигурные скобки в тексте — это код. Экранируем их в тексте,
// а теги <script> и <style> помечаем is:inline, чтобы Astro оставил их как есть.
function toAstro(fragment) {
  return fragment.replace(
    /(<(script|style)\b)([^>]*>)([\s\S]*?<\/\2>)|(<!--[\s\S]*?-->)|(<[^>]+>)|([^<]+)/g,
    (all, open, _n, rest, body, comment, tag, text) => {
      if (open) return /\bis:inline\b/.test(rest) ? all : `${open} is:inline${rest}${body}`;
      if (comment) return comment.replace(/[{}]/g, (c) => (c === '{' ? '(' : ')'));
      if (tag) return tag;
      return text.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
    },
  );
}

const slugOf = (chunk, n) => {
  const id = (chunk.match(/<[a-z]+\b[^>]*\bid="([^"]+)"/) || [])[1];
  const cls = (chunk.match(/<[a-z]+\b[^>]*\bclass="([^"\s]+)/) || [])[1];
  const base = (id || cls || `block-${n}`).replace(/_component$/, '').replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
  return `${String(n).padStart(2, '0')}-${base}`.slice(0, 40).replace(/-+$/, '');
};

const compDir = path.join(ROOT, 'src/components', slug);
fs.rmSync(compDir, { recursive: true, force: true });
fs.mkdirSync(compDir, { recursive: true });
const imports = [];
const uses = [];
let n = 0;
// Если секции лежат внутри одной обёртки (<main><div class="wa"> … </div></main>),
// обёртку оставляем на странице, а делим её содержимое.
let wrapOpen = '', wrapClose = '', body = inner;
const parts = topLevel(inner).filter((c) => c.trim());
if (parts.length === 1) {
  const w = parts[0].match(/^(\s*(?:<!--[\s\S]*?-->\s*)*)(<(div)\b[^>]*>)([\s\S]*)(<\/div>)\s*$/);
  if (w && /<section\b/.test(w[4])) { wrapOpen = w[1] + w[2]; wrapClose = w[5]; body = w[4]; }
}
for (const chunk of topLevel(body)) {
  if (!chunk.trim()) continue;
  n++;
  const name = slugOf(chunk, n);
  const comp = 'S' + String(n).padStart(2, '0');
  fs.writeFileSync(
    path.join(compDir, `${name}.astro`),
    `---\n// ${slug}: блок ${n}. Перенесён со старой страницы как есть (scripts/legacy-to-astro.mjs).\n---\n${toAstro(absolutizeMarkup(chunk.replace(/^\s*\n/, ''))).trimEnd()}\n`,
  );
  imports.push(`import ${comp} from '../components/${slug}/${name}.astro';`);
  uses.push(`    <${comp} />`);
}

// ---------- стили, скрипты, файлы ----------
const styleDir = path.join(ROOT, 'src/styles', slug);
const scriptDir = path.join(ROOT, 'src/scripts', slug);
const publicDir = path.join(ROOT, 'public', slug);
for (const d of [styleDir, scriptDir, publicDir]) fs.rmSync(d, { recursive: true, force: true });
const cssImports = [];
for (const href of stylesheets) {
  if (/^https?:/.test(href)) continue;
  if (href.startsWith('/')) { cssImports.push(`import '../..${href}';`); continue; }
  const file = path.basename(href);
  fs.mkdirSync(styleDir, { recursive: true });
  const css = fs.readFileSync(path.join(srcDir, href), 'utf8');
  fs.writeFileSync(path.join(styleDir, file), absolutizeMarkup(css));
  cssImports.push(`import '../styles/${slug}/${file}';`);
}
const jsImports = [];
for (const src of scripts) {
  if (/^https?:/.test(src) || src.startsWith('/')) continue;
  const file = path.basename(src);
  fs.mkdirSync(scriptDir, { recursive: true });
  fs.copyFileSync(path.join(srcDir, src), path.join(scriptDir, file));
  jsImports.push(`  import '../scripts/${slug}/${file}';`);
}
const SKIP = new Set(['index.html', 'README.md', 'TZ.md', 'STATE.md', 'AGENTS.md', 'tilda']);
const used = new Set([...stylesheets, ...scripts].map((s) => path.basename(s)));
for (const entry of (assetBase ? [] : fs.readdirSync(srcDir, { withFileTypes: true }))) {
  if (SKIP.has(entry.name) || used.has(entry.name) || /\.(mjs|py)$/.test(entry.name)) continue;
  if (entry.isFile() && /\.(css|js)$/.test(entry.name)) continue;
  fs.mkdirSync(publicDir, { recursive: true });
  fs.cpSync(path.join(srcDir, entry.name), path.join(publicDir, entry.name), { recursive: true });
}

// ---------- данные и страница ----------
fs.mkdirSync(path.join(ROOT, 'src/data/pages'), { recursive: true });
const dataFile = path.join(ROOT, 'src/data/pages', `${slug}.json`);
const data = fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile, 'utf8')) : {};
data.seo = seo;
data.preconnect = preconnect;
fs.writeFileSync(dataFile, JSON.stringify(data, null, 2) + '\n');

const mainAttrs = mainOpen[0].slice(5, -1).trim();
const page = `---
// Страница /${route === 'index' ? '' : route}. Перенесена со старой страницы ${path.basename(srcDir)} (scripts/legacy-to-astro.mjs).
// Тексты блоков — в src/components/${slug}/, заголовок и описание — в src/data/pages/${slug}.json.
import PageLayout from '../layouts/PageLayout.astro';
import page from '../data/pages/${slug}.json';
${cssImports.join('\n')}
${imports.join('\n')}
---
<PageLayout seo={page.seo} preconnect={page.preconnect}>
${externalHead.map((h) => `  <link slot="head" rel="stylesheet" href="${h}" />`).join('\n')}
${externalScripts.join('\n')}
${embeddedHeader ? '<!-- Шапка сайта — общий компонент SiteHeader в шаблоне страницы -->' : toAstro(absolutizeMarkup(beforeMain)).trim()}
  <main ${mainAttrs}>
${wrapOpen ? '  ' + toAstro(wrapOpen).trim() + '\n' : ''}${uses.join('\n')}
${wrapClose ? '  ' + wrapClose + '\n' : ''}  </main>
${toAstro(absolutizeMarkup(afterMain)).trim()}
</PageLayout>
${jsImports.length ? `<script>\n${jsImports.join('\n')}\n</script>` : ''}
`;
fs.writeFileSync(path.join(ROOT, 'src/pages', `${pageName}.astro`), page);
console.log(`/${route}: ${n} блоков, ${cssImports.length} файлов стилей, ${jsImports.length} скриптов`);
