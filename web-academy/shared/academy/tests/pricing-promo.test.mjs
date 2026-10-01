import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPricingPromo } from '../pricing-promo-tilda.mjs';

const PricingPromo = await loadPricingPromo();
const stream = (label, startDate, status, pricing) => ({ label, startDate, status, pricing: { hasTariffs: false, currentPrice: null, fullPaymentPrice: null, installmentMonths: null, installmentPerMonth: null, nextPriceChange: null, bookingPrice: null, ...pricing } });
const course = (streams, extra = {}) => ({ title: 'Курс', description: 'Описание для каталога', promo: { active: false }, streams, nearestStream: streams[0] || null, ...extra });
const mode = html => html.match(/data-mode="([a-z-]+)"/)[1];
const render = (c, id = 'test') => PricingPromo.render(PricingPromo.fromApi(c, { id }));

test('один открытый поток без тарифов: одна цена, рассрочка и повышение по данным', () => {
  const html = render(course([stream('Поток 18 сентября 2026', '2026-09-18', 'Идет набор', { currentPrice: 110000, installmentMonths: 24, installmentPerMonth: 4583, nextPriceChange: { at: '2026-09-30T21:00:00.000Z', price: 120000, fullPaymentPrice: null } })]));
  assert.equal(mode(html), 'single');
  assert.match(html, /Стоимость обучения/);
  assert.match(html, /pricing-promo_number">110&nbsp;000&nbsp;₽/);
  assert.match(html, /или 4&nbsp;583&nbsp;₽\/мес в&nbsp;рассрочку \(24&nbsp;мес\.\)/);
  assert.match(html, /Цена с&nbsp;1&nbsp;октября&nbsp;— 120&nbsp;000&nbsp;₽/);
  assert.match(html, /<time datetime="2026-09-18">18&nbsp;сентября<\/time>/);
  assert.doesNotMatch(html, /role="tab"/);
});

test('два потока без тарифов: строки потоков без табов, крупно цена продажи', () => {
  const html = render(course([
    stream('Поток 15 января 2027', '2027-01-15', 'Идет набор', { currentPrice: 156000, fullPaymentPrice: 130000 }),
    stream('Поток 6 ноября 2026', '2026-11-06', 'Идет набор', { currentPrice: 180000, fullPaymentPrice: 150000 }),
  ]));
  assert.equal(mode(html), 'streams');
  assert.equal((html.match(/<li class="pricing-promo_row"/g) || []).length, 2);
  assert.ok(html.indexOf('6&nbsp;ноября') < html.indexOf('15&nbsp;января'), 'ближайший поток первым');
  assert.match(html, /150&nbsp;000&nbsp;₽/);
  assert.doesNotMatch(html, /role="tab"/);
});

test('тарифы: строки в порядке CMS, самый дорогой рекомендуемый, описание из CMS, табы при двух потоках', () => {
  const tariffs = [{ title: 'Стандарт', description: 'Курс и супервизии', price: 253000, fullPaymentPrice: 220000 }, { title: 'Эксперт', price: 310000, fullPaymentPrice: 270000 }];
  const one = render(course([stream('Поток 15 сентября 2026', '2026-09-15', 'Идет набор', { hasTariffs: true, tariffs })]));
  assert.equal(mode(one), 'plans');
  assert.doesNotMatch(one, /role="tab"/);
  assert.match(one, /is-featured"><div class="pricing-promo_row-copy"><h3[^>]*>Эксперт/);
  assert.match(one, /Курс и&nbsp;супервизии/);
  const two = render(course([
    stream('Поток 15 сентября 2026', '2026-09-15', 'Идет набор', { hasTariffs: true, tariffs }),
    stream('Поток 12 февраля 2027', '2027-02-12', 'Идет набор', { hasTariffs: true, tariffs: tariffs.map(t => ({ ...t, price: t.price + 10000, fullPaymentPrice: t.fullPaymentPrice + 10000 })) }),
  ]));
  assert.equal(mode(two), 'plans');
  assert.equal((two.match(/role="tab"/g) || []).length, 2);
  assert.match(two, /^<academy-pricing class="pricing-promo_component is-tabbed"/);
  assert.equal((two.match(/data-pricing-stream="s2"/g) || []).length, 3, 'метка старта и две ячейки второго потока');
});

test('три потока без тарифов: табы и одна цена на поток', () => {
  const html = render(course([1, 2, 3].map(i => stream(`Поток ${i}`, `2027-0${i}-01`, 'Идет набор', { currentPrice: 50000 }))));
  assert.equal(mode(html), 'tabs-single');
  assert.equal((html.match(/role="tab"/g) || []).length, 3);
  assert.equal((html.match(/pricing-promo_price is-single/g) || []).length, 3);
});

test('лист ожидания без открытых потоков: свой заголовок, бронь, без дат; открытый поток его отменяет', () => {
  const waiting = stream('Поток 10 августа 2026', null, 'Лист ожидания', { bookingPrice: 5000 });
  const html = render(course([waiting]));
  assert.equal(mode(html), 'waitlist');
  assert.match(html, /Запишитесь в&nbsp;лист ожидания/);
  assert.match(html, /Забронировать место/);
  assert.match(html, /5&nbsp;000&nbsp;₽/);
  assert.doesNotMatch(html, /<time/);
  assert.match(render(course([{ ...waiting, pricing: { ...waiting.pricing, bookingPrice: null } }])), /Цена откроется позже/);
  assert.equal(mode(render(course([waiting, stream('Поток 1 мая 2027', '2027-05-01', 'Идет набор', { currentPrice: 40000 })]))), 'single');
});

test('акция, ноль и отсутствие цены; закрытый набор падает на nearestStream', () => {
  const promo = render(course([stream('Поток', '2026-10-01', 'Идет набор', { currentPrice: 40000, fullPaymentPrice: 36000, fullPaymentPriceBeforeDiscount: 40000 })], { promo: { active: true, label: 'Курс месяца', discountPercent: 10, until: '2026-09-30' } }));
  assert.match(promo, /<s class="pricing-promo_old">40&nbsp;000&nbsp;₽<\/s>/);
  assert.match(promo, /Курс месяца&nbsp;— скидка 10% до&nbsp;30&nbsp;сентября/);
  assert.match(render(course([stream('Поток', '2026-10-01', 'Идет набор', { currentPrice: 0 })])), /Бесплатно/);
  const closed = stream('Поток', '2026-05-01', 'Набор завершен', { currentPrice: null });
  const html = render(course([closed]));
  assert.equal(mode(html), 'single');
  assert.match(html, /Стоимость уточняется/);
  assert.match(render(course([stream('Поток', '2026-10-01', 'Идет набор', { currentPrice: 1000 })], { title: '<b>x</b>' })), /&lt;b&gt;x&lt;\/b&gt;/);
});
