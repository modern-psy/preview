import fs from 'node:fs/promises';
import {renderReviews} from '../../shared/academy/reviews-render.mjs';
const root = new URL('./', import.meta.url);
const data = JSON.parse(await fs.readFile(new URL('data/reviews.json', root), 'utf8'));
const source = new URL('index.html', root);
const html = await fs.readFile(source, 'utf8');
const markup = `<!-- reviews:start -->\n<section class="section_reviews section-spacing_component" id="reviews" aria-labelledby="reviews-heading"><div class="padding-global"><div class="container-xlarge">${renderReviews(data)}</div></div></section>\n<!-- reviews:end -->`;
const next = html.includes('<!-- reviews:start -->') ? html.replace(/<!-- reviews:start -->[\s\S]*?<!-- reviews:end -->/, markup) : html.replace('<!-- pricing:start -->', markup + '\n<!-- pricing:start -->');
if (next !== html) await fs.writeFile(source, next);
