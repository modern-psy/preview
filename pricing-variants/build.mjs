// Локальная сборка превью: style.css, script.js и index.html с живыми блоками цены для нескольких курсов.
// Компонент общий: apps/preview/web-academy/shared/academy/pricing-promo.md. Запаска каждого блока строится
// той же функцией PricingPromo.render из снимка ответа API в data/<slug>.json.
// Запуск: node apps/preview/pricing-variants/build.mjs [--refresh]  (--refresh перекачивает снимки из API).
import fs from 'node:fs/promises';
import { assertResponsiveContract } from '../web-academy/shared/academy/responsive.mjs';
import { assertMotionContract } from '../web-academy/shared/academy/motion-contract.mjs';
import { loadPricingPromo } from '../web-academy/shared/academy/pricing-promo-tilda.mjs';

const root = new URL('./', import.meta.url);
const shared = new URL('../web-academy/shared/academy/', import.meta.url);
const read = (base, name) => fs.readFile(new URL(name, base), 'utf8');
const API = 'https://modern-psy-asp-prod-8ceb.twc1.net';

// Курсы для витрины: каждый показывает свой режим, который скрипт выбирает сам по данным CMS.
const courses = [
  { slug: 'child-psy', title: 'Один поток без тарифов', note: 'Одна цена на подсвеченном фоне. Рассрочки и повышения у курса нет, строки не показываются.' },
  { slug: 'sportivnaya-psihologiya', title: 'Один поток с рассрочкой', note: 'Та же одна цена, под ней строка «или … ₽/мес в рассрочку (24 мес.)»: у курса заполнено поле месяцев рассрочки, повышений нет.' },
  { slug: 'cbt-oxford', title: 'Два потока без тарифов', note: 'Строки потоков без табов, у каждой своя дата, цена и строка «Цена с … — …».' },
  { slug: 'kpt', title: 'Два потока, у одного рассрочка', note: 'То же, что выше; у потока с рассрочкой появляется строка «или … ₽/мес в рассрочку (24 мес.)».' },
  { slug: 'psyeducation', title: 'Два тарифа в одном потоке', note: 'Строки тарифов без табов, рекомендуемый (самый дорогой) с фоном. Описание тарифа появится, когда поле заполнят в CMS.' },
  { slug: 'mother', title: 'Три тарифа в одном потоке', note: 'Три строки тарифов, самый дорогой с фоном.' },
  { slug: 's-risk', title: 'Лист ожидания', note: 'Открытых потоков нет: заголовок «Запишитесь в лист ожидания», без дат и потоков, одна строка «Забронировать место» с ценой брони.' },
];

const refresh = process.argv.includes('--refresh');
await fs.mkdir(new URL('data/', root), { recursive: true });
for (const course of courses) {
  const file = new URL(`data/${course.slug}.json`, root);
  const exists = await fs.access(file).then(() => true, () => false);
  if (refresh || !exists) {
    const response = await fetch(`${API}/api/public/course/${course.slug}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`API ${response.status} for ${course.slug}`);
    await fs.writeFile(file, JSON.stringify(await response.json(), null, 2) + '\n');
  }
}

const components = await read(shared, 'components.css');
const base = components.split('.column-grid_component {')[0].trimEnd();
const metaPill = components.slice(components.indexOf('.meta-pill_component {'), components.indexOf('.hero_content {')).trimEnd();
const modules = await Promise.all(['card-spacing', 'section-spacing', 'body-text', 'section-heading'].map(name => read(shared, `${name}.css`)));
const promo = await read(shared, 'pricing-promo.css');
const theme = await read(root, 'theme.css');
const css = ['/* Собрано build.mjs: база, meta-pill и pricing-promo.css из apps/preview/web-academy/shared/academy, затем theme.css. Править исходники и пересобирать. */', base, metaPill, ...modules, promo, theme].join('\n\n');
assertResponsiveContract(css, 'pricing-variants/style.css');
assertMotionContract(css, 'pricing-variants/style.css');
await fs.writeFile(new URL('style.css', root), css);

const PricingPromo = await loadPricingPromo();
const js = ['// Собрано build.mjs из apps/preview/web-academy/shared/academy: pricing.js (табы потоков), pricing-promo-render.js (раскладка по данным), pricing-promo.js (запрос к CMS).', await read(shared, 'pricing.js'), await read(shared, 'pricing-promo-render.js'), await read(shared, 'pricing-promo.js')].join('\n');
await fs.writeFile(new URL('script.js', root), js);

const escapeHtml = value => value.replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);
const sections = [];
for (const [index, course] of courses.entries()) {
  const n = index + 1;
  const snapshot = JSON.parse(await read(root, `data/${course.slug}.json`));
  const config = PricingPromo.fromApi(snapshot, { id: `${course.slug}-pricing` });
  const markup = PricingPromo.render(config);
  const mode = markup.match(/data-mode="([a-z-]+)"/)[1];
  sections.push(`      <section class="section_variant-note" aria-labelledby="variant-${n}-title">
        <div class="padding-global">
          <div class="variant-note_component">
            <p class="variant-note_label">Курс ${escapeHtml(course.slug)} · режим ${mode} · потоков: ${config.streams.length}${config.waitlist ? ', лист ожидания' : ''}</p>
            <h2 class="variant-note_heading" id="variant-${n}-title">${escapeHtml(course.title)}</h2>
            <p class="variant-note_text">${course.note}</p>
          </div>
        </div>
      </section>
      <!-- pricing-${n}:start -->
      <section class="section_pricing section-spacing_component" id="variant-${n}" aria-labelledby="${course.slug}-pricing-heading">
        <div class="padding-global"><div class="container-xlarge column-grid_component"><div class="column-grid_content is-content-wide">
          <div class="pricing-promo_card"><div class="pricing-promo" data-price-block data-course="${escapeHtml(course.slug)}" data-api="${API}" data-block-id="${course.slug}-pricing">
${markup}
          </div></div>
        </div></div></div>
      </section>
      <!-- pricing-${n}:end -->`);
}

const html = `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Блок «Цена обучения»: живые варианты — АСП</title>
    <meta name="description" content="Промо-блок «Цена обучения», который сам выбирает раскладку по данным CMS: один или несколько потоков, тарифы, повышения, лист ожидания.">
    <meta name="robots" content="noindex, nofollow">
    <link rel="preconnect" href="https://static.tildacdn.com" crossorigin>
    <link rel="preconnect" href="${API}" crossorigin>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Wix+Madefor+Text:wght@400;444;500;600&amp;display=swap" rel="stylesheet">
    <link rel="stylesheet" href="./style.css" />
    <script src="./script.js" defer></script>
  </head>
  <body>
    <main class="main-wrapper academy-page pricing-variants-page" id="main-content" tabindex="-1">
      <section class="section_intro" aria-labelledby="intro-heading">
        <div class="padding-global">
          <div class="intro_component">
            <h1 class="section-title_component is-responsive" id="intro-heading">Блок «Цена обучения»: живые варианты</h1>
            <p class="intro_lead">Один блок, шесть курсов из CMS. Скрипт запрашивает курс в Public API, смотрит потоки, тарифы, рассрочку, повышения и лист ожидания и сам выбирает раскладку. В HTML стоит запаска, собранная той же функцией из снимка API при вёрстке; она остаётся, если API не ответил. Правила из <code>docs/tilda-pricing-block.md</code>: крупно цена продажи, рассрочка строкой, одно ближайшее повышение.</p>
          </div>
        </div>
      </section>
${sections.join('\n')}
    </main>
  </body>
</html>
`;
await fs.writeFile(new URL('index.html', root), html);
console.log(`pricing-variants: ${courses.length} курсов, style.css ${css.length} симв., script.js ${js.length} симв.`);
