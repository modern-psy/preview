// Сборка блока «Цена обучения» (pricing-promo) для Тильды: один файл T123 на курс (стили + запаска + скрипт).
// Используется CLI apps/preview/pricing-variants/build-tilda.mjs; сам модуль ничего не пишет на диск.
import fs from 'node:fs/promises';
import vm from 'node:vm';

const shared = new URL('./', import.meta.url);
const read = name => fs.readFile(new URL(name, shared), 'utf8');

/** CSS блока: токены и контейнер из components.css, meta-pill, текстовые модули, pricing-promo.css (с внешней карточкой) и тема блока. */
export async function pricingPromoBlockCss() {
  const components = await read('components.css');
  const base = components.split('.column-grid_component {')[0].trimEnd()
    // На странице Тильды body принадлежит Тильде, а блок не занимает весь экран.
    .replace(/body:has\(\.academy-page\) \{[^}]*\}\n*/, '')
    .replace('  min-height: 100vh;\n  overflow: clip;\n', '');
  const metaPill = components.slice(components.indexOf('.meta-pill_component {'), components.indexOf('.hero_content {')).trimEnd();
  const modules = await Promise.all(['card-spacing', 'section-spacing', 'body-text', 'section-heading', 'pricing-promo'].map(name => read(`${name}.css`)));
  const theme = `/* Тема блока: профиль анимаций и тёмная секция, как на лендингах Академии. */
.pricing-block_wrapper {
  --motion-duration: 150ms;
  --slider-duration: 400ms;
  --accordion-duration: 300ms;
  --motion-easing: ease-in-out;
  --transition-site: var(--motion-duration) var(--motion-easing);
  --color-page-background: #f5f5f5;
  --color-accent-text: #644ab2;
  --page-padding: 1rem;
  background: transparent;
}
/* Колонка формы (10 из 12) из components.css: блок цены стоит в той же колонке, что форма заявки. */
.pricing-block_wrapper .column-grid_component { display: grid; width: 100%; min-width: 0; grid-template-columns: minmax(0, 1fr); }
.pricing-block_wrapper .column-grid_content { min-width: 0; grid-column: 1; }
@media (min-width: 48rem) { .pricing-block_wrapper { --page-padding: 1.5rem; } }
@media (min-width: 64.0625rem) {
  .pricing-block_wrapper .column-grid_component { grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 1rem; }
  .pricing-block_wrapper .column-grid_content.is-content-wide { grid-column: 2 / span 10; }
}
@media (min-width: 75rem) { .pricing-block_wrapper { --page-padding: 5rem; } }
/* Тильда задаёт свои отступы и шрифт тегам; сброс со специфичностью выше, чем у правил вида .t123 p. */
.pricing-block_wrapper .pricing-promo :where(h2, h3, p, ul, li) { margin: 0; padding: 0; font-family: var(--font-family-body); }
.pricing-block_wrapper .pricing-promo ul { list-style: none; }`;
  return [base, metaPill, ...modules, theme].join('\n\n');
}

/** JS блока: табы потоков (pricing.js), renderer и загрузчик CMS, один раз в конце блока. */
export async function pricingPromoBlockJs() {
  return (await Promise.all(['pricing.js', 'pricing-promo-render.js', 'pricing-promo.js'].map(read))).join('\n');
}

/** Renderer как в браузере: { fromApi, render }. */
export async function loadPricingPromo() {
  if (!globalThis.PricingPromo) vm.runInThisContext(await read('pricing-promo-render.js'), { filename: 'pricing-promo-render.js' });
  return globalThis.PricingPromo;
}

/**
 * Полный блок T123 для курса.
 * @param {{slug: string, course: object, api: string, builtBy?: string}} options course — ответ /api/public/course/:slug на момент сборки
 */
export async function buildPricingPromoBlock({ slug, course, api, builtBy = 'build-tilda.mjs' }) {
  if (!/^[a-z][a-z0-9_-]*$/.test(slug)) throw new Error('Slug must be HTML-safe.');
  const PricingPromo = await loadPricingPromo();
  const id = `${slug}-pricing`;
  const markup = PricingPromo.render(PricingPromo.fromApi(course, { id }));
  const mode = markup.match(/data-mode="([a-z-]+)"/)[1];
  const streams = (course.streams || []).map(s => `${s.label} (${s.status}${s.pricing?.hasTariffs ? `, тарифы: ${s.pricing.tariffs.map(t => t.title).join(', ')}` : ''})`).join('; ') || 'нет';
  const html = `<!--
  БЛОК «ЦЕНА ОБУЧЕНИЯ» · ${course.title} (slug: ${slug})
  Для Тильды: один блок T123 («HTML-код»), вставить содержимое файла целиком, в конец страницы.
  Собрано ${new Date().toISOString().slice(0, 10)}: ${builtBy} ${slug}. Общий компонент web-academy: shared/academy/pricing-promo.md.
  Тот же блок подходит любому курсу: меняется только data-course, раскладку скрипт выбирает сам.

  Что делает скрипт: запрашивает курс в Public API (data-api + data-course), смотрит потоки, тарифы,
  рассрочку, повышения и лист ожидания и перерисовывает блок. До ответа и при ошибке API остаётся
  запаска ниже, собранная из ответа API на момент сборки (режим ${mode}).

  Правила (docs/tilda-pricing-block.md и решения от 16–17.09.2026):
    • крупно цена продажи, рассрочка строкой «или … ₽/мес в рассрочку (N мес.)», одно ближайшее
      повышение «Цена с {дата} — {цена}», зачёркнутая цена только при акции «Курс месяца»;
    • один поток без тарифов: одна цена; два потока: строки потоков; тарифы: строки тарифов,
      рекомендуемый самый дорогой; табы потоков при тарифах и двух+ потоках и при трёх+ потоках;
    • лист ожидания без открытых потоков: «Запишитесь в лист ожидания», строка «Забронировать место».

  Соответствие с CMS на момент сборки:
    потоки ............ ${streams}
    описание курса .... ${course.description ? 'заполнено' : 'пусто, показывается только название'}

  🔴 Не трогать: data-price-block, data-course, data-api, data-block-id и всё внутри блока,
  разметку перерисовывает скрипт. Тексты и цены меняются в админке CMS.
-->

<style>
${await pricingPromoBlockCss()}
</style>

<div class="academy-page pricing-block_wrapper">
  <section class="section_pricing section-spacing_component" aria-labelledby="${id}-heading">
    <div class="padding-global"><div class="container-xlarge column-grid_component"><div class="column-grid_content is-content-wide">
      <div class="pricing-promo_card"><div class="pricing-promo" data-price-block data-course="${slug}" data-api="${api}" data-block-id="${id}">
${markup}
      </div></div>
    </div></div></div>
  </section>
</div>

<script>
${await pricingPromoBlockJs()}
</script>
`;
  return { html, mode, id };
}
