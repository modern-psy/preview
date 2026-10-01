import fs from 'node:fs/promises';
import {renderFoundation} from '../../shared/academy/foundation-render.mjs';
import {renderPracticePath} from '../../shared/academy/practice-path-render.mjs';
import {renderCta} from '../../shared/academy/cta-render.mjs';
const root = new URL('./', import.meta.url);
const read = async name => JSON.parse(await fs.readFile(new URL(`data/${name}.json`, root), 'utf8'));
const path = new URL('index.html', root);
let source = await fs.readFile(path, 'utf8');
const sections = {
  'practice-path': renderPracticePath(await read('practice-path')),
  foundation: renderFoundation(await read('foundation')),
  grant: `<section class="section_grant section-spacing_component" id="grant" aria-labelledby="grant-heading"><div class="padding-global"><div class="container-xlarge"><div class="column-grid_component"><div class="column-grid_content is-content-wide">${renderCta(await read('grant-cta'), {headingLevel: 2, headingId: 'grant-heading'})}</div></div></div></div></section>`,
};
for (const [name, section] of Object.entries(sections)) {
  const region = new RegExp(`<!-- ${name}:start -->[\\s\\S]*?<!-- ${name}:end -->`);
  if (!region.test(source)) throw new Error(`${name} insertion point missing.`);
  source = source.replace(region, () => `<!-- ${name}:start -->\n${section}\n<!-- ${name}:end -->`);
}
await fs.writeFile(path, source);
