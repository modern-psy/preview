import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {rich,renderCourseFaq} from './render-sections.mjs';
import {renderPriceBlock} from '../../../act/price-model.mjs';
import {renderLeadForm} from '../../shared/academy/lead-form-render.mjs';
const content=JSON.parse(await readFile(new URL('./data/content.json',import.meta.url)));
const page=await readFile(new URL('../../../act/index.html',import.meta.url),'utf8');
const manifest=JSON.parse(await readFile(new URL('../../../act/sections.json',import.meta.url)));

test('Цены перед формой, условия после формы; один H1 и уникальные ID',()=>{
 assert.deepEqual(manifest.map(s=>s.key),['hero','foundation','community','benefits','standards','outcomes','program','trial','teachers','diploma','reviews','why','pricing','lead','terms','faq']);
 assert.equal((page.match(/<h1\b/g)||[]).length,1);
 assert.doesNotMatch(page,/<header\b|<footer\b/);
 const ids=[...page.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const target of ['rec2371385461','rec781271521'])assert.ok(ids.includes(target));
});
test('CMS не возвращает условия в цену, FAQ использует готовую композицию и исходные ответы',()=>{
 const snapshot=JSON.parse(page.match(/data-price-snapshot>([\s\S]*?)<\/script>/)[1]);
 for(const stream of snapshot.streams){
  const html=renderPriceBlock(snapshot,stream.startDate);
  assert.doesNotMatch(html,/price-terms_component|act-terms-heading/);
  assert.match(html,new RegExp(`data-price-stream="${stream.startDate}"`));
 }
 assert.equal((page.match(/class="price-terms_component"/g)||[]).length,1);
 assert.ok(page.indexOf('data-act-section="lead"')<page.indexOf('data-act-section="terms"'));
 assert.ok(page.includes(renderCourseFaq(content.faq)));
 assert.equal((page.match(/class="faq_item accordion_item"/g)||[]).length,6);
 assert.doesNotMatch(page,/class="act-faq_/);
});
test('Каждая тема программы и каждый ответ FAQ сохранены целиком',()=>{
 for(const module of content.program.modules)for(const part of module.body)for(const atom of part.texts)assert.ok(page.includes(rich(atom.html)),`Потерян текст: ${atom.text.slice(0,60)}`);
 for(const faq of content.faq.items)assert.ok(page.includes(rich(faq.answer)),faq.question);
 assert.equal((page.match(/class="act-program_submodule"/g)||[]).length,3);
});
test('Все 14 исходных видео, 11 отзывов и 8 преподавателей присутствуют',()=>{
 const expected=[...content.community.videos,...content.reviews.items.map(r=>r.video)];
 const actual=[...page.matchAll(/data-video="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(actual.length,14);assert.deepEqual(new Set(actual),new Set(expected));
 assert.equal((page.match(/data-teacher-tab="/g)||[]).length,8);
 for(const teacher of content.teachers.items){assert.ok(page.includes(teacher.image));assert.ok(page.includes(rich(teacher.bio)));}
 for(const review of content.reviews.items){assert.ok(page.includes(review.poster));assert.ok(page.includes(rich(review.body)));}
});
test('Ссылки лицензии и согласий сохранены; формам не добавлен транспорт',async()=>{
 for(const url of ['https://modern-psy.ru/agreement','https://modern-psy.ru/privacy','https://islod.obrnadzor.gov.ru/rlic/details/da67f5b1-2fd3-daeb-9904-9e381afa5ee8/'])assert.ok(page.includes(url));
 const js=await readFile(new URL('./course.js',import.meta.url),'utf8');
 assert.doesNotMatch(js,/fetch\(|sendBeacon|XMLHttpRequest|localStorage/);
 assert.match(js,/preventDefault/);
 assert.doesNotMatch(page,/src="undefined"|href="undefined"|www\.figma\.com\/api\/mcp\/asset/);
});
test('У каждой секции есть собственный HTML-просмотр',async()=>{
 for(const item of manifest){const html=await readFile(new URL('../../../act/sections/'+item.file,import.meta.url),'utf8');assert.ok(html.includes(`data-act-section="${item.key}"`));assert.match(html,/Следующая|Предыдущая/);}
});
test('Форма берётся целиком из библиотеки, с отдельным локальным контрактом',async()=>{
 const copy=JSON.parse(await readFile(new URL('./data/lead-form.json',import.meta.url)));
 const contract=JSON.parse(await readFile(new URL('./data/form-contract.json',import.meta.url)));
 const expected=renderLeadForm({...copy,...contract.consent,nativeMarker:contract.previewMarker},{id:contract.formId})
  .replace('data-academy-lead-form','data-academy-lead-form data-act-local-lead').replaceAll('src="assets/','src="/act/assets/');
 assert.ok(page.includes(expected));
 assert.equal(contract.nativeMarker,'act');
 assert.equal(contract.transportEnabled,false);
 const [source,delivered]=await Promise.all(['../../shared/academy/lead-form.js','../../../act/lead-form.js'].map(file=>readFile(new URL(file,import.meta.url),'utf8')));
 assert.equal(delivered,source);
 assert.match(page,/<script src="\/act\/lead-form.js" defer>/);
 assert.doesNotMatch(page,/class="act-lead_component"/);
});
