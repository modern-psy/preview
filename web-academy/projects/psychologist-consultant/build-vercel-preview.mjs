import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

// Team review uses the same self-contained page as the Tilda preview.
// Only the static export is deployed; source data and other landings stay out.
const root = new URL('./', import.meta.url);
execFileSync(process.execPath, [
  fileURLToPath(new URL('build-tilda-bundle.mjs', root)), '--preview-only',
], { stdio: 'inherit' });

const html = (await fs.readFile(new URL('tilda/preview.html', root), 'utf8'))
  .replace('<title>Проверка Tilda — Психолог-консультант</title>',
    '<title>Психолог-консультант — командное превью</title>')
  .replace('<style>a,button{color:red!important}</style>', '');
if (/(?:src|href)="(?:\.\.?\/|assets\/)|figma\.com\/api\/mcp\/asset|localhost|127\.0\.0\.1/.test(html)) {
  throw new Error('Team preview must not depend on local or temporary asset URLs.');
}

const output = new URL('exports/vercel/', root);
await fs.mkdir(output, { recursive: true });
await fs.writeFile(new URL('index.html', output), html);
await fs.writeFile(new URL('vercel.json', output), JSON.stringify({
  framework: null,
  buildCommand: null,
  installCommand: null,
  headers: [{ source: '/(.*)', headers: [
    { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
  ] }],
}, null, 2) + '\n');
console.log(`Team preview: ${fileURLToPath(output)}`);
