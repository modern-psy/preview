import fs from 'node:fs/promises';
import {renderRecognition} from '../../shared/academy/recognition-render.mjs';
const root = new URL('./', import.meta.url);
const data = JSON.parse(await fs.readFile(new URL('data/recognition.json', root), 'utf8'));
const path = new URL('index.html', root);
const source = await fs.readFile(path, 'utf8');
const region = /<!-- recognition:start -->[\s\S]*?<!-- recognition:end -->|<section class="section_audience\b[\s\S]*?<\/section>/;
if (!region.test(source)) throw new Error('Recognition insertion point missing.');
await fs.writeFile(path, source.replace(region, () => `<!-- recognition:start -->\n${renderRecognition(data)}\n<!-- recognition:end -->`));
