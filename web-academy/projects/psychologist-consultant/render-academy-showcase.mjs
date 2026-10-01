import fs from 'node:fs/promises';
import {renderAcademyShowcase} from '../../shared/academy/academy-showcase-render.mjs';
const root = new URL('./', import.meta.url);
const data = JSON.parse(await fs.readFile(new URL('data/academy-showcase.json', root), 'utf8'));
const file = new URL('index.html', root);
const source = await fs.readFile(file, 'utf8');
const region = /<!-- academy-showcase:start -->[\s\S]*?<!-- academy-showcase:end -->/;
if (!region.test(source)) throw new Error('Academy showcase insertion point missing.');
await fs.writeFile(file, source.replace(region, () => `<!-- academy-showcase:start -->\n${renderAcademyShowcase(data)}\n<!-- academy-showcase:end -->`));
