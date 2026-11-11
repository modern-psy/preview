import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {scope,scopedCss} from './tilda-helpers.mjs';
const root=new URL('../../../act/tilda/',import.meta.url);
const read=name=>readFile(new URL(name,root),'utf8');
const manifest=JSON.parse(await read('manifest.json'));
const contract=JSON.parse(await readFile(new URL('./data/form-contract.json',import.meta.url)));
const parts=await Promise.all(manifest.sections.map(read));
const body=parts.join('\n');
const files=Object.fromEntries(await Promise.all(manifest.files.map(async file=>[file.name,await read(file.name)])));

test('16 последовательных BODY: один T123 — одна целая секция, без хедера и футера',()=>{
 assert.equal(parts.length,16);
 parts.forEach((part,index)=>{
  const n=String(index+1).padStart(2,'0');
  assert.ok(manifest.sections[index].startsWith(n+'-body-'));
  assert.ok(part.startsWith('<!-- Секция '+n+':'));
  assert.equal((part.match(/<section\b/g)||[]).length,1);
  assert.equal((part.match(/<\/section>/g)||[]).length,1);
  assert.equal((part.match(/data-act-part="/g)||[]).length,1);
  assert.doesNotMatch(part,/<header\b|<footer\b/);
 });
 assert.equal((body.match(/<h1\b/g)||[]).length,1);
});
test('Фрагменты автономны, укладываются в T123 и совпадают с manifest SHA-256',async()=>{
 for(const item of manifest.files){
  const value=files[item.name];
  assert.ok(value.length<65000,item.name);
  assert.equal(item.characters,value.length);
  assert.equal(item.sha256,createHash('sha256').update(value).digest('hex'));
  assert.doesNotMatch(value,/localhost|127\.0\.0\.1|\/act\/assets\/|\/act\/icons\/|src="assets\/|\bimport\s*\{/);
 }
 assert.deepEqual((await readdir(root)).filter(name=>/^\d/.test(name)).sort(),manifest.sections);
});
test('Якоря из Hero существуют один раз, а попап имеет только popup hook',()=>{
 const ids=[...body.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const id of ['act-program','act-trial'])assert.equal(ids.filter(value=>value===id).length,1);
 for(const popup of manifest.actions.existingPopupHashes)assert.ok(!ids.includes(popup.slice(1)));
 assert.match(body,/href="#free-lessons-act"\s+data-tilda-popup-link/);
 for(const match of body.matchAll(/(?:aria-labelledby|aria-describedby|aria-controls|for)="([^"]+)"/g))for(const id of match[1].split(/\s+/))assert.ok(ids.includes(id),id);
});
test('CSS ограничен ACT и не задаёт viewport-height каждому экспортному wrapper',()=>{
 const css=manifest.styles.map(name=>files[name]).join('\n');
 assert.ok(css.includes(`${scope},${scope} > .academy-page{min-height:0;height:auto;`));
 assert.ok(css.includes('scroll-margin-top:2rem'));
 assert.ok(css.includes('data:image/svg+xml;base64,'));
 assert.ok(scopedCss('.question:is(.open,.active),.answer{color:red}').includes(`${scope} .question:is(.open,.active),${scope} .answer`));
 assert.doesNotMatch(css,/(?:^|\})\s*\.t-form\s*\{/);
});
test('Hero и цены имеют live CMS с резервным снимком, условия не дублируются при обновлении',()=>{
 assert.match(files['01-body-hero.html'],/data-cms-hero/);
 assert.match(files['13-body-pricing.html'],/data-cms-price/);
 assert.match(files['footer-cms.html'],/data-price-snapshot/);
 assert.equal((files['footer-cms.html'].match(/<script type="application\/json" data-price-snapshot>/g)||[]).length,1);
 assert.ok(files['footer-cms.html'].indexOf('type="application/json"')<files['footer-cms.html'].indexOf('const ACT_ICONS'));
 assert.match(files['footer-cms.html'],/api\/public\/course\//);
 assert.match(files['footer-cms.html'],/api\/public\/catalog/);
 assert.doesNotMatch(files['13-body-pricing.html'],/price-terms_component/);
 assert.equal((body.match(/class="price-terms_component"/g)||[]).length,1);
});
test('Форма привязана к точному native marker и MAX, success зависит от нативного события',()=>{
 assert.match(files['14-body-lead.html'],new RegExp(`data-tilda-form-name="${contract.nativeMarker}"`));
 assert.doesNotMatch(body,/data-act-local-lead|data-local-form|act-trial-dialog/);
 const script=files['footer-form.html'];
 assert.match(script,/matches.length===1\?matches\[0\]:null/);
 assert.match(script,/closest\("\.t-rec"\)/);
 assert.match(script,/MutationObserver/);
 assert.match(script,/radio.value === "max_messenger"/);
 assert.match(script,/input\[name=\\"Email\\"\]|input\[name="Email"\]/);
 assert.match(script,/requestSubmit/);
 assert.match(script,/successfulForm !== submittedTildaForm/);
 assert.doesNotMatch(script,/fetch\(|sendBeacon|XMLHttpRequest|localStorage/);
 assert.doesNotMatch(files['footer-course.html'],/Локальный предпросмотр|data-local-form/);
});
test('Все готовые classic scripts синтаксически корректны; preview использует именно эти fragments',async()=>{
 for(const name of manifest.footer){
  for(const match of files[name].matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g))if(!match[1].includes('application/json'))new vm.Script(match[2],{filename:name});
 }
 const preview=await read('preview.html');
 for(const value of Object.values(files))assert.ok(preview.includes(value));
});
