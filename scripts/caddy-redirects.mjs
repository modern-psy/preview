// Превращает src/data/redirects.json в правила переадресации для сервера Caddy (настоящие 301).
// Запускается при сборке образа (Dockerfile), руками не нужно.
// Каждый адрес ловится и без слеша на конце, и со слешем: /pbt и /pbt/.
import fs from 'node:fs';
const redirects = JSON.parse(fs.readFileSync(new URL('../src/data/redirects.json', import.meta.url), 'utf8'));
const quote = (s) => `"${String(s).replace(/"/g, '\\"')}"`;
const lines = ['# Собрано scripts/caddy-redirects.mjs из src/data/redirects.json. Руками не править.'];
redirects.forEach((r, i) => {
  const from = '/' + r.from.replace(/^\/+|\/+$/g, '');
  lines.push(`@r${i} path ${quote(from)} ${quote(from + '/')}`);
  lines.push(`redir @r${i} ${quote(r.to)} 301`);
});
process.stdout.write(lines.join('\n') + '\n');
