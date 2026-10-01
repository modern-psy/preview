import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {renderFaq} from '../../../shared/academy/faq-render.mjs';
const root = new URL('../', import.meta.url);
const data = JSON.parse(await fs.readFile(new URL('data/faq.json', root), 'utf8'));

test('FAQ instances retain all answers, native controls and independent heading IDs', () => {
  const html = renderFaq(data) + renderFaq(data, {id: 'faq-second'});
  assert.equal((html.match(/<details\b/g) || []).length, data.items.length * 2);
  assert.equal((html.match(/<summary\b/g) || []).length, data.items.length * 2);
  assert.equal((html.match(/data-accordion-single/g) || []).length, 2);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const label of html.matchAll(/aria-labelledby="([^"]+)"/g)) assert.ok(ids.includes(label[1]));
  assert.equal((html.match(/class="toggle-icon_glyph"/g) || []).length, data.items.length * 2);
  assert.doesNotMatch(html, /<details[^>]*\sopen(?:\s|>)|<script|<svg|tabindex/);
  const paragraphs = data.items.reduce((sum, item) => sum + item.answer.length, 0);
  assert.equal((html.match(/<p>/g) || []).length, paragraphs * 2);
  assert.match(html, /data-action="support"/);
});

test('FAQ escapes content and handles absent support without changing accordion behavior', () => {
  const changed = structuredClone(data);
  changed.items[0].question = '<img src=x onerror=bad()> & вопрос';
  changed.items[0].answer = ['<script>bad()</script>'];
  delete changed.supportText;
  const html = renderFaq(changed);
  assert.match(html, /&lt;img src=x onerror=bad\(\)&gt; &amp; вопрос/);
  assert.match(html, /&lt;script&gt;bad\(\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /faq_support-action|<script|<img/);
  assert.throws(() => renderFaq(data, {id: 'bad"id'}));
  assert.throws(() => renderFaq({...data, items: []}));
});
