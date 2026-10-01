import fs from 'node:fs/promises';
import { renderPricing } from '../../shared/academy/pricing-render.mjs';

const root = new URL('./', import.meta.url);
const data = JSON.parse(await fs.readFile(new URL('data/pricing.json', root), 'utf8'));
const source = new URL('index.html', root);
const html = await fs.readFile(source, 'utf8');
const markup = `<!-- pricing:start -->\n<section class="section_pricing section-spacing_component is-inset" id="pricing" aria-labelledby="pricing-heading" data-node-id="14:731"><div class="padding-global"><div class="consultant-pricing_container">\n${renderPricing(data)}\n</div></div></section>\n<!-- pricing:end -->`;
const next = html.includes('<!-- pricing:start -->') ? html.replace(/<!-- pricing:start -->[\s\S]*?<!-- pricing:end -->/, markup) : html.replace('      <section class="section_admission"', markup + '\n      <section class="section_admission"');
if (next !== html) await fs.writeFile(source, next);
