import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {renderPracticeStories} from '../practice-stories-render.mjs';
import {renderReviewCard} from '../reviews-render.mjs';

const data = JSON.parse(await fs.readFile(new URL('../../../projects/cbt-oxford/data/practice-stories.json', import.meta.url), 'utf8'));
test('Stories reuse review cards, retain all supplied copy and remain readable without JavaScript', () => {
  const html = renderPracticeStories(data);
  for (const item of data.items) {
    assert.ok(html.includes(renderReviewCard({...item, type: 'quote'}, 'practice-stories', {responsive:true})));
    for (const copy of [item.name, item.quote, item.lead, item.caption]) assert.ok(html.replaceAll('&nbsp;', ' ').includes(copy));
    assert.ok(html.includes(item.image));
  }
  assert.equal((html.match(/<blockquote /g) || []).length, 5);
  assert.equal((html.match(/<h3 class="content-heading_component is-card review-card_name">/g) || []).length, 5);
  assert.doesNotMatch(html, /\bhidden\b|data-review-toggle|<button|<canvas|<template/);
  const combined = html + renderPracticeStories({...data, items:data.items.slice(0, 1)}, {id:'second-stories'});
  const ids = [...combined.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const [, id] of combined.matchAll(/aria-labelledby="([^"]+)"/g)) assert.ok(ids.includes(id));
});
test('Story content is escaped and invalid metadata is rejected before rendering', () => {
  const copy = structuredClone(data);
  copy.items[0].quote = '<script>alert("x")</script>';
  copy.items[0].alt = '" onload="alert(1)';
  const html = renderPracticeStories(copy);
  assert.doesNotMatch(html, /<script>|" onload="/);
  assert.match(html, /&lt;script&gt;/);
  assert.throws(() => renderPracticeStories({...data, items:[]}));
  assert.throws(() => renderPracticeStories({...data, items:[data.items[0], data.items[0]]}));
  assert.throws(() => renderPracticeStories(data, {id:'bad"id'}));
  for (const patch of [{name:''}, {image:'javascript:alert(1)'}, {width:0}, {alt:null}]) {
    assert.throws(() => renderPracticeStories({...data, items:[{...data.items[0], ...patch}]}));
  }
});
