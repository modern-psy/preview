import test from 'node:test';
import assert from 'node:assert/strict';
import {renderCourseAudience} from '../course-audience-render.mjs';
import {renderRecognition} from '../recognition-render.mjs';
import {renderHeroNote} from '../hero-render.mjs';

const data = {heading: 'Кому подойдёт курс', cards: [{lead: 'Начинаете', text: 'консультировать'}]};
test('Variable card lists, default photograph and unique section relationships', () => {
  for (const count of [3, 5, 6]) {
    const html = renderCourseAudience({...data, cards: Array.from({length: count}, () => data.cards[0])}, {id: `audience-${count}`});
    assert.equal((html.match(/<li /g) || []).length, count);
    assert.match(html, new RegExp(`aria-labelledby="audience-${count}-heading"`));
    assert.match(html, /img-asp-for-whom.webp/);
    assert.doesNotMatch(html, /<script|<template|\btabindex=|style=".*height/);
  }
  const first = renderCourseAudience(data), second = renderCourseAudience(data, {id: 'other'});
  const ids = [...(first + second).matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size);
});
test('Escapes copy, preserves line contracts, rejects invalid data and unsafe image URLs', () => {
  const html = renderCourseAudience({...data, cards: [{lead: '<script>\u00a0&', text: ''}]});
  assert.match(html, /&lt;script&gt;&nbsp;&amp;/);
  for (const cards of [[], Array(7).fill(data.cards[0]), [{lead: '', text: 'x'}]]) assert.throws(() => renderCourseAudience({...data, cards}));
  assert.throws(() => renderCourseAudience(data, {id: '" invalid'}));
  assert.throws(() => renderCourseAudience({...data, image: {src: 'javascript:alert(1)', width: 1, height: 1, alt: ''}}));
});
test('Hero note icon is optional and legacy note output stays identical', () => {
  assert.equal(renderHeroNote([]), '');
  assert.equal(renderHeroNote(['Text']), '<p class="hero_start-note"><span>Text</span></p>');
  const result = renderHeroNote({text: '6 ноября', icon: {asset: 'clock', alt: ''}}, {assets: [{id: 'clock', canonical_path: 'assets/clock.svg', width: 22, height: 22}]});
  assert.match(result, /hero_note-icon/);
  assert.match(result, /aria-hidden="true"/);
});
test('Recognition retains defaults and opts into the existing triple grid', () => {
  const value = {heading: 'Heading', mark: 'assets/mark.svg', listLabel: 'Items', cards: [], cta: {heading: 'CTA', action: 'consultation', button: 'Action', gridSource: 'assets/grid.svg'}};
  assert.match(renderRecognition(value), /is-content-wide recognition_body/);
  assert.match(renderRecognition(value), /card-grid_component is-paired/);
  const html = renderRecognition(value, {columns: 3, width: 'full'});
  assert.match(html, /is-content-full recognition_body/);
  assert.match(html, /card-grid_component is-triple/);
  assert.throws(() => renderRecognition(value, {columns: 4}));
});
