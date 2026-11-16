// Настройки сборки превью на Astro.
// 🔴 Служебный файл. Менять, только если понимаешь, что делаешь.
//
// Как устроено:
//   • src/pages — новые страницы на компонентах. Адрес = путь файла: src/pages/orkt.astro → /orkt/.
//   • старые папки превью (orkt/, act/, academy-base/ …) после сборки копируются в dist как есть —
//     этим занимается scripts/copy-legacy.mjs. Если у адреса уже есть страница в src/pages,
//     старая папка с тем же именем не копируется.
//   • tilda-export/ — страницы из экспорта Тильды, которые ещё не переверстаны. Временные.
//   • переадресации — src/data/redirects.json (старые адреса Тильды и старые имена папок превью).
import { defineConfig } from 'astro/config';
import redirects from './src/data/redirects.json' with { type: 'json' };

export default defineConfig({
  site: 'https://modern-psy-preview-5a99.twc1.net',
  output: 'static',
  // /orkt и /orkt/ открывают одну страницу, файл ложится в dist/orkt/index.html
  trailingSlash: 'ignore',
  build: { format: 'directory', assets: '_astro' },
  // Папка public не нужна: статичные файлы старых страниц копирует scripts/copy-legacy.mjs
  publicDir: 'public',
  redirects: Object.fromEntries(redirects.map((r) => [r.from, { status: 301, destination: r.to }])),
  // Предупреждение Vite о больших файлах нам не важно: стили страниц крупные
  vite: { build: { chunkSizeWarningLimit: 2000 } },
});
