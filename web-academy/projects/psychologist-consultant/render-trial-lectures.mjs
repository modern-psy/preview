import fs from 'node:fs/promises';
import {renderTrialLectures} from '../../shared/academy/trial-lectures-render.mjs';
const root = new URL('./', import.meta.url);
const data = JSON.parse(await fs.readFile(new URL('data/trial-lectures.json', root), 'utf8'));
const file = new URL('index.html', root);
const source = await fs.readFile(file, 'utf8');
const region = /<!-- trial-lectures:start -->[\s\S]*?<!-- trial-lectures:end -->/;
if (!region.test(source)) throw new Error('Trial lectures insertion point missing.');
await fs.writeFile(file, source.replace(region, () => `<!-- trial-lectures:start -->\n${renderTrialLectures(data)}\n<!-- trial-lectures:end -->`));
