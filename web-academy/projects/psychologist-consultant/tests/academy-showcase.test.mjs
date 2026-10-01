import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {renderAcademyShowcase} from '../../../shared/academy/academy-showcase-render.mjs';
const data = JSON.parse(await fs.readFile(new URL('../data/academy-showcase.json', import.meta.url),'utf8'));
test('Showcase instances have independent accessible IDs and optional teachers', () => {
  const html = renderAcademyShowcase(data) + renderAcademyShowcase({...data,teachers:null},{id:'second-academy'});
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length);
  for(const [,ref] of html.matchAll(/aria-labelledby="([^"]+)"/g)) assert.ok(ids.includes(ref));
  assert.equal((html.match(/<article /g)||[]).length,7);
  assert.doesNotMatch(html, /<(?:script|button)|tabindex=/);
  assert.throws(()=>renderAcademyShowcase(data,{id:'bad"id'}));
});
test('Showcase content is escaped and media retains intrinsic size and semantics', () => {
  const html=renderAcademyShowcase({...data,heading:'<script>alert(1)</script>'});
  assert.match(html,/&lt;script&gt;/);
  assert.doesNotMatch(html,/<script>/);
  const images=[...html.matchAll(/<img\b[^>]+>/g)].map(m=>m[0]);
  assert.equal(images.length,10);
  for(const img of images){assert.match(img,/width="\d+" height="\d+"/);assert.match(img,/draggable="false"/);assert.match(img,/alt="[^"]*"/);}
});
