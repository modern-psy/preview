import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {renderLearningTimeline} from '../../../shared/academy/learning-timeline-render.mjs';
const root = new URL('../', import.meta.url);
const data = JSON.parse(await fs.readFile(new URL('data/learning-timeline.json', root), 'utf8'));

test('Timeline instances preserve correct static copy and independent accessible headings', () => {
  const changed = structuredClone(data);
  changed.steps[1].heading = '<script>bad()</script>';
  const html = renderLearningTimeline(data) + renderLearningTimeline(changed, {id: 'second-learning'});
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.equal((html.match(/data-learning-timeline/g) || []).length, 2);
  assert.equal((html.match(/class="body-text_component is-reading/g) || []).length, 16);
  assert.match(html, /&lt;script&gt;bad\(\)/);
  assert.doesNotMatch(html, /<script|<details|aria-expanded/);
  assert.equal(new Set(data.steps.map(step => step.heading)).size, 8);
  assert.equal(new Set(data.steps.map(step => step.description)).size, 8);
  assert.equal(data.steps.filter(step => step.expert).length, 1);
  changed.action.href = 'javascript:bad()';
  assert.throws(() => renderLearningTimeline(changed), /same-page/);
});

test('Tilda contains one complete timeline and the shared runtime without local dependencies', async () => {
  const manifest = JSON.parse(await fs.readFile(new URL('tilda/manifest.json', root), 'utf8'));
  const read = file => fs.readFile(new URL(`tilda/${file}`, root), 'utf8');
  const body = (await Promise.all(manifest.body_files.map(read))).join('');
  const footer = (await Promise.all(manifest.footer_files.map(read))).join('');
  const timeline = body.match(/<section class="section_learning[\s\S]*?<\/section>/)?.[0];
  assert.ok(timeline);
  assert.equal((timeline.match(/class="learning-timeline_step/g) || []).length, 8);
  assert.match(timeline, /href="#pricing"/);
  assert.doesNotMatch(timeline, /src="(?:assets|\.\.\/shared)/);
  assert.match(footer, /__academyLearningTimelineCleanup/);
  assert.doesNotMatch(footer, /__consultantTimelineCleanup/);
});
