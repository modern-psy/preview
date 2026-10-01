import fs from 'node:fs/promises';
import {renderReviews} from '../../../shared/academy/reviews-render.mjs';
const data = JSON.parse(await fs.readFile(new URL('../data/reviews.json', import.meta.url), 'utf8'));
const markup = renderReviews(data).replaceAll('src="assets/', 'src="../assets/').replaceAll('poster="assets/', 'poster="../assets/');
const html = `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Slider input checks</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css">
${['components','review-controls','review-panel','review-card','reviews','reviews-responsive','section-heading'].map(name=>`<link rel="stylesheet" href="../../../shared/academy/${name}.css">`).join('')}
<link rel="stylesheet" href="../styles.css?v=motion-150-ease">
<script src="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js"></script><script>const OriginalSplide=window.Splide;window.Splide=class extends OriginalSplide {constructor(...args){super(...args);window.fixtureSlider=this;}}</script>
${['review-panel','review-card','components'].map(name=>`<script src="../../../shared/academy/${name}.js?v=wheel-4" defer></script>`).join('')}
<body><main class="academy-page psychologist-consultant-page" style="max-width:48rem;margin:auto"><output id="results">Running</output>${markup}</main>
<script>
addEventListener('DOMContentLoaded',async()=>{
const results=[],out=document.querySelector('#results');
const check=(ok,label)=>{if(!ok)throw Error(label);results.push('PASS '+label);out.textContent=results.join(' | ')};
const wait=()=>new Promise(resolve=>setTimeout(resolve,450));
const slider=document.querySelector('[data-academy-slider]'), cards=[...slider.querySelectorAll('.reviews_slide')];
const index=()=>window.fixtureSlider.index;
const wheel=(target,deltaX,deltaY,extra={})=>{const e=new WheelEvent('wheel',{deltaX,deltaY,bubbles:true,cancelable:true,...extra});target.dispatchEvent(e);return e};
const key=value=>slider.dispatchEvent(new KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true}));
try {
 const style=getComputedStyle(slider);check(style.getPropertyValue('--motion-duration').trim()==='150ms' && style.getPropertyValue('--motion-easing').trim()==='ease-in-out','shared motion is 150ms ease-in-out');
 check(cards.length===5,'all five cards retained');
 await wait();
 check(index()===0,'starts at first review');
 check(window.fixtureSlider.options.speed===400,'reviews use shared 400ms transition');
 key('ArrowRight');await wait();check(index()===1,'Right arrow moves next');
 key('ArrowLeft');await wait();check(index()===0,'Left arrow moves previous');
 check(!wheel(slider,0,100).defaultPrevented,'vertical wheel is released to the page');await wait();check(index()===0,'vertical scrolling does not move the carousel');
 wheel(slider,100,0);await wait();check(index()===1,'horizontal gesture moves next');
 wheel(slider,-100,0);await wait();check(index()===0,'horizontal wheel moves previous');
 wheel(slider,3,0,{deltaMode:1});await wait();check(index()===1,'line-mode mouse wheel is normalized');
 const video=slider.querySelector('video');wheel(video,100,0);await wait();check(index()===2,'wheel also works over enhanced video');
 const previous=index();check(!wheel(slider,0,100,{ctrlKey:true}).defaultPrevented && index()===previous,'zoom input is preserved');
 const panel=slider.querySelector('[data-review-full]');check(!wheel(panel,0,100).defaultPrevented && index()===previous,'review text keeps its own scrolling');
 const button=slider.querySelector('[data-review-toggle]');button.click();
 const animations=button.closest('academy-review').getAnimations({subtree:true});check(animations.length>0 && animations.every(a=>a.effect.getTiming().duration===150 && a.effect.getTiming().easing==='ease-in-out'),'review animation uses actual shared timing');button.click();await wait();
 for(let i=0;i<cards.length;i++){key('ArrowRight');await wait();
 const move=window.fixtureSlider.Components.Move;
 if(move.toPosition(index(),true)===move.toPosition(cards.length-1,true)) check(document.querySelector('[data-slider-next]').disabled,'next arrow disables at the first real end position');
 }
 check(!wheel(slider,100,0).defaultPrevented,'end of carousel releases page scroll');
 for(let i=0;i<cards.length;i++){key('ArrowLeft');await wait();}
 await wait();
 const startIndex=index(), startWheel=wheel(slider,-100,0);
 check(startIndex===0 && !startWheel.defaultPrevented,'start of carousel releases page scroll (index '+startIndex+', captured '+startWheel.defaultPrevented+')');
 const script=document.createElement('script');script.src='../../../shared/academy/components.js?v=wheel-4';const loaded=new Promise(resolve=>script.onload=resolve);document.body.append(script);await loaded;
 key('ArrowRight');await wait();check(index()===1,'reinitialization retains a single keyboard handler');
}catch(error){results.push('FAIL '+error.message)}
out.textContent=results.join(' | ');
});
</script></body></html>`;
await fs.writeFile(new URL('slider-fixture.html', import.meta.url), html);
