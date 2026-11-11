import {API, SLUG, createHeroModel, renderCmsField} from './cms-model.mjs';

import {initPrice, updatePrice} from './price-client.mjs';
initPrice();

// До ответа виден снимок CMS со сборки. При сетевой ошибке он остаётся на странице.
const root = document.querySelector('[data-cms-hero]');
if (root && !root.hasAttribute('data-cms-initialized')) {
  root.setAttribute('data-cms-initialized', '');
  root.dataset.cmsState = 'loading';
  root.setAttribute('aria-busy', 'true');
  const fields = [...root.querySelectorAll('[data-cms]')];
  // Название и описание из снимка остаются читаемыми во время обновления CMS.
  fields.filter(node => !['course-title', 'course-description'].includes(node.dataset.cms)).forEach(node => node.classList.add('skeleton'));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const load = path => fetch(API + path, {headers: {Accept: 'application/json'}, signal: controller.signal}).then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });
  Promise.allSettled([load(`/api/public/course/${SLUG}`), load('/api/public/catalog')]).then(([courseResult, catalogResult]) => {
    if (courseResult.status !== 'fulfilled') throw new Error('CMS недоступна');
    // Каталог может отказать отдельно: тогда сохраняем только снимок часов, остальные поля обновляем.
    const card = catalogResult.status === 'fulfilled'
      ? catalogResult.value.cards?.find(item => item.slug === SLUG)
      : {slug: SLUG, hours: Number(root.dataset.cmsHours)};
    const model = createHeroModel(courseResult.value, card);
    updatePrice(courseResult.value);
    fields.forEach(node => {
      const field = node.dataset.cms === 'streams' && node.dataset.cmsLayout === 'line' ? 'streams-line' : node.dataset.cms;
      const html = renderCmsField(field, model);
      node.innerHTML = html;
      const block = node.closest('[data-cms-block]') || node;
      block.hidden = !html;
      node.dataset.cmsState = 'ready';
    });
    root.dataset.cmsState = catalogResult.status === 'fulfilled' ? 'ready' : 'partial';
  }).catch(() => {
    root.dataset.cmsState = 'fallback';
    const priceRoot = document.querySelector('[data-cms-price]');
    if (priceRoot) priceRoot.dataset.cmsState = 'fallback';
  }).finally(() => {
    clearTimeout(timer);
    root.setAttribute('aria-busy', 'false');
    fields.forEach(node => node.classList.remove('skeleton'));
  });
}

if(!root && document.querySelector('[data-cms-price]')){fetch(API+'/api/public/course/'+SLUG,{signal:AbortSignal.timeout(8000)}).then(response=>{if(!response.ok)throw new Error('CMS');return response.json();}).then(updatePrice).catch(()=>{document.querySelector('[data-cms-price]').dataset.cmsState='fallback';});}
