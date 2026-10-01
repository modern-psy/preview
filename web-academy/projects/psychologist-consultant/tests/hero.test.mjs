import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {renderHeroSection, renderHeroButton, replaceHeroRegion} from '../../../shared/academy/hero-render.mjs';

const root = new URL('../', import.meta.url);
const read = name => fs.readFile(new URL(name, root), 'utf8');
const [data, assets, actions] = await Promise.all(['hero', 'assets', 'actions'].map(async name => JSON.parse(await read(`data/${name}.json`))));
const context = {assets, actions};

test('Hero source comes from shared components and preserves content without runtime JS', async () => {
  const source = await read('index.html');
  const rendered = renderHeroSection(data, context);
  assert.equal(source, replaceHeroRegion(source, rendered));
  assert.doesNotMatch(rendered, /<script|<template|<slot|\bhidden\b(?!="true")/);
  assert.equal((rendered.match(/<h1\b/g) || []).length, 1);
  assert.equal((rendered.match(/class="card_component[^\"]*benefits_card/g) || []).length, data.benefits.cards.length);
  assert.match(rendered, /&nbsp;/);
  const body = await read('tilda/body.html');
  assert.match(body, /class="hero_image"[^>]+fetchpriority="high"/);
  assert.doesNotMatch(body.match(/<section class="section_hero"[\s\S]*?<\/section>/)[0], /loading=lazy[^>]*fetchpriority|hero-render\.mjs/);
});

test('Hero replacement is idempotent, preserves other sections and fails on broken markers', () => {
  const source = 'before\n<!-- hero:start -->old<!-- hero:end -->\nafter';
  const result = replaceHeroRegion(source, 'new $&');
  assert.equal(result, 'before\n<!-- hero:start -->\nnew $&\n<!-- hero:end -->\nafter');
  assert.equal(replaceHeroRegion(result, 'new $&'), result);
  for (const invalid of ['none', '<!-- hero:end --><!-- hero:start -->', source + '<!-- hero:start -->']) assert.throws(() => replaceHeroRegion(invalid, 'new'));
});

test('Hero instances have independent IDs, heading levels and optional parts', () => {
  const second = {...data, heading_id: 'second-heading', heading_level: 2, metadata: null, stat: null, benefits: null, note: [], copy: {heading: 'Другой курс'}, actions: [data.actions[0]]};
  const rendered = renderHeroSection(second, context);
  assert.match(rendered, /aria-labelledby="second-heading"/);
  assert.match(rendered, /<h2 class="hero_heading" id="second-heading">Другой курс<\/h2>/);
  assert.doesNotMatch(rendered, /hero_subtitle|hero_description|hero_start-note|meta-pill_list|stat-card_component|benefits_component|<h1/);
  const combined = renderHeroSection(data, context) + rendered;
  const ids = [...combined.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
});

test('Hero escapes copy and attributes while keeping authored nonbreaking spaces', () => {
  const changed = structuredClone(data);
  changed.copy.heading = '<script>alert("x")</script> & текст&nbsp;курса';
  changed.image.alt = '" onload="alert(1)';
  const rendered = renderHeroSection(changed, context);
  assert.doesNotMatch(rendered, /<script| onload="/);
  assert.match(rendered, /&lt;script&gt;/);
  assert.match(rendered, /&amp; текст&nbsp;курса/);
  assert.match(rendered, /alt="&quot; onload=&quot;alert\(1\)"/);
});

test('Hero actions use the action registry and native links or inert preview buttons', () => {
  const preview = {...context, actions: actions.map(action => ({...action, destination: null}))};
  assert.match(renderHeroButton(data.actions[0], preview), /<button[^>]+type="button" aria-disabled="true"/);
  const active = {...context, actions: actions.map(action => ({...action, destination: '#application'}))};
  const rendered = renderHeroButton(data.actions[0], active);
  assert.match(rendered, /<a[^>]+href="#application"/);
  assert.doesNotMatch(rendered, /aria-disabled|tabindex/);
  for (const destination of ['javascript:alert(1)', 'data:text/html,test', undefined]) assert.throws(() => renderHeroButton(data.actions[0], {...context, actions: [{...actions[0], destination}]}), /invalid URL/);
});

test('Unknown references, invalid variants and missing accessibility data fail the build', () => {
  assert.throws(() => renderHeroSection(data, {...context, assets: []}), /unknown asset/);
  assert.throws(() => renderHeroSection(data, {...context, actions: []}), /unknown action/);
  for (const change of [
    value => { value.heading_id = ''; },
    value => { value.benefits.cards[0].variant = 'toString'; },
    value => { value.benefits.cards[2].avatars.items[0].alt = ''; },
    value => { value.actions[0].variant = 'unknown'; },
    value => { value.actions = []; },
  ]) {
    const value = structuredClone(data); change(value);
    assert.throws(() => renderHeroSection(value, context), /Hero:/);
  }
});

test('Static independent fixture shares the renderer and needs no project styles or JS', async () => {
  const fixture = await fs.readFile(new URL('../../shared/academy/tests/hero-fixture.html', root), 'utf8');
  assert.match(fixture, /hero-secondary-heading/);
  assert.doesNotMatch(fixture, /<script|href="styles\.css"|psychologist-consultant-page/);
  assert.equal((fixture.match(/<h1\b/g) || []).length, 1);
  assert.equal((fixture.match(/class="hero_component is-dual-action"/g) || []).length, 2);
});
