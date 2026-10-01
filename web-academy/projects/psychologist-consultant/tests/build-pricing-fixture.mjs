import fs from 'node:fs/promises';
import { renderPricing } from '../../../shared/academy/pricing-render.mjs';
const root = new URL('../', import.meta.url);
const original = JSON.parse(await fs.readFile(new URL('data/pricing.json', root), 'utf8'));
const styles = await Promise.all(['components','card-spacing','pricing','button','body-text','section-heading'].map(name => fs.readFile(new URL(`../../../shared/academy/${name}.css`, import.meta.url), 'utf8')));
const theme = (await fs.readFile(new URL('styles.css', root), 'utf8')).match(/\.psychologist-consultant-page \{[\s\S]*?\n\}/)[0].replace('.psychologist-consultant-page', '.academy-page');
const variants = [1, 2, 3].map(count => {
  const config = structuredClone(original);
  config.id = `fixture-${count}`;
  config.title = `Проверка: ${count} тариф(а)`;
  if (count === 1) config.streams = config.streams.slice(0, 1);
  config.plans = Array.from({length: count}, (_, index) => {
    const plan = structuredClone(original.plans[index % 2]);
    plan.id = `plan-${index}`;
    plan.prices.winter = {monthly: 15000 + index, total: 300000 + index, months: 24};
    if (index === 0) plan.prices.winter.increase = {from: '2026-10-01', fromLabel: 'с 1 октября', monthly: 12000, total: 250000};
    return plan;
  });
  for (const [key, url] of Object.entries(config.icons)) if (url.startsWith('assets/')) config.icons[key] = '../' + url;
  return renderPricing(config);
});
const ladders = variants.join('').match(/class="pricing_increase"/g)?.length ?? 0;
if (ladders !== variants.length) throw new Error(`Expected one increase ladder per fixture variant, got ${ladders}.`);
await fs.writeFile(new URL('tests/pricing-fixture.html', root), `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pricing component fixture</title><link rel="icon" href="data:,"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Wix+Madefor+Text:wght@400;444;500;600&display=swap"><style>${styles.join('\n')}${theme}</style><style>main{padding:24px}section{padding:40px 0;background:#2b2334}output{display:block}</style></head><body><main class="academy-page"><button type="button" id="reconnect">Переподключить компоненты</button><button type="button" id="reinit">Повторить скрипт</button><output id="events">Событий: 0</output>${variants.map(markup => `<section>${markup}</section>`).join('')}</main><script>
const params = new URLSearchParams(location.search);
if (params.has('zoom')) document.documentElement.style.fontSize = '200%';
if (params.has('reduce')) {
  const original = window.matchMedia;
  window.matchMedia = query => { const media = original(query); if(query.includes('prefers-reduced-motion')) Object.defineProperty(media, 'matches', {value:true}); return media; };
}
const boot = () => { const script = document.createElement('script'); script.src = '../../../shared/academy/pricing.js?v=pricing-5'; document.body.append(script); };
if (!params.has('nojs')) boot();
let count = 0;
document.addEventListener('academy-pricing:change', () => {document.querySelector('#events').value = 'Событий: ' + ++count;});
document.querySelector('#reconnect').onclick = () => document.querySelectorAll('academy-pricing').forEach(element => { const parent = element.parentElement; element.remove(); parent.append(element); });
document.querySelector('#reinit').onclick = boot;
</script></body></html>`);
