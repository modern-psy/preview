import fs from 'node:fs/promises';
import {renderProgram} from '../../shared/academy/program-render.mjs';
const root = new URL('./', import.meta.url);
const data = JSON.parse(await fs.readFile(new URL('data/program.json', root), 'utf8'));
const path = new URL('index.html', root);
const source = await fs.readFile(path, 'utf8');
const region = /<!-- program:start -->[\s\S]*?<!-- program:end -->/;
if (!region.test(source)) throw new Error('Program insertion point missing.');
await fs.writeFile(path, source.replace(region, () => `<!-- program:start -->\n${renderProgram(data)}\n<!-- program:end -->`));
