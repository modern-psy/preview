import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import '../../../shared/academy/teacher-card.js';
import '../../../shared/academy/teachers-template.js';
import {renderTeachersSection} from '../../../shared/academy/teachers-render.mjs';

const root = new URL('../', import.meta.url);
const source = await fs.readFile(new URL('teachers/data.html', root), 'utf8');
const data = JSON.parse(source.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]);
const {render, validate} = globalThis.AcademyTeacherTemplate;

test('one ordered data module creates matching tabs and cards for all 21 teachers', () => {
  const records = validate(data);
  assert.equal(records.length, 21);
  assert.equal(records[0].name, 'Дарья Зюзина');
  assert.equal(records[8].name, 'Александр Шакиров');
  assert.equal(records.at(-1).name, 'Александр Кулаков');
  const changed = [records.at(-1), {...records[0], id: 'new-teacher', name: 'Новый преподаватель'}, ...records.slice(0, -1)];
  const markup = render(changed);
  const tabs = [...markup.matchAll(/data-js="teacher-tab" data-teacher-id="([^"]+)"/g)].map(m => m[1]);
  const slides = [...markup.matchAll(/class="teachers_slide splide__slide"[^>]*data-teacher-id="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(tabs, changed.map(row => row.id));
  assert.deepEqual(slides, tabs);
});

test('editable data is escaped and unsafe photo URLs and duplicate IDs fail before rendering', () => {
  const entry = {...data[0], name: '<img src=x onerror=alert(1)>', description: '<script>alert(1)</script>'};
  const markup = render([entry]);
  assert.ok(markup.includes('&lt;script&gt;'));
  assert.ok(!markup.includes('<script>'));
  assert.throws(() => render([{...entry, photo: 'javascript:alert(1)'}]), /HTTPS/);
  assert.throws(() => render([data[0], data[0]]), /уникальный/);
  assert.throws(() => render([{...entry, crop: [Infinity, 100, 0, 0]}]), /обрезка/);
  assert.ok(render([{...entry, photo: null, tag: ''}]).includes('teacher-card_initials'));
  assert.ok(!render([{...entry, photo: null, tag: ''}]).includes('teacher-card_tag'));
});

test('Tilda data, section and runtime fit independent T123 blocks and have no local runtime references', async () => {
  for (const name of ['head', 'section', 'data', 'footer']) {
    const html = await fs.readFile(new URL(`teachers/tilda/${name}.html`, root), 'utf8');
    assert.ok(html.length < 65000, name);
    assert.ok(!/(?:src|href)="(?:\.\.?\/|assets\/)|url\(["']?(?:\.\.?\/|assets\/)/.test(html), name);
  }
  const html = await fs.readFile(new URL('index.html', root), 'utf8');
  assert.ok(html.indexOf('id="support-team"') < html.indexOf('id="teachers"'));
  assert.ok(html.indexOf('id="teachers"') < html.indexOf('id="diploma"'));
});

test('teacher card and complete sections render independently with scoped IDs and copy', () => {
  const card = globalThis.AcademyTeacherCard.render({...data[0], photo: null}, {headingLevel: 4});
  assert.match(card, /<article class="teacher-card_component">/);
  assert.match(card, /<h4 /);
  assert.doesNotMatch(card, /teachers_layout|<script|consultant/);
  const copy = {heading: 'Наша команда', headingAccent: 'Эксперты', description: 'Описание', tabsLabel: 'Имена', sliderLabel: 'Карточки', previousLabel: 'Назад', nextLabel: 'Вперёд'};
  const html = ['first', 'second'].map(id => renderTeachersSection(copy, data, {id, instanceId: `${id}-list`, configId: `${id}-data`})).join('');
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal((html.match(/class="teacher-card_component"/g) || []).length, 42);
  assert.match(html, /data-config="second-data"/);
  assert.match(html, /aria-label="Имена"/);
  assert.throws(() => renderTeachersSection(copy, data, {id: 'invalid id'}));
});
