import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {renderDiploma} from '../../../shared/academy/diploma-render.mjs';
import {renderGraduation} from '../../../shared/academy/graduation-render.mjs';
import {renderLeadFormSection} from '../../../shared/academy/lead-form-render.mjs';
import {renderReviews} from '../../../shared/academy/reviews-render.mjs';
const root=new URL('../',import.meta.url);
const read=p=>fs.readFile(new URL(p,root),'utf8');
const data=async name=>JSON.parse(await read(`data/${name}.json`));
const diploma=await data('diploma'), graduation=await data('graduation'), copy=await data('lead-form'), contract=await data('form-contract');
const form={...copy,nativeMarker:contract.native_tilda_form.discovery.value,agreementUrl:contract.personal_data.agreement_url,privacyUrl:contract.personal_data.privacy_url};
function independent(html){const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const match of html.matchAll(/(?:for|aria-labelledby|aria-controls|aria-describedby)="([^"]+)"/g))for(const id of match[1].split(' '))assert.ok(ids.includes(id),`Missing reference ${id}`);}
test('Static renderers accept replacement media, omit inserts and isolate instances',()=>{
 const minimal={...diploma,requirements:null,note:null,license:null,image:{src:'assets/replacement.webp',width:1000,height:800,alt:'Другой документ'}};
 const html=renderDiploma(minimal);
 assert.match(html,/replacement.webp" width="1000" height="800"/);
 assert.doesNotMatch(html,/diploma_requirements|diploma_note|diploma_license/);
 independent(html+renderDiploma(diploma,{id:'other-diploma'}));
 const grad=renderGraduation({...graduation,mark:null,items:['<script> & текст']});
 assert.doesNotMatch(grad,/graduation_mark|<script>/);assert.match(grad,/&lt;script&gt;/);
 independent(grad+renderGraduation(graduation,{id:'other-graduation'}));
 assert.throws(()=>renderDiploma({...diploma,image:{...diploma.image,src:'javascript:alert(1)'}}));
});
test('Form owns a complete reusable template with configurable labels and independent references',()=>{
 const html=renderLeadFormSection({...form,maxLabel:'Новая подпись MAX'});
 assert.match(html,/Новая подпись MAX/);assert.doesNotMatch(html,/\{\{/);
 independent(html+renderLeadFormSection(form,{id:'second',formId:'second-form'}));
 for(const name of ['name','email','phone','messenger','maxContact','telegramContact'])assert.ok(html.includes(`name="${name}"`));
 assert.throws(()=>renderLeadFormSection({...form,nativeMarker:''}));
 assert.throws(()=>renderLeadFormSection({...form,privacyUrl:'javascript:alert(1)'}));
});
test('Reviews retain all five entries with project media metadata and isolated IDs',async()=>{
 const source=await data('reviews'), html=renderReviews(source);
 assert.match(html,/data-slider-all-widths/);
 assert.equal((html.match(/<li class="reviews_slide/g)||[]).length,5);
 independent(html+renderReviews({...source,id:'other-reviews'}));
 for(const item of source.items)assert.ok(html.includes(`width="${item.width}" height="${item.height}"`));
});
test('Current transfer includes the new components without local runtime dependencies',async()=>{
 const manifest=JSON.parse(await read('tilda/manifest.json'));
 const html=(await Promise.all(manifest.body_files.map(f=>read('tilda/'+f)))).join('');
 for(const id of ['support-team','diploma','application','graduation','reviews'])assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1);
 assert.doesNotMatch(html,/(?:src|href)="(?:\.\.\/|assets\/|shared\/)/);
 const css=(await Promise.all(manifest.style_files.map(f=>read('tilda/'+f)))).join('');
 for(const cls of ['diploma_component','lead-form_component.is-responsive','graduation_component.is-responsive','reviews_component.is-responsive'])assert.ok(css.includes('.'+cls));
});
