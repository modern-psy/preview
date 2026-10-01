import fs from 'node:fs/promises';
import {renderLearningTimeline} from '../../shared/academy/learning-timeline-render.mjs';
const root = new URL('./', import.meta.url);
const data = JSON.parse(await fs.readFile(new URL('data/learning-timeline.json', root), 'utf8'));
const path = new URL('index.html', root);
const source = await fs.readFile(path, 'utf8');
const region = /<!-- learning:start -->[\s\S]*?<!-- learning:end -->/;
if (!region.test(source)) throw new Error('Learning timeline insertion point missing.');
await fs.writeFile(path, source.replace(region, () => `<!-- learning:start -->\n${renderLearningTimeline(data)}\n<!-- learning:end -->`));
