/* Живой блок цены: запрашивает курс в Public API (docs/tilda-pricing-block.md, раздел 2) и перерисовывает блок
   через PricingPromo.render, который сам выбирает раскладку по потокам, тарифам, повышениям и листу ожидания.
   До ответа и при ошибке остаётся запаска, собранная при вёрстке. Корень: [data-price-block][data-course][data-api]. */
(function () {
  'use strict';
  var TIMEOUT_MS = 8000;
  var cache = (window.__aspCourseCache = window.__aspCourseCache || {});

  function load(api, slug) {
    var key = api + '|' + slug;
    if (cache[key]) return cache[key];
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS);
    cache[key] = fetch(api + '/api/public/course/' + encodeURIComponent(slug), {
      headers: { Accept: 'application/json' }, signal: ctrl.signal
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .finally(function () { clearTimeout(timer); });
    return cache[key];
  }

  function init() {
    if (!window.PricingPromo) return console.warn('[price-block] нет PricingPromo — показываю запаски.');
    document.querySelectorAll('[data-price-block]').forEach(function (root) {
      if (root.__priceBlockDone) return;
      root.__priceBlockDone = true;
      var api = (root.getAttribute('data-api') || '').replace(/\/+$/, '');
      var slug = (root.getAttribute('data-course') || '').trim();
      if (!api || !slug) return console.warn('[price-block] нет data-api или data-course — показываю запаски.');
      root.setAttribute('data-cms-state', 'loading');
      load(api, slug).then(function (course) {
        if (course.error) throw new Error(course.error);
        var html = window.PricingPromo.render(window.PricingPromo.fromApi(course, { id: root.getAttribute('data-block-id') || slug }));
        if (root.innerHTML.trim() !== html) root.innerHTML = html;
        root.setAttribute('data-cms-state', 'ready');
      }).catch(function (err) {
        console.error('[price-block] курс «' + slug + '» не загружен — остаётся запаска.', err);
        root.setAttribute('data-cms-state', 'error');
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
