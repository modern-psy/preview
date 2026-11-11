import {createHeroModel, escapeHtml, formatStart} from './cms-model.mjs';
import {tariffContent} from './tariff-content.mjs';

// Композиция и расчёт рассрочки — из утверждённого pricing-scenarios.
// Цены менять в CMS. Состав до появления поля API хранится в tariff-content.mjs.
const positive = value => typeof value === 'number' && Number.isFinite(value) && value > 0;
const money = value => new Intl.NumberFormat('ru-RU').format(Math.round(value)) + '\u00a0₽';
const date = value => new Intl.DateTimeFormat('ru-RU', {day: 'numeric', month: 'long', timeZone: 'Europe/Moscow'}).format(new Date(value));
const t = escapeHtml;

export function createPriceModel(course) {
  const hero = createHeroModel(course, null);
  const streams = hero.streams.filter(stream => stream.tone !== 'neutral').map(stream => {
    const source = course.streams.find(item => item.startDate === stream.startDate);
    const pricing = source.pricing;
    if (!pricing) throw new Error('У потока нет цены');
    const tariffs = pricing.hasTariffs ? pricing.tariffs || [] : [pricing];
    if (!tariffs.length) throw new Error('У потока нет тарифов');
    const prices = tariffs.map(selected => {
    const list = selected.currentPrice ?? selected.price;
    if (!positive(list)) throw new Error('Некорректная цена потока');
    const once = positive(selected.fullPaymentPrice) && selected.fullPaymentPrice < list ? selected.fullPaymentPrice : null;
    const sale = once ?? list;
    const months = positive(selected.installmentPerMonth) && positive(selected.installmentMonths) ? selected.installmentMonths : 24;
    const perMonth = positive(selected.installmentPerMonth) ? selected.installmentPerMonth : Math.round(list / 24);
    const nextSource = selected.nextPriceChange;
    const nextList = nextSource?.price;
    const nextOnce = nextSource?.fullPaymentPrice;
    const next = positive(nextList) && Number.isFinite(Date.parse(nextSource.at)) ? {
      at: nextSource.at, label: date(nextSource.at), price: positive(nextOnce) && nextOnce < nextList ? nextOnce : nextList
    } : null;
    return {tariff: pricing.hasTariffs ? selected.title : '', description: selected.description || '', content: tariffContent(stream.startDate, selected.title), list, sale, benefit: list - sale, months, perMonth, next};
    }).sort((a, b) => a.list - b.list);
    return {...stream, prices};
  });
  if (!streams.length) throw new Error('Нет потоков с открытой продажей');
  return {title: hero.title, streams};
}

export function renderPriceCard(model, selectedDate) {
  const stream = model.streams.find(item => item.startDate === selectedDate) || model.streams[0];
  const moneyHtml = price => `<p class="price-tag"><span class="text-size-section-title">${money(price.sale).replace('\u00a0₽', '')}</span><span class="text-size-lead text-color-secondary">₽</span></p><p class="price-caption text-size-note">${price.benefit ? `<span><span class="price-caption_benefit text-weight-medium">Выгода ${money(price.benefit)}</span> при оплате сразу</span>` : ''}<span>Или ${money(price.perMonth)}/мес в рассрочку на ${price.months} мес</span></p>`;
  const rise = price => price.next && price.next.price > price.sale ? `<div class="price-wide_foot"><p class="price-rise"><span class="price-rise_icon" aria-hidden="true"><span class="icon is-md" style="--icon-url: url('/act/icons/trending-up.svg')"></span></span><span class="price-rise_text"><span class="text-size-note text-weight-medium">С ${t(price.next.label)}: ${money(price.next.price)}</span><span class="text-size-note text-color-secondary">Подорожает на ${money(price.next.price - price.sale)}</span></span></p></div>` : '';
  const start = `Старт <time datetime="${t(stream.startDate)}">${t(formatStart(stream.startDate))}</time>`;
  if (stream.prices.length > 1) return `<ul class="price-cards" role="list" data-price-stream="${t(stream.startDate)}">${stream.prices.map((price, index) => `<li class="price-card_component${index === stream.prices.length - 1 ? ' is-featured' : ''}">${index === stream.prices.length - 1 ? '<span class="price-card_badge text-size-note">\u0420\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0443\u0435\u043c</span>' : ''}<div class="price-card_head"><h3 class="text-size-block-title">${t(price.tariff)}</h3><p class="text-size-note text-color-secondary">${start}</p></div><div class="price-card_money">${moneyHtml(price)}</div>${renderTariffContent(price)}<div class="price-card_foot">${rise(price)}</div></li>`).join('')}</ul>`;
  const price = stream.prices[0];
  return `<div class="price-wide_component is-plain" data-price-stream="${t(stream.startDate)}"><div class="price-wide_main"><span class="price-wide_chip text-size-note">${t(price.tariff || 'Полный курс')}</span><div class="price-wide_title"><h3 class="text-size-block-title">${t(model.title)}</h3><p class="text-size-note text-color-secondary">${start}</p></div></div><div class="price-wide_side"><div class="price-wide_money">${moneyHtml(price)}${rise(price)}</div></div></div>`;
}

function renderTariffContent(price) {
  if (!price.content) return price.description ? `<p class="price-card_list text-size-note">${t(price.description)}</p>` : '';
  return `<div class="price-card_list"><p class="text-size-note text-weight-medium">${price.content.count} ${price.content.count === 4 ? '\u043c\u043e\u0434\u0443\u043b\u044f' : '\u043c\u043e\u0434\u0443\u043b\u0435\u0439'} \u0432 \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0435</p><ul class="price-check" role="list">${price.content.rows.map(row => `<li class="price-check_item${row.included ? '' : ' is-off'}"><span class="icon is-md" aria-hidden="true" style="--icon-url: url('/act/icons/${row.included ? 'check' : 'x'}.svg')"></span><span class="text-size-note">${t(row.text)}${row.included ? '' : '<span class="visually-hidden">\u041d\u0435 \u0432\u0445\u043e\u0434\u0438\u0442</span>'}</span></li>`).join('')}</ul></div>`;
}

export function renderPriceBlock(model, selectedDate) {
  const picked = model.streams.find(item => item.startDate === selectedDate)?.startDate || model.streams[0].startDate;
  const controls = model.streams.map(stream => `<label class="segmented_item"><input class="segmented_input" type="radio" name="act-price-stream" value="${t(stream.startDate)}"${picked === stream.startDate ? ' checked' : ''}><span class="segmented_label text-size-note">${t(date(stream.startDate + 'T12:00:00Z'))}</span></label>`).join('');
  return `<div class="price-block_component"><div class="price-block_head"><h2 class="text-size-section-title" id="act-price-heading">Стоимость обучения</h2><fieldset class="price-switch"><legend class="price-switch_legend text-size-note text-color-secondary">Старт</legend><div class="segmented_component">${controls}</div></fieldset></div><div data-price-card aria-live="polite">${renderPriceCard(model, picked)}</div></div>`;
}

// Общие условия — текст из утверждённой библиотеки, не поля конкретного тарифа.
function renderTerms() {
  return `<section class="price-terms_component" aria-labelledby="act-terms-heading"><h3 class="text-size-block-title" id="act-terms-heading">Гибкие условия оплаты</h3><dl class="price-terms_list"><div class="price-terms_row"><dt class="text-size-body text-weight-medium">Рассрочка до 24 месяцев</dt><dd class="price-terms_body text-size-note text-color-secondary">От банков-партнёров. Платёж делится на равные части, платите со второго месяца обучения.</dd></div><div class="price-terms_row"><dt class="text-size-body text-weight-medium">Персональные скидки</dt><dd class="price-terms_body"><ul class="price-discounts" role="list"><li class="price-discounts_item"><span class="price-discounts_value text-size-note text-weight-medium">−10 %</span><span class="text-size-note text-color-secondary">новым студентам</span></li><li class="price-discounts_item"><span class="price-discounts_value text-size-note text-weight-medium">−20 %</span><span class="text-size-note text-color-secondary">вам и&nbsp;коллеге, которого вы&nbsp;пригласили<span class="price-discounts_note text-size-caption-md text-color-secondary">если он ещё не&nbsp;учился у&nbsp;нас</span></span></li><li class="price-discounts_item"><span class="price-discounts_value text-size-note text-weight-medium">до −20 %</span><span class="text-size-note text-color-secondary">нашим выпускникам за отзыв</span></li></ul></dd></div><div class="price-terms_row"><dt class="text-size-body text-weight-medium">Налоговый вычет 13 %</dt><dd class="price-terms_body text-size-note text-color-secondary">Подробно расскажем, как оформить документы, чтобы вернуть 13 % от стоимости обучения.</dd></div></dl></section>`;
}
