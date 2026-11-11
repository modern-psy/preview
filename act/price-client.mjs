import {createPriceModel, renderPriceBlock, renderPriceCard} from './price-model.mjs';

let current;
let root;
export function initPrice() {
  root = document.querySelector('[data-cms-price]');
  if (!root || root.dataset.priceInitialized) return;
  current = JSON.parse(document.querySelector('[data-price-snapshot]').textContent);
  root.dataset.priceInitialized = 'true';
  root.addEventListener('change', event => {
    if (!event.target.matches('.segmented_input')) return;
    root.querySelector('[data-price-card]').innerHTML = renderPriceCard(current, event.target.value);
  });
}

export function updatePrice(course) {
  if (!root) return;
  try {
    const updated = createPriceModel(course);
    const selected = root.querySelector('.segmented_input:checked')?.value;
    root.innerHTML = renderPriceBlock(updated, selected);
    current = updated;
    root.dataset.cmsState = 'ready';
  } catch {
    // Повреждённая цена не заменяет проверенный снимок сборки.
    root.dataset.cmsState = 'fallback';
  }
}
