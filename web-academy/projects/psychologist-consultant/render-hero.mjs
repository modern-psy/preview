import fs from 'node:fs/promises';
import {renderHeroSection, replaceHeroRegion} from '../../shared/academy/hero-render.mjs';

const root = new URL('./', import.meta.url);
const json = async file => JSON.parse(await fs.readFile(new URL(`data/${file}.json`, root), 'utf8'));
const [data, assets, actions] = await Promise.all(['hero', 'assets', 'actions'].map(json));
const source = new URL('index.html', root);
const html = await fs.readFile(source, 'utf8');
const next = replaceHeroRegion(html, renderHeroSection(data, {assets, actions}));
if (next !== html) await fs.writeFile(source, next);
