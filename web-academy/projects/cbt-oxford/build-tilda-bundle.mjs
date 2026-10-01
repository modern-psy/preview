import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {renderPage} from './render-page.mjs';
import {assertResponsiveContract} from '../../shared/academy/responsive.mjs';
import {assertMotionContract} from '../../shared/academy/motion-contract.mjs';

const root = fileURLToPath(new URL('./', import.meta.url));
const out = path.join(root, 'tilda');
const limit = 65000;
const hash = text => createHash('sha256').update(text).digest('hex');
const previousManifest = await fs.readFile(path.join(out, 'manifest.json'), 'utf8').then(JSON.parse).catch(error => {
  if (error.code === 'ENOENT') return {files: []};
  throw error;
});
let html = await renderPage();
await fs.mkdir(out, {recursive: true});
const stylesheetTags = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)];
const cssFiles = stylesheetTags.filter(([, url]) => !url.startsWith('https:'));
const styles = [];
for (const [, file] of cssFiles) {
  let css = await fs.readFile(path.resolve(root, file), 'utf8');
  assertMotionContract(css, file);
  // styles.css retains the approved 992px outer 8/12 grid; component bands are 521/768/1025.
  if (file !== 'styles.css') assertResponsiveContract(css, file);
  css = await replaceAsync(css, /url\(["']?([^"')]+)["']?\)/g, async (match, url) => {
    if (/^(data:|https:)/.test(url)) return match;
    const bytes = await fs.readFile(path.resolve(root, path.dirname(file), url));
    if (!url.endsWith('.svg')) throw new Error(`Unsupported CSS asset: ${url}`);
    return `url("data:image/svg+xml;base64,${bytes.toString('base64')}")`;
  });
  css = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
  if (/url\((?!["']?(?:data:|https:))/.test(css)) throw new Error(`Local CSS asset in ${file}`);
  styles.push(css);
  html = html.replace(`<link rel="stylesheet" href="${file}">`, '');
}
const scripts = [];
for (const [tag, file] of [...html.matchAll(/<script src="([^"]+)" defer><\/script>/g)]) {
  scripts.push(file.startsWith('https:') ? `<script src="${file}"></script>` : `<script>\n${await fs.readFile(path.resolve(root, file), 'utf8')}\n</script>`);
  html = html.replace(tag, '');
}
// Small project SVGs are embedded once per asset in scoped CSS. No altered SVG paths.
const decorations = new Map();
const allowLocalWebp = process.argv.includes('--allow-local-webp');
const localWebp = new Set();
html = await replaceAsync(html, /<img\b[^>]*\bsrc="(assets\/[^\"]+)"[^>]*>/g, async (tag, file) => {
  if (file.endsWith('.webp')) {
    // Локальные webp по умолчанию не инлайнятся: для каждого нужна постоянная CDN-ссылка.
    // Явное исключение только с флагом --allow-local-webp, и даже тогда каждый файл выводится в stderr.
    localWebp.add(file);
    if (!allowLocalWebp) return tag;
    console.error(`[webp] ${file} встроен как data URL по флагу --allow-local-webp; запросите CDN-ссылку и замените src`);
    const bytes = await fs.readFile(path.join(root, file));
    if (bytes.length > 16000) throw new Error(`Local raster ${file} needs a CDN URL or smaller export`);
    return tag.replace(`src="${file}"`, `src="data:image/webp;base64,${bytes.toString('base64')}"`);
  }
  if (!file.endsWith('.svg') || !/alt=""/.test(tag)) throw new Error(`Unsupported local image ${file}`);
  let asset = decorations.get(file);
  if (!asset) {
    asset = {key: `media-${decorations.size + 1}`, bytes: await fs.readFile(path.join(root, file))};
    decorations.set(file, asset);
  }
  const attributes = tag.replace(/^<img\b/, '').replace(/>$/, '').replace(/\s(?:src|alt|loading|decoding|fetchpriority)="[^"]*"/g, '');
  const width = Number(tag.match(/\bwidth="(\d+)"/)?.[1]);
  const height = Number(tag.match(/\bheight="(\d+)"/)?.[1]);
  if (!width || !height) throw new Error(`Missing image dimensions: ${file}`);
  return `<span${attributes.replace(/\saria-hidden="true"/g, '')} aria-hidden="true" data-cbt-media="${asset.key}" style="--cbt-media-width:${width / 16}rem;--cbt-media-height:${height / 16}rem"></span>`;
});
if (localWebp.size && !allowLocalWebp) {
  const list = [...localWebp].map(file => `  - ${file}`).join('\n');
  throw new Error(`Локальные webp не инлайнятся по умолчанию. Запросите у пользователя CDN-ссылку для каждого файла и замените src в index.html:\n${list}\nВременный обход для проверки сборки: node projects/cbt-oxford/build-tilda-bundle.mjs --allow-local-webp`);
}
styles.push(':where(.cbt-oxford-page [data-cbt-media]){display:inline-block;width:var(--cbt-media-width);height:var(--cbt-media-height);background-position:center;background-size:contain;background-repeat:no-repeat}' + [...decorations.values()].map(a => `.cbt-oxford-page [data-cbt-media="${a.key}"]{background-image:url("data:image/svg+xml;base64,${a.bytes.toString('base64')}")}`).join(''));
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1].replace(/>\s+</g, '><').trim();
assertResponsiveContract(scripts.join('\n'), 'JavaScript');
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1].replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').trim();
const records = [];
async function emit(name, content, placement) {
  if (content.length >= limit) throw new Error(`${name}: ${content.length} characters exceeds Tilda limit`);
  if (/\.\.\/\.\.\/shared\/|localhost|127\.0\.0\.1|(?:src|href)="assets\//.test(content)) throw new Error(`${name}: local runtime dependency`);
  await fs.writeFile(path.join(out, name), content);
  records.push({file: name, placement, characters: content.length, sha256: hash(content)});
}
await emit('head.html', head, 'HEAD');
let group = '', styleIndex = 1;
for (const css of styles) {
  if (group.length + css.length + 16 >= limit) { await emit(`styles-${styleIndex++}.html`, `<style>${group}</style>`, 'STYLE'); group = ''; }
  group += css + '\n';
}
if (group) await emit(`styles-${styleIndex}.html`, `<style>${group}</style>`, 'STYLE');
const main = body.match(/<main([^>]*)>([\s\S]*?)<\/main>/);
if (!main) throw new Error('Missing main landmark');
const sections = main[2].match(/<section\b[\s\S]*?<\/section>/g) || [];
if (!sections.length || main[2].replace(/<section\b[\s\S]*?<\/section>/g, '').trim()) throw new Error('Body must consist of complete sections');
const wrapper = `<div${main[1].replace(/\s+id="[^"]*"/, '')} data-cbt-part>`;
const sectionMetadata = {
  hero: {fileSlug: 'hero', title: 'Первый экран — КПТ: Оксфордская модель'},
  recognition: {fileSlug: 'recognition', title: 'Что мешает уверенно работать на практике'},
  'course-audience': {fileSlug: 'course-audience', title: 'Кому подойдёт курс'},
  ratings: {fileSlug: 'ratings', title: 'Рейтинги и оценки студентов'},
  'practice-stories': {fileSlug: 'practice-stories', title: 'Как обучение меняет практику'},
  'oxford-model': {fileSlug: 'oxford-model', title: 'Оксфордская модель — интерактивные табы'},
  'cbt-oxford-program': {fileSlug: 'program', title: 'Программа обучения'},
  teachers: {fileSlug: 'teachers', title: 'Преподаватели'},
  diploma: {fileSlug: 'diploma', title: 'Диплом'},
  'trial-lectures': {fileSlug: 'trial-lectures', title: 'Бесплатные занятия'},
  pricing: {fileSlug: 'pricing', title: 'Тарифы и потоки'},
  'cbt-oxford-form': {fileSlug: 'form', title: 'Форма заявки'},
  academy: {fileSlug: 'academy', title: 'Об Академии'},
  faq: {fileSlug: 'faq', title: 'Ответы на популярные вопросы'},
};
// One complete, readable section per T123; count the formatted output against the limit.
for (const [index, section] of sections.entries()) {
  const number = String(index + 1).padStart(2, '0');
  const opening = section.match(/^<section\b[^>]*>/)[0];
  const slug = opening.match(/\bid="([^"]+)"/)?.[1] || 'hero';
  const metadata = sectionMetadata[slug];
  if (!metadata) throw new Error(`Section ${slug} needs export metadata`);
  await emit(`${number}-body-${metadata.fileSlug}.html`, `<!-- Секция ${number}: ${metadata.title} -->\n${formatBody(`${wrapper}${section}</div>`)}`, 'BODY');
}
const data = body.replace(main[0], '').trim();
if (data) await emit('teachers-data.html', data, 'BODY');
scripts.push(`<script>(()=>{const parts=[...document.querySelectorAll('[data-cbt-part]')];const host=parts[0]?.closest('.t-records');if(host&&parts.every(part=>host.contains(part))&&!document.querySelector('main,[role="main"]'))host.setAttribute('role','main');})();</script>`);
await emitGroups(scripts, 'footer', 'FOOTER');
const content = await Promise.all(records.map(record => fs.readFile(path.join(out, record.file), 'utf8')));
const preview = `<!doctype html><html lang="ru"><head>${content.filter((_, i) => ['HEAD', 'STYLE'].includes(records[i].placement)).join('\n')}</head><body><main class="t-records">${content.filter((_, i) => records[i].placement === 'BODY').join('\n')}</main>${content.filter((_, i) => records[i].placement === 'FOOTER').join('\n')}</body></html>\n`;
await fs.writeFile(path.join(out, 'preview.html'), preview);
await fs.writeFile(path.join(out, 'manifest.json'), JSON.stringify({project: 'cbt-oxford', files: records, previewSha256: hash(preview)}, null, 2) + '\n');
// Retire only files owned by the previous build, after the new bundle succeeds.
for (const {file} of previousManifest.files) {
  if (path.basename(file) !== file || !/^(?:\d+-)?(?:head|styles-\d+|body(?:-[\w-]+)?|teachers-data|footer(?:-\d+)?)\.html$/.test(file)) continue;
  if (!records.some(record => record.file === file)) await fs.rm(path.join(out, file), {force: true});
}
console.log(JSON.stringify({files: records.map(({file, characters}) => ({file, characters})), previewCharacters: preview.length}));

async function emitGroups(parts, stem, placement, open = '', close = '') {
  let group = '', index = 1;
  const flush = async () => {
    await emit(`${stem}${index === 1 ? '' : `-${index}`}.html`, open + group + close, placement);
    index++; group = '';
  };
  for (const part of parts) {
    if (group.length + part.length + open.length + close.length + 1 >= limit && group) await flush();
    group += part + '\n';
  }
  if (group) await flush();
}

async function replaceAsync(text, regex, callback) {
  const matches = [...text.matchAll(regex)];
  for (const match of matches.reverse()) text = text.slice(0, match.index) + await callback(...match) + text.slice(match.index + match[0].length);
  return text;
}

function formatBody(markup) {
  // Break only between tags at structural boundaries. Keep inline text, spaces,
  // non-breaking spaces and inline markup intact (including animated text).
  const blocks = new Set(['div', 'section', 'article', 'header', 'footer', 'nav', 'aside', 'ul', 'ol', 'li', 'form', 'fieldset', 'figure', 'figcaption', 'blockquote']);
  const tags = /<\/?([a-z][a-z0-9-]*)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
  let result = '', cursor = 0, depth = 0, previousBlock = false;
  for (const match of markup.matchAll(tags)) {
    const tag = match[0], name = match[1].toLowerCase();
    const block = blocks.has(name) || name.startsWith('academy-');
    const closing = tag.startsWith('</');
    if (block && closing) depth--;
    const gap = markup.slice(cursor, match.index);
    result += cursor && /^\s*$/.test(gap) && (previousBlock || block)
      ? `\n${'  '.repeat(depth)}` : gap;
    result += tag;
    if (block && !closing) depth++;
    previousBlock = block;
    cursor = match.index + tag.length;
  }
  result += markup.slice(cursor);
  if (depth !== 0 || result.replace(/>\s+</g, '><') !== markup.replace(/>\s+</g, '><')) {
    throw new Error('BODY formatting changed content or found unbalanced structural tags');
  }
  return result + '\n';
}
