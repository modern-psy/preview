import test from 'node:test';
import assert from 'node:assert/strict';
import {renderShowcaseTabs} from '../showcase-tabs-render.mjs';
import {renderLearningTimeline} from '../learning-timeline-render.mjs';
import {renderStageCard} from '../program-render.mjs';

const data = {heading:'Раздел', items:[{id:'one', title:'Первый', description:'Описание'}, {id:'two', title:'Второй', description:'Текст'}]};
test('Tabs preserve all content without JS and have unique IDs across instances', () => {
  const html = ['alpha', 'beta'].map(id => renderShowcaseTabs(data, {id, renderMedia:item=>`<p>${item.id}</p>`})).join('');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.equal((html.match(/<article/g)||[]).length, 4);
  assert.doesNotMatch(html, /<article[^>]+hidden/);
  assert.equal((html.match(/data-tabs-list[^>]+hidden/g)||[]).length, 2);
  assert.throws(()=>renderShowcaseTabs({...data,items:[data.items[0],data.items[0]]},{renderMedia:()=>''}));
  assert.throws(()=>renderShowcaseTabs(data,{id:'"',renderMedia:()=>''}));
  assert.match(renderShowcaseTabs({...data,heading:'<script>'},{renderMedia:()=>''}), /&lt;script&gt;/);
});
test('Program timeline reuses whole stage cards and keeps descriptions open', () => {
  const stage = {badge:'1 месяц',heading:'Основы',description:'Описание этапа'};
  const html = renderLearningTimeline({variant:'program',heading:{text:'От основ',accent:'к практике'},listLabel:'Этапы',steps:[{label:stage.badge,heading:stage.heading,description:stage.description}],action:{href:null,label:'Программа'}});
  assert.ok(html.includes(renderStageCard(stage,{tag:'div'})));
  assert.doesNotMatch(html,/aria-expanded|<details|toggle-icon|\shidden(?:\s|>)/);
  assert.match(renderStageCard(stage),/^<li\b/);
});
