import fs from 'node:fs/promises';
import {renderReviewCard} from '../../../shared/academy/reviews-render.mjs';
const data = JSON.parse(await fs.readFile(new URL('../data/reviews.json', import.meta.url), 'utf8'));
const cards = data.items.filter(item => item.type === 'text').slice(0,2).map(item=>renderReviewCard({...item,image:item.image.startsWith('assets/')?'../'+item.image:item.image}, 'fixture', {responsive:true, icons:data.icons})).join('');
const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Review component lifecycle checks</title>${['components','card-spacing','review-controls','review-panel','review-card','reviews-responsive','section-heading'].map(name=>`<link rel="stylesheet" href="../../../shared/academy/${name}.css">`).join('')}<link rel="stylesheet" href="../styles.css"><script src="../../../shared/academy/review-panel.js" defer></script><script src="../../../shared/academy/review-card.js" defer></script></head><body><main class="academy-page psychologist-consultant-page"><h1>Review lifecycle checks</h1><output id="results">Running</output><div style="max-width:23rem">${cards}</div></main><script>
addEventListener('DOMContentLoaded', async () => {
 const results=[];
 const assert=(condition,label)=>{if(!condition)throw Error(label);results.push('PASS '+label)};
 try {
  const [first,second]=document.querySelectorAll('academy-review');
  const button=first.querySelector('button'); const full=first.querySelector('[data-review-full]');
  assert(first.hasAttribute('data-ready') && full.hidden,'progressive enhancement starts closed');
  button.click(); await new Promise(requestAnimationFrame);
  assert(first.hasAttribute('open') && !full.hidden && button.getAttribute('aria-expanded')==='true','button opens with synchronized ARIA');
  assert(!second.hasAttribute('open'),'instances stay independent');
  full.focus(); full.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  assert(!first.hasAttribute('open') && document.activeElement===button,'Escape closes and returns focus');
  const parent=first.parentElement;first.remove();
  assert(!first.hasAttribute('data-ready') && !full.hidden && button.hidden,'disconnect releases enhanced presentation');
  parent.prepend(first);button.click();
  assert(first.hasAttribute('open') && !full.hidden,'reconnect initializes exactly once');
  const script=document.createElement('script');script.src='../../../shared/academy/review-card.js';document.body.append(script);
  await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=reject});button.click();
  assert(!first.hasAttribute('open'),'duplicate runtime preserves a single toggle');
  first.setAttribute('open','');
  assert(button.getAttribute('aria-expanded')==='true' && full.tabIndex===0,'public open attribute supports keyboard reading');
  await new Promise(resolve=>setTimeout(resolve,300));
  assert(full.scrollHeight>full.clientHeight,'long text scrolls inside the panel');
  button.click();
  const label=button.querySelector('.review-toggle_label');
  const animations=first.getAnimations({subtree:true});
  for(const animation of animations){animation.pause();animation.currentTime=animation.effect.getTiming().duration * 0.4;}
  assert(getComputedStyle(button).overflow==='hidden' && Number(getComputedStyle(label).opacity)===0,'incoming label stays hidden during expansion');
  for(const animation of animations)animation.currentTime=animation.effect.getTiming().duration * 0.9;
  const labelBox=label.getBoundingClientRect(),buttonBox=button.getBoundingClientRect();
  assert(labelBox.left>=buttonBox.left && labelBox.right<=buttonBox.right,'label fits the button before fading in');
  for(const animation of animations)animation.finish();
  button.click();button.click();await new Promise(resolve=>setTimeout(resolve,300));
  assert(!first.hasAttribute('open') && button.getAttribute('aria-expanded')==='false','rapid reversals settle into the correct state');
 }catch(error){results.push('FAIL '+error.message)}
 document.querySelector('#results').textContent=results.join(' | ');
});
<\/script></body></html>`;
await fs.writeFile(new URL('reviews-fixture.html',import.meta.url),html);
