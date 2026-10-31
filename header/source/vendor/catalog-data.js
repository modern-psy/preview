/* Данные каталога из API /api/public/catalog — один запрос на страницу.
   Этот кусок стоит в каждом блоке, которому нужен каталог: шапка, табы,
   баннер «Курсы месяца», каталог. Какой блок загрузится первым, тот и
   спрашивает API, остальные берут его ответ.

   Сколько ждём (решение Дарьи от 22.10.2026):
   1) первый запрос — 15 секунд. Пришёл ответ — блоки показывают свежие данные;
   2) не пришёл или API ответил ошибкой — блоки показывают снимок, а в фоне
      уходит второй запрос. Первый при этом не обрываем: если он просто
      медленный, его ответ тоже годится. Что придёт раньше, то и покажем;
   3) через 15 секунд после второго запроса ждать перестаём, остаётся снимок.

   Блоки зовут AspCatalogData(адрес API) и получают:
   data — обещание с ответом API (или ошибкой, если ответа так и не было);
   slow — обещание «первый запрос не успел»: пора показать снимок.
   Можно править: WAIT_MS — сколько ждать каждого запроса.
   Кусок попадает в шапку, где тесно (лимит блока T123), поэтому код короткий. */
(function () {
  'use strict';
  // Кусок уже выполнил другой блок
  if (window.AspCatalogData) return;
  var WAIT_MS = 15000;
  var loads = {};

  // Ответ годится, только если в нём есть карточки
  function check(d) {
    if (!d || !d.cards || !d.cards.length) throw new Error('API вернул пустой каталог');
    return d;
  }

  function request(api) {
    return fetch(api + '/api/public/catalog', { headers: { Accept: 'application/json' } }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(check);
  }

  window.AspCatalogData = function (api) {
    api = String(api).replace(/[/]+$/, '');
    if (loads[api]) return loads[api];
    var old = window.__aspCatalogLoad = window.__aspCatalogLoad || {};
    // Старая версия шапки или табов могла уже спросить API — берём её запрос
    var first = old[api];
    var showSnapshot, timer, again = false, fails = 0;
    var slow = new Promise(function (go) { showSnapshot = go; });
    var data = new Promise(function (ok, fail) {
      function run(p) {
        p.then(function (d) { clearTimeout(timer); ok(d); }, function (err) {
          fails++;
          if (!again) retry();
          else if (fails > 1) { clearTimeout(timer); fail(err); }
        });
      }
      // Второй запрос: снимок на экран, ждём ещё WAIT_MS
      function retry() {
        if (again) return;
        again = true;
        clearTimeout(timer);
        showSnapshot();
        timer = setTimeout(function () { fail(new Error('API не ответил')); }, WAIT_MS);
        run(request(api));
      }
      timer = setTimeout(retry, WAIT_MS);
      run(first ? first.then(check) : request(api));
    });
    // Старые версии блоков ждут ответ здесь — пусть получают тот же
    old[api] = data;
    return (loads[api] = { data: data, slow: slow });
  };
})();
