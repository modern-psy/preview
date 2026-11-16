// Сохраняет снимки курсов из Public API в src/data/price-snapshots/<курс>.json.
// Снимок нужен, только если CMS не ответит во время сборки: тогда блок цены рисуется по нему.
// Запуск из корня превью: node scripts/price-snapshots.mjs orkt rodbt-live …
// Без аргументов — обновляет все уже сохранённые снимки.
import fs from 'node:fs';
const API = 'https://modern-psy-asp-prod-8ceb.twc1.net';
const dir = new URL('../src/data/price-snapshots/', import.meta.url);
fs.mkdirSync(dir, { recursive: true });
let slugs = process.argv.slice(2);
if (!slugs.length) slugs = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
for (const slug of slugs) {
  const res = await fetch(`${API}/api/public/course/${slug}`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) { console.error(`${slug}: CMS ответила ${res.status}`); process.exitCode = 1; continue; }
  fs.writeFileSync(new URL(`${slug}.json`, dir), JSON.stringify(await res.json(), null, 2) + '\n');
  console.log(`${slug}: снимок сохранён`);
}
