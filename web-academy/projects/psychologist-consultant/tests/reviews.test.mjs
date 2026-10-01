import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {renderReviews} from '../../../shared/academy/reviews-render.mjs';
const root = new URL('../', import.meta.url);
const data = JSON.parse(await fs.readFile(new URL('data/reviews.json', root), 'utf8'));
test('Five ordered reviews preserve full text and valid independent disclosure targets', () => {
  const html = renderReviews(data);
  assert.equal(data.items.length, 5);
  assert.deepEqual(data.items.map(item => item.id), ['petrochenko', 'video', 'lukoyanova', 'video-elena', 'golub']);
  assert.equal(data.items.filter(item => item.type === 'text').length, 3);
  assert.equal(data.items[1].type, 'video');
  assert.equal(data.items[4].name, 'Екатерина Голуб');
  assert.equal(data.items[4].image_temporary, undefined);
  assert.match(data.items[4].image, /^https:/);
  for (const item of data.items.filter(item => item.type === 'text')) {
    for (const paragraph of item.paragraphs) assert.ok(html.replaceAll('&nbsp;', ' ').includes(paragraph));
  }
  const copies = html + renderReviews({...data, id:'second-reviews'});
  const ids = [...copies.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const [,id] of copies.matchAll(/aria-(?:controls|labelledby)="([^"]+)"/g)) assert.ok(ids.includes(id), id);
  assert.equal((html.match(/<video\b/g) || []).length, 2);
  assert.match(html, /preload="none" playsinline controls/);
  assert.ok(html.includes(data.items[1].video.src));
  assert.doesNotMatch(html, /<iframe|\bautoplay\b/);
});
test('Review author content is escaped before becoming HTML', () => {
  const copy = structuredClone(data);
  copy.items[0].paragraphs = ['<script>alert("test")</script>'];
  const html = renderReviews(copy);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});
test('Missing video URL keeps a labelled preview and does not load empty media', () => {
  const copy = structuredClone(data);
  for (const item of copy.items.filter(item => item.type === 'video')) item.video.src = null;
  const html = renderReviews(copy);
  assert.doesNotMatch(html, /<video\b|src=""/);
  assert.match(html, /data-video-preview/);
  assert.match(html, /Воспроизвести видеоотзыв — предпросмотр/);
});
test('Current autonomous preview preserves photos, native poster and playback without local paths', async () => {
  const preview = await fs.readFile(new URL('tilda/preview.html', root), 'utf8');
  const body = preview.match(/<main\b[\s\S]*?<\/main>/)[0];
  const head = [...preview.matchAll(/<style>[\s\S]*?<\/style>/g)].map(match => match[0]).join('');
  const photos = [...body.matchAll(/<(?:img|video)\b[^>]*data-tilda-photo="([^"]+)"[^>]*>/g)];
  assert.equal(photos.length, 4);
  assert.equal(new Set(photos.map(match => match[1])).size, 3);
  for (const [tag,id] of photos) {
    assert.match(tag, tag.includes('data-review-video-poster') ? /alt=""/ : /(?:alt|aria-label)="[^"]+"/);
    assert.ok(head.includes(`[data-tilda-photo="${id}"]{background-image:url("data:image/webp;base64,`));
  }
  assert.match(body, /poster="data:image\/gif;base64,R0lGODlhAQABAIAAAAAAAP\/\/\/yH5BAE/);
  assert.match(body, /review-card_pause-glyph/);
  assert.ok(body.includes(data.items[1].video.src));
  assert.ok(body.includes(data.items[4].image));
  assert.ok(body.includes(data.items[3].video.src));
  assert.ok(body.includes(data.items[3].image));
  assert.doesNotMatch(body, /(?:src|poster|href)="(?:assets\/|\.\.\/)/);
  assert.match(body, /<img class="hero_image" src="https:/);
});
