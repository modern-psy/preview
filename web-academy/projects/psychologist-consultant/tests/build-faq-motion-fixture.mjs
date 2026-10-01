import fs from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const index = await fs.readFile(new URL('index.html', root), 'utf8');
const faq = index.match(/<section[^>]+id="faq"[\s\S]*?<\/section>/)[0];
const html = `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>FAQ motion checks</title>
<link rel="stylesheet" href="../../../shared/academy/components.css"><link rel="stylesheet" href="../styles.css">
<link rel="stylesheet" href="../../../shared/academy/body-text.css"><link rel="stylesheet" href="../../../shared/academy/section-spacing.css"><link rel="stylesheet" href="../../../shared/academy/toggle-icon.css"><link rel="stylesheet" href="../../../shared/academy/faq-responsive.css"><link rel="stylesheet" href="../../../shared/academy/section-heading.css">
<main class="academy-page psychologist-consultant-page"><output id="results">Running</output>${faq}</main>
<script src="../../../shared/academy/components.js"></script>
<script>
addEventListener('load',async()=>{
const output=document.querySelector('#results'),checks=[];
const check=(ok,name)=>{if(!ok)throw Error(name);checks.push(name);};
const items=[...document.querySelectorAll('[data-accordion-item]')];
const wait=()=>Promise.all(document.getAnimations().map(a=>new Promise(resolve=>{if(a.playState==='finished'||a.playState==='idle')resolve();else {a.addEventListener('finish',resolve,{once:true});a.addEventListener('cancel',resolve,{once:true});}})));
try {
check(!matchMedia('(prefers-reduced-motion: reduce)').matches,'normal preview has motion enabled');
items[0].querySelector('summary').click();
const animations=items[0].querySelector('[data-accordion-panel]').getAnimations();
check(animations.length===1 && animations[0].effect.getTiming().duration===300,'FAQ creates a real 300ms opening animation');
check(items[0].dataset.accordionState==='opening','opening state is active');
await wait();check(items[0].open && items[0].dataset.accordionState==='open','opening completes');
items[1].querySelector('summary').click();
check(items[0].dataset.accordionState==='closing' && items[1].dataset.accordionState==='opening','closing and opening animate together');
await wait();check(!items[0].open && items[1].open,'single open answer is preserved');
output.textContent=JSON.stringify({passed:checks.length,checks});
}catch(error){output.textContent=JSON.stringify({failed:error.message,checks});}
});
</script></html>`;
await fs.writeFile(new URL('tests/faq-motion-fixture.html', root), html);
