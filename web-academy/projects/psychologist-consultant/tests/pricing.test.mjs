import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { renderPricing } from '../../../shared/academy/pricing-render.mjs';

const root = new URL('../', import.meta.url);
const config = JSON.parse(await fs.readFile(new URL('data/pricing.json', root), 'utf8'));

test('The published pricing switches from winter to spring with the requested dates and prices', () => {
  const html = renderPricing(config);
  assert.deepEqual(config.streams.map(stream => stream.id), ['winter', 'spring']);
  assert.ok(html.indexOf('data-pricing-tab="winter"') < html.indexOf('data-pricing-tab="spring"'));
  assert.match(html, /selected-stream="winter"/);
  assert.match(html, /data-pricing-tab="winter"[^>]*>Зимний поток/);
  assert.match(html, /data-pricing-tab="spring"[^>]*>Весенний поток/);
  assert.match(html, /Старт потока 9&nbsp;декабря/);
  assert.match(html, /Старт потока 16\u00a0марта/);
  for (const price of ['8&nbsp;750&nbsp;₽', '182&nbsp;000&nbsp;₽', '10&nbsp;250&nbsp;₽', '246&nbsp;000&nbsp;₽']) {
    assert.equal(html.split(price).length - 1, 2);
  }
  assert.doesNotMatch(html, /autumn|Осенний поток|15&nbsp;сентября|10&nbsp;541&nbsp;₽|12&nbsp;916&nbsp;₽/);
});

test('Pricing handles one to three plans, one or two streams, and unique instance IDs', () => {
  for (const count of [1, 2, 3]) {
    for (const streamCount of [1, 2]) {
      const data = structuredClone(config);
      data.id = `fixture-${count}-${streamCount}`;
      data.streams = data.streams.slice(0, streamCount);
      data.plans = Array.from({length: count}, (_, i) => ({...structuredClone(data.plans[i % 2]), id: `plan-${i}`}));
      const html = renderPricing(data);
      assert.equal((html.match(/<article\b/g) || []).length, count);
      assert.equal((html.match(/role="tab"/g) || []).length, streamCount);
      const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
      assert.equal(ids.length, new Set(ids).size);
      for (const [, reference] of html.matchAll(/aria-(?:controls|labelledby)="([^"]+)"/g)) assert.ok(ids.includes(reference));
    }
  }
});

test('Commercial data is escaped and incomplete prices never become an invented amount', () => {
  const data = structuredClone(config);
  data.title = '<script>alert(1)</script>';
  data.plans[0].prices.winter = null;
  const html = renderPricing(data);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /Стоимость уточняется/);
  data.plans[0].prices.winter = { monthly: -100, total: 100, months: 24 };
  assert.throws(() => renderPricing(data), /Invalid pricing amount/);
});

test('Original check/cross/lightning icons and non-color exclusion semantics survive rendering', () => {
  const html = renderPricing(config);
  assert.equal((html.match(/icon-circle-check\.svg/g) || []).length, 18);
  assert.equal((html.match(/icon-cross\.svg/g) || []).length, 5);
  assert.equal((html.match(/pricing-zap\.svg/g) || []).length, 5);
  assert.equal((html.match(/Не входит:/g) || []).length, 5);
  assert.match(html, /icon-flame-white\.svg/);
});

test('Tilda budget optimization uses truly transparent images with paired SVG backgrounds', async () => {
  const manifest = JSON.parse(await fs.readFile(new URL('tilda/manifest.json', root), 'utf8'));
  const body = (await Promise.all(manifest.body_files.map(name => fs.readFile(new URL(`tilda/${name}`, root), 'utf8')))).join('');
  const head = (await Promise.all(manifest.style_files.map(name => fs.readFile(new URL(`tilda/${name}`, root), 'utf8')))).join('');
  for (const [, base64, id] of body.matchAll(/src="data:image\/gif;base64,([^"]+)" data-tilda-svg="([^"]+)"/g)) {
    const bytes = Buffer.from(base64, 'base64');
    const offset = bytes.indexOf(Buffer.from([0x21, 0xf9, 0x04]));
    assert.ok(offset >= 0 && (bytes[offset + 3] & 1), 'GIF must declare transparency');
    assert.ok(head.includes(`[data-tilda-svg="${id}"]{background:url("data:image/svg+xml;base64,`));
  }
  assert.ok(body.indexOf('id="pricing"') < body.indexOf('id="admission"'));
});

test('Optional increase renders a two-line ladder per stream × plan cell and changes nothing without it', () => {
  const plain = renderPricing(config);
  assert.doesNotMatch(plain, /pricing_increase/);
  const data = structuredClone(config);
  const plainTwoStreams = renderPricing(data);
  data.plans[0].prices.spring.increase = { from: '2026-10-01', fromLabel: 'с 1 октября', monthly: 2500, total: 60000 };
  data.plans[1].prices.winter.increase = { from: '2026-03-01', fromLabel: 'с 1 марта', monthly: 4167, total: 100000 };
  const html = renderPricing(data);
  assert.equal((html.match(/class="pricing_increase"/g) || []).length, 2);
  assert.match(html, /Цена действует до&nbsp;30&nbsp;сентября/);
  assert.match(html, /Цена действует до&nbsp;28&nbsp;февраля/);
  assert.match(html, /С&nbsp;1&nbsp;октября&nbsp;— 60&nbsp;000&nbsp;₽ \(от&nbsp;2&nbsp;500&nbsp;₽\/мес\)/);
  // Each ladder lives inside the cost cell of its own stream, so tabs hide it together with that price.
  const cells = html.split('<div class="pricing_cost" ').slice(1).filter(cell => cell.includes('pricing_increase'));
  assert.equal(cells.length, 2);
  assert.ok(cells[0].startsWith('data-pricing-stream="winter"'));
  assert.ok(cells[1].startsWith('data-pricing-stream="spring"'));
  assert.equal(html.replace(/<div class="pricing_increase">.*?<\/div>/g, ''), plainTwoStreams);
  data.plans[0].prices.spring.increase = { from: 'октябрь', fromLabel: 'с 1 октября', monthly: 2500, total: 60000 };
  assert.throws(() => renderPricing(data), /Invalid pricing increase/);
});
