import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {renderRecognition} from '../../../shared/academy/recognition-render.mjs';
import {renderRatings} from '../../../shared/academy/ratings-render.mjs';
import {renderPracticePath} from '../../../shared/academy/practice-path-render.mjs';
import {renderFoundation} from '../../../shared/academy/foundation-render.mjs';
import {renderCta} from '../../../shared/academy/cta-render.mjs';
import {renderTrialLectures} from '../../../shared/academy/trial-lectures-render.mjs';
const root = new URL('../', import.meta.url);
const data = async name => JSON.parse(await fs.readFile(new URL(`data/${name}.json`, root), 'utf8'));

test('Whole sections support two independent instances with resolvable heading IDs', async () => {
  for (const [name, render] of [['recognition', renderRecognition], ['ratings', renderRatings], ['practice-path', renderPracticePath], ['foundation', renderFoundation], ['trial-lectures', renderTrialLectures]]) {
    const input = await data(name);
    const html = render(input, {id: 'first'}) + render(input, {id: 'second'});
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, name);
    for (const match of html.matchAll(/aria-labelledby="([^"]+)"/g)) assert.ok(ids.includes(match[1]), `${name}: ${match[1]}`);
    assert.doesNotMatch(html, /\{\{|<script|customElements/);
    assert.throws(() => render(input, {id: 'invalid"id'}));
  }
});

test('Shared card and CTA renderers escape text and keep semantic levels and optional copy', async () => {
  const foundation = await data('foundation');
  foundation.cards[0].heading = '<img src=x onerror=alert(1)>';
  foundation.cta.heading = 'A\u00a0B & <C>';
  const html = renderFoundation(foundation);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /A&nbsp;B &amp; &lt;C&gt;/);
  assert.equal((html.match(/<h3\b/g) || []).length, 7);
  assert.equal((html.match(/data-cta-grid-stage/g) || []).length, 1);
  assert.doesNotMatch(html, /class="section-subtitle_component"/);
  const grant = renderCta(await data('grant-cta'), {headingLevel: 2, headingId: 'grant-example'});
  assert.match(grant, /<h2[^>]+id="grant-example"/);
  assert.match(grant, /aria-disabled="true" data-action="mini-course"/);
  assert.throws(() => renderCta(foundation.cta, {headingLevel: 1}));
});

test('Current page contains the shared compositions and the independent ratings export is portable', async () => {
  const preview = await fs.readFile(new URL('tilda/preview.html', root), 'utf8');
  for (const id of ['audience', 'ratings', 'practice-path', 'foundation', 'grant']) assert.equal((preview.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1);
  assert.equal((preview.match(/class="cta_component is-responsive/g) || []).length, 3);
  assert.doesNotMatch(preview, /consultant-path_|consultant-foundation_|\{\{(?:asset|heading|id)/);
  const head = await fs.readFile(new URL('ratings/tilda/head.html', root), 'utf8');
  const section = await fs.readFile(new URL('ratings/tilda/section.html', root), 'utf8');
  assert.ok(section.length < 65000);
  assert.doesNotMatch(head + section, /(?:src|href)="(?:\.\.?\/|assets\/)|url\(["']?\.\.?\//);
  assert.equal((section.match(/class="ratings_card/g) || []).length, 3);
  assert.equal((section.match(/class="ratings_tag"/g) || []).length, 5);
});
