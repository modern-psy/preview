// Блок цены из CMS для страниц на Astro.
//
// Генератор тот же, что собирает блоки для Тильды (src/lib/price-auto — копия apps/preview/pricing/src).
// При сборке сайта берём свежий курс из Public API и рисуем блок; в браузере скрипт блока
// сам перезапрашивает CMS и обновляет цены, как на Тильде.
// Если CMS не ответила за 15 секунд, берём сохранённый снимок src/data/price-snapshots/<курс>.json,
// чтобы сборка не падала. Обновить снимки: node scripts/price-snapshots.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import css from './price-auto/price-auto.css?raw';
import js from './price-auto/price-auto.js?raw';
import tilda from './price-auto/tilda-block.js?raw';

let T;
function generator() {
  if (T) return T;
  const sandbox = { console, Intl, Date, Math, JSON, String, Number, Array, Object, isNaN };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(js, sandbox);
  vm.runInNewContext(tilda, sandbox);
  T = sandbox.PriceAutoTilda;
  return T;
}

const cache = new Map();
export async function loadCourse(slug) {
  if (cache.has(slug)) return cache.get(slug);
  const promise = (async () => {
    try {
      const res = await fetch(`${generator().API}/api/public/course/${slug}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`CMS ответила ${res.status}`);
      return { course: await res.json(), source: 'cms' };
    } catch (error) {
      const file = new URL(`../data/price-snapshots/${slug}.json`, import.meta.url);
      if (!fs.existsSync(file)) throw new Error(`курс ${slug}: CMS не ответила (${error.message}), снимка нет`);
      console.warn(`⚠️  курс ${slug}: CMS не ответила (${error.message}), беру снимок`);
      return { course: JSON.parse(fs.readFileSync(file, 'utf8')), source: 'snapshot' };
    }
  })();
  cache.set(slug, promise);
  return promise;
}

const stripFonts = (code) => code
  .replace(/^<!--[\s\S]*?-->\s*/, '')
  .replace(/<link rel="preconnect" href="https:\/\/fonts\.(googleapis|gstatic)\.com"[^>]*>\s*/g, '')
  .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/g, '')
  .trim();

// Настройки — те же, что у генератора /pricing: system, terms, includes, layout, background, anchor, top, bottom.
export async function priceBlock(slug, options = {}) {
  const G = generator();
  const { course } = await loadCourse(slug);
  const settings = G.PAGES[slug] || {};
  const block = G.assemble({
    css, js, course, slug,
    system: 'figure', terms: true, layout: 'wa-narrow', anchor: 'price', top: 'section', bottom: 'section',
    includes: settings.includes ? [...settings.includes] : [],
    ...options,
  });
  for (const p of block.problems) if (!/больше \d+: Тильда/.test(p)) console.warn(`⚠️  цена ${slug}: ${p}`);
  return stripFonts(block.code);
}

export async function priceLd(slug, options = {}) {
  const G = generator();
  const { course } = await loadCourse(slug);
  const settings = G.PAGES[slug] || {};
  const ld = G.assembleLd({
    course, slug,
    instructors: (options.instructors || settings.instructors || []).map((x) => ({ ...x })),
  });
  return ld.code.replace(/^<!--[\s\S]*?-->\s*/, '').trim();
}
