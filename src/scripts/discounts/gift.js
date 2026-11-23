/* Страница «Акции» · блок «Подарочный сертификат» · 23.11.2026
   1. Переключатель «На сумму / На курс» показывает нужные поля.
   2. Сертификат справа повторяет выбор: сумму или курс с ценой.
   3. «Подарить сертификат» открывает заявку и кладёт в неё выбор:
      источник для менеджера («Подарочный сертификат: 20 000 ₽» / «… на курс «…»»),
      тариф (amount-20000 / course) и курс (slug), если выбран курс.
   4. Курсы и цены обновляются из CMS (тот же запрос каталога, что у курсов месяца).
   Атрибуты data-gift-* в разметке не трогать: по ним скрипт находит элементы. */
(function () {
  'use strict';

  var NBSP = ' ';
  function rub(n) { return new Intl.NumberFormat('ru-RU').format(n).replace(/\s/g, NBSP) + NBSP + '₽'; }
  function digits(s) { return Number(String(s || '').replace(/\D/g, '')) || 0; }

  function init() {
    var root = document.querySelector('[data-gift]');
    if (!root || root.__giftDone) return;
    root.__giftDone = true;

    var kinds = root.querySelectorAll('[data-gift-kind]');
    var panes = root.querySelectorAll('[data-gift-pane]');
    var amounts = root.querySelectorAll('[data-gift-amount]');
    var own = root.querySelector('[data-gift-own]');
    var ownInput = root.querySelector('[data-gift-own-input]');
    var select = root.querySelector('[data-gift-course]');
    var card = root.querySelector('[data-gift-card]');
    var cardBottom = root.querySelector('.gift-card_bottom');
    var cardAmount = root.querySelector('[data-gift-card-amount]');
    var cardFor = root.querySelector('[data-gift-card-for]');
    var openBtn = root.querySelector('[data-gift-open]');
    var request = root.querySelector('[data-gift-request]');
    var summary = root.querySelector('[data-gift-summary]');
    var form = request && request.querySelector('form');
    var baseSource = form ? form.getAttribute('data-source') || 'Подарочный сертификат' : '';

    function kind() {
      var k = root.querySelector('[data-gift-kind]:checked');
      return k ? k.value : 'amount';
    }
    function amountChoice() {
      var a = root.querySelector('[data-gift-amount]:checked');
      return a ? a.value : '';
    }

    // Что сейчас выбрано: для сертификата, подписи над формой и заявки
    function state() {
      if (kind() === 'course' && select && select.selectedIndex >= 0) {
        var opt = select.options[select.selectedIndex];
        return {
          course: opt.value,
          title: opt.textContent.trim(),
          price: opt.getAttribute('data-price') || '',
          source: baseSource + ' на курс «' + opt.textContent.trim() + '»',
          tariff: 'course',
          summary: 'Сертификат на курс «' + opt.textContent.trim() + '»' + (opt.getAttribute('data-price') ? ', ' + opt.getAttribute('data-price') : ''),
        };
      }
      var value = amountChoice() === 'own' ? digits(ownInput && ownInput.value) : digits(amountChoice());
      return {
        value: value,
        source: baseSource + (value ? ': ' + rub(value).replace(/ /g, ' ') : ', своя сумма'),
        tariff: value ? 'amount-' + value : 'amount-own',
        summary: value ? 'Сертификат на ' + rub(value) : 'Сертификат на свою сумму',
      };
    }

    function render(animate) {
      var s = state();
      var isCourse = kind() === 'course';
      panes.forEach(function (p) { p.hidden = p.getAttribute('data-gift-pane') !== kind(); });
      if (own) own.hidden = isCourse || amountChoice() !== 'own';

      if (isCourse) {
        cardAmount.textContent = s.title || 'Курс Академии';
        cardAmount.classList.add('is-course');
        cardFor.textContent = s.price ? 'курс Академии, ' + s.price : 'курс Академии';
        card.setAttribute('aria-label', 'Подарочный сертификат на курс «' + s.title + '»');
      } else {
        cardAmount.classList.remove('is-course');
        cardAmount.textContent = s.value ? rub(s.value) : 'Своя сумма';
        cardFor.textContent = 'на' + NBSP + 'обучение в' + NBSP + 'Академии Современной Психологии';
        card.setAttribute('aria-label', 'Подарочный сертификат' + (s.value ? ' на ' + rub(s.value).replace(/ /g, ' ') : ''));
      }
      if (animate && cardBottom) {
        cardBottom.classList.remove('is-changing');
        void cardBottom.offsetWidth;
        cardBottom.classList.add('is-changing');
      }
      // Заявка: что выбрали уходит менеджеру (контракт заявки — docs/lead-contract.md)
      if (form) {
        form.setAttribute('data-source', s.source);
        form.setAttribute('data-lead-tariff', s.tariff);
        if (s.course) form.setAttribute('data-lead-course', s.course);
        else form.removeAttribute('data-lead-course');
      }
      if (summary && !request.hidden) summary.textContent = s.summary;
    }

    kinds.forEach(function (k) { k.addEventListener('change', function () { render(true); }); });
    amounts.forEach(function (a) {
      a.addEventListener('change', function () {
        render(true);
        if (a.value === 'own' && ownInput) ownInput.focus();
      });
    });
    if (ownInput) {
      // Разряды отделяются пробелом прямо при вводе: «15000» → «15 000»
      ownInput.addEventListener('input', function () {
        var n = digits(ownInput.value);
        ownInput.value = n ? new Intl.NumberFormat('ru-RU').format(n) : '';
        render(false);
      });
    }
    if (select) select.addEventListener('change', function () { render(true); });

    // Заявка: без скрипта видна сразу; со скриптом закрыта до нажатия кнопки
    if (request && openBtn) {
      request.hidden = true;
      openBtn.addEventListener('click', function (e) {
        e.preventDefault();
        request.hidden = false;
        openBtn.setAttribute('aria-expanded', 'true');
        if (summary) summary.textContent = state().summary;
        request.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
        var firstField = request.querySelector('input:not([type="hidden"]):not([disabled])');
        if (firstField) setTimeout(function () { firstField.focus({ preventScroll: true }); }, 400);
      });
    }

    render(false);
    refreshCourses();

    // Курсы и цены из CMS: тот же запрос каталога, что у курсов месяца (page.js).
    // Если CMS не ответила, остаётся список, собранный при сборке сайта.
    function refreshCourses() {
      if (!select || !window.fetch) return;
      var load = window.AspDiscountsLoadCatalog
        ? window.AspDiscountsLoadCatalog(root.getAttribute('data-api'))
        : fetch(root.getAttribute('data-api') + '/api/public/catalog').then(function (r) { return r.json(); });
      load.then(function (data) {
        var list = (data.cards || []).filter(function (c) {
          var p = c.price;
          return c.mode === 'open' && p && !p.free && (p.discounted != null || p.full != null);
        });
        if (!list.length) return;
        var current = select.value;
        var groups = {};
        var order = [];
        list.forEach(function (c) {
          var s = c.section || 'Другие курсы';
          if (!groups[s]) { groups[s] = []; order.push(s); }
          groups[s].push(c);
        });
        select.textContent = '';
        order.forEach(function (s) {
          var og = document.createElement('optgroup');
          og.label = s;
          groups[s].forEach(function (c) {
            var o = document.createElement('option');
            var value = c.price.discounted != null ? c.price.discounted : c.price.full;
            o.value = c.slug;
            o.textContent = String(c.title).replace(/\s+/g, ' ').trim();
            o.setAttribute('data-price', (c.price.from ? 'от' + NBSP : '') + rub(value));
            og.appendChild(o);
          });
          select.appendChild(og);
        });
        if (current && select.querySelector('option[value="' + current + '"]')) select.value = current;
        render(false);
      }).catch(function (err) {
        console.warn('[discounts] курсы для сертификата из CMS не загружены, остаётся список со сборки.', err);
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
