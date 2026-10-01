import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {renderProgram} from '../../../shared/academy/program-render.mjs';
import {splitTildaBody, splitTildaScripts} from '../tilda-fragments.mjs';
const root = new URL('../', import.meta.url);
const data = JSON.parse(await fs.readFile(new URL('data/program.json', root), 'utf8'));

test('Program instances preserve static content, unique headings and safe copy', () => {
  const changed = structuredClone(data);
  changed.stages[0].description = '<script>bad()</script> & текст';
  const html = renderProgram(data) + renderProgram(changed, {id: 'second-program'});
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.equal((html.match(/class="card_component is-stage"/g) || []).length, 12);
  assert.equal((html.match(/class="section-subtitle_component"/g) || []).length, 4);
  assert.doesNotMatch(html, /<script|<details|data-accordion|aria-expanded/);
  assert.match(html, /&lt;script&gt;bad\(\)/);
  assert.match(html, /href="#application"/);
  changed.action.href = 'javascript:bad()';
  assert.throws(() => renderProgram(changed), /same-page/);
});

test('T123 body splitting preserves nested sections and fails instead of truncating content', () => {
  const first = `<section id="first"><h2>One</h2>${'x'.repeat(35000)}<section id="nested">Nested</section></section>`;
  const second = `<section id="second">${'y'.repeat(35000)}</section>`;
  const parts = splitTildaBody(`<main class="academy-page" id="main-content">${first}${second}</main>`);
  assert.equal(parts.length, 2);
  assert.ok(parts[0].includes(first));
  assert.ok(parts[1].includes(second));
  parts.forEach(part => { assert.match(part, /^<div\b[\s\S]*<\/div>$/); assert.ok(part.length < 65000); });
  assert.throws(() => splitTildaBody(`<main><section>${'x'.repeat(65000)}</section></main>`), /exceeds/);
  assert.throws(() => splitTildaBody('<main><p>Lost content</p><section>Test</section></main>'), /outside/);
  assert.throws(() => splitTildaBody('<main><section>Incomplete</main>'), /Incomplete/);
});

test('T123 script splitting preserves whole modules and dependency order', () => {
  const modules = ['/*' + 'x'.repeat(40000) + '*/', '/*' + 'y'.repeat(40000) + '*/'];
  const parts = splitTildaScripts(modules, '<script src="https://example.org/library.js"></script>');
  assert.equal(parts.length, 2);
  assert.ok(parts[0].indexOf('library.js') < parts[0].indexOf(modules[0]));
  assert.ok(parts[1].includes(modules[1]));
  assert.throws(() => splitTildaScripts(['x'.repeat(65000)]), /exceeds/);
});

test('Current Tilda parts preserve every top-level section exactly once and all shared modules', async () => {
  const manifest = JSON.parse(await fs.readFile(new URL('tilda/manifest.json', root), 'utf8'));
  const read = name => fs.readFile(new URL(`tilda/${name}`, root), 'utf8');
  const body = (await Promise.all(manifest.body_files.map(read))).join('');
  const source = await fs.readFile(new URL('index.html', root), 'utf8');
  const sectionIds = html => [...html.matchAll(/<section\b[^>]*\sid="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(sectionIds(body), sectionIds(source));
  assert.equal(new Set(sectionIds(body)).size, sectionIds(body).length);
  assert.match(body, /program_component section-layout_component is-responsive/);
  assert.equal((body.match(/class="card_component is-stage"/g) || []).length, 6);
  const footer = (await Promise.all(manifest.footer_files.map(read))).join('');
  for (const hook of ['__academyComponentsCleanup', '__academyLeadFormCleanup', '__academyAnchorScrollCleanup', 'AcademyTeacherTemplate', 'data-learning-timeline']) assert.ok(footer.includes(hook), hook);
});
