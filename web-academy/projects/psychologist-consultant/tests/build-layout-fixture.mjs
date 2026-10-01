import fs from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const source=await fs.readFile(new URL('index.html',root),'utf8');
const styles=[...source.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)].map(m=>m[0].replace(/href="(?!https:)([^"]+)"/,(_,href)=>`href="../${href}"`)).join('\n');
const sections=['learning','trial-lectures','support-team'].map(id=>source.match(new RegExp('<section[^>]+id="'+id+'"[\\s\\S]*?</section>'))[0]).join('\n').replaceAll('src="assets/','src="../assets/');
await fs.writeFile(new URL('tests/layout-fixture.html',root),`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Адаптив секций</title>${styles}<main class="academy-page psychologist-consultant-page">${sections}</main></html>`);
