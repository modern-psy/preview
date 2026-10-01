import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {renderSupportTeam} from '../../../shared/academy/support-team-render.mjs';
import {renderTeamCard} from '../../../shared/academy/team-card-render.mjs';
import {renderMetaPill} from '../../../shared/academy/meta-pill-render.mjs';
const root = new URL('../', import.meta.url);
const read = path => fs.readFile(new URL(path, root), 'utf8');
const data = JSON.parse(await read('data/support-team.json'));

test('Team data renders once per section with independent IDs and no runtime', async () => {
  const first = renderSupportTeam(data);
  const second = renderSupportTeam(data, {id: 'second-team'});
  const ids = [...(first + second).matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.equal((first.match(/<li class="team-card_component/g) || []).length, 5);
  assert.equal((first.match(/<h3\b/g) || []).length, 5);
  assert.doesNotMatch(first, /<script|<template|\bhidden\b|tabindex|<button/);
  assert.ok((await read('index.html')).includes(first));
  assert.ok(first.includes(renderMetaPill(data.specialists[1].tag)));
  assert.throws(() => renderSupportTeam(data, {id: 'bad id'}));
});

test('Standalone card supports absent tag, escapes content and preserves media metadata', () => {
  const changed = {...data.specialists[0], title: '<script>alert(1)</script>', description: 'Текст & подпись', image: {...data.specialists[0].image, alt: '" onload="x'}};
  const html = renderTeamCard(changed, {headingLevel: 4});
  assert.match(html, /^<article/);
  assert.match(html, /<h4\b/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /Текст &amp; подпись/);
  assert.match(html, /width="960" height="1032"/);
  assert.match(html, /draggable="false" loading="lazy"/);
  assert.doesNotMatch(html, /<script| onload="|meta-pill_component/);
  assert.throws(() => renderTeamCard({...changed, image: {...changed.image, alt: ''}}));
  assert.throws(() => renderMetaPill({text: 'Label', icon: {src: 'javascript:alert(1)', width: 20, height: 20}}));
});

test('Current transfer includes team styles, natural images and shared tag icon', async () => {
  const manifest = JSON.parse(await read('tilda/manifest.json'));
  const body = (await Promise.all(manifest.body_files.map(readName => read(`tilda/${readName}`)))).join('');
  const styles = (await Promise.all(manifest.style_files.map(readName => read(`tilda/${readName}`)))).join('');
  const section = body.match(/<section[^>]*id="support-team"[\s\S]*?<\/section>/)?.[0];
  assert.ok(section);
  assert.equal((section.match(/class="team-card_image"/g) || []).length, 5);
  assert.match(section, /<span class="meta-pill_icon"[^>]*data-tilda-svg/);
  assert.doesNotMatch(section, /src="assets\/|shared\/|support-team_badge/);
  assert.match(styles, /\.team-card_image/);
  assert.match(styles, /\.support-team_grid/);
  assert.match(styles, /\.meta-pill_component\.is-responsive/);
});
