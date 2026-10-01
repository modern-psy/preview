import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {renderAdmission} from '../../../shared/academy/admission-render.mjs';
const root=new URL('../',import.meta.url);
const data=JSON.parse(await fs.readFile(new URL('data/admission.json',root),'utf8'));
test('Admission instances have independent IDs and static semantic documents',()=>{
 const html=renderAdmission(data)+renderAdmission(data,{id:'admission-second'});
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
 for(const [,ref] of html.matchAll(/aria-labelledby="([^"]+)"/g))assert.ok(ids.includes(ref));
 assert.equal((html.match(/<li /g)||[]).length,6);assert.doesNotMatch(html,/<script|<button|tabindex=/);
 assert.throws(()=>renderAdmission(data,{id:'bad"id'}));
 assert.match(renderAdmission({...data,heading:'<script>'}),/&lt;script&gt;/);
});
test('Current Tilda preserves one complete admission section immediately after pricing',async()=>{
 const m=JSON.parse(await fs.readFile(new URL('tilda/manifest.json',root),'utf8'));
 const body=(await Promise.all(m.body_files.map(n=>fs.readFile(new URL('tilda/'+n,root),'utf8')))).join('');
 assert.equal((body.match(/id="admission"/g)||[]).length,1);
 const sections=[...body.matchAll(/<section[^>]*\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(sections[sections.indexOf('pricing')+1],'admission');
 assert.match(body,/admission_component section-layout_component is-responsive/);
 assert.doesNotMatch(body,/src="assets\/|href="\.\.\/.*shared/);
});
