import fs from 'node:fs/promises';
import {renderFaq} from '../../shared/academy/faq-render.mjs';
const root = new URL('./', import.meta.url);
const data = JSON.parse(await fs.readFile(new URL('data/faq.json', root), 'utf8'));
const file = new URL('index.html', root);
const source = await fs.readFile(file, 'utf8');
const region = /<!-- faq:start -->[\s\S]*?<!-- faq:end -->/;
if (!region.test(source)) throw new Error('FAQ insertion point missing.');
await fs.writeFile(file, source.replace(region, () => `<!-- faq:start -->\n${renderFaq(data)}\n<!-- faq:end -->`));
