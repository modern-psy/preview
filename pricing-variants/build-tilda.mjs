// CLI: блок «Цена обучения» для Тильды на один курс. Сборка делается общим модулем web-academy
// (shared/academy/pricing-promo-tilda.mjs); здесь только запрос к API, снимок и запись файлов.
// Запуск: node apps/preview/pricing-variants/build-tilda.mjs <slug>
// Результат: apps/tilda/pricing-block/<slug>.html, preview-<slug>.html (живой API), preview-<slug>-offline.html (API недоступен).
import fs from 'node:fs/promises';
import { buildPricingPromoBlock } from '../web-academy/shared/academy/pricing-promo-tilda.mjs';

const slug = process.argv.slice(2).find(arg => !arg.startsWith('--'));
if (!slug || !/^[a-z][a-z0-9_-]*$/.test(slug)) throw new Error('Укажите слаг курса: node build-tilda.mjs child-psy');
const API = 'https://modern-psy-asp-prod-8ceb.twc1.net';
const root = new URL('./', import.meta.url);
const out = new URL('../../tilda/pricing-block/', import.meta.url);

let course;
try {
  const response = await fetch(`${API}/api/public/course/${slug}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  course = await response.json();
  await fs.mkdir(new URL('data/', root), { recursive: true });
  await fs.writeFile(new URL(`data/${slug}.json`, root), JSON.stringify(course, null, 2) + '\n');
} catch (error) {
  course = JSON.parse(await fs.readFile(new URL(`data/${slug}.json`, root), 'utf8'));
  console.warn(`API недоступен (${error.message}), запаска из data/${slug}.json`);
}

const page = (title, body) => `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<!-- Имитация страницы Тильды: фон, шрифт и чужие стили тегов. Сам блок — копия ${slug}.html. -->
<link href="https://fonts.googleapis.com/css2?family=Wix+Madefor+Text:wght@400;444;500;600&display=swap" rel="stylesheet">
<style>
  body { margin: 0; padding: 3rem 0; background: #f5f5f5; font-family: "Wix Madefor Text", Arial, sans-serif; color: #2b2334; }
  .t123 p { margin: 0 0 1em; } .t123 h2 { margin: 1em 0; } .t123 ul { padding-left: 2em; }
</style>
</head>
<body>
<div class="t123">
${body}
</div>
</body>
</html>
`;

const live = await buildPricingPromoBlock({ slug, course, api: API, builtBy: 'apps/preview/pricing-variants/build-tilda.mjs' });
const offline = await buildPricingPromoBlock({ slug, course, api: 'https://api.invalid', builtBy: 'apps/preview/pricing-variants/build-tilda.mjs' });
await fs.mkdir(out, { recursive: true });
await fs.writeFile(new URL(`${slug}.html`, out), live.html);
await fs.writeFile(new URL(`preview-${slug}.html`, out), page(`Проверка · блок цены «${course.title}»`, live.html));
await fs.writeFile(new URL(`preview-${slug}-offline.html`, out), page(`Проверка без API · блок цены «${course.title}»`, offline.html));
console.log(`apps/tilda/pricing-block/${slug}.html: режим ${live.mode}, ${live.html.length} символов`);
