/* ============================================================================
   НАСТРОЙКА СТОПОК · страница «Введение в клиническую психологию»
   ============================================================================

   ЧТО ДЕЛАЕТ ЭТОТ ФАЙЛ. Само наслаивание карточек по скроллу — это CSS
   (position: sticky, см. page.css, раздел 9). Скрипт только подгоняет два
   числа, которые в CSS посчитать нечем:

   1. ОДИНАКОВАЯ ВЫСОТА карточек в стопке ПРЕИМУЩЕСТВ.
      Там фон карточек чередуется, и если следующая ниже предыдущей, из-под
      неё выглядывает чужой цвет. Поэтому всем ставим высоту самой высокой.
      В ПРОГРАММЕ наоборот: высота карточки — строго по содержимому, пустого
      места внизу быть не должно.

   2. ТОЧКА ОСТАНОВКИ (top).
      Обычно карточка останавливается чуть ниже верха экрана. Но если она
      выше самого экрана (частый случай на телефоне), так нельзя: до её
      нижней части было бы не долистать. Тогда карточка останавливается
      наоборот — нижним краем у нижней границы экрана.

   3. ГАБАРИТ СЛОЯ С ФОТОГРАФИЕЙ ПРЕПОДАВАТЕЛЯ (только на широком экране).
      Слой должен быть точь-в-точь как карточка урока — тогда он прилипает
      и отпускается вместе с ней и фотография не убегает за пределы модуля.
      А чтобы слой не занимал места в потоке, карточку первого урока
      подтягиваем наверх ровно на его высоту.

   БЕЗ СКРИПТА СТРАНИЦА РАБОТАЕТ. Просто высоты берутся запасные, из CSS.

   🔴 Здесь нет ничего, что нужно править руками при смене текстов.
   ============================================================================ */

(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Зазор, чтобы прилипшая карточка не касалась края экрана вплотную */
  var GAP = 16;

  /* Ширина, с которой фотография превращается в отдельный слой.
     Должна совпадать с брейкпоинтом в page.css (48.0625rem = 769px). */
  var WIDE = window.matchMedia('(min-width: 48.0625rem)');

  /* Точка остановки для карточки высотой h */
  function stopFor(h, base) {
    var screen = window.innerHeight;
    return (h + base + GAP <= screen)
      ? base                                  // помещается — как обычно
      : Math.round(screen - h - GAP);         // не помещается — прижимаем низом
  }

  /* --- СТОПКА ПРЕИМУЩЕСТВ ------------------------------------------------
     Карточки разного содержания, а фон у них чередуется — поэтому из-под
     верхней карточки не должен выглядывать край нижней. Ставим всем высоту
     самой высокой. */
  function tuneStack(box) {
    var items = Array.prototype.slice.call(box.querySelectorAll(':scope > .stack_item'));
    if (!items.length) return;

    items.forEach(function (el) {
      el.style.minHeight = '';
      el.style.top = '';
    });
    if (REDUCED.matches) return;

    var base = parseFloat(window.getComputedStyle(items[0]).top) || 0;
    var tallest = 0;
    items.forEach(function (el) {
      if (el.offsetHeight > tallest) tallest = el.offsetHeight;
    });

    var top = stopFor(tallest, base);
    items.forEach(function (el) {
      el.style.minHeight = tallest + 'px';
      el.style.top = top + 'px';
    });
  }

  /* --- ПРОГРАММА ---------------------------------------------------------
     Здесь высоты НЕ выравниваем: карточка ровно по своему содержимому,
     пустого места внизу быть не должно. Нижний предел высоты задаёт CSS —
     распорка под фотографию.

     Что считаем:
       · точку остановки для каждой карточки (своя, раз высоты разные);
       · габарит слоя с фотографией — он равен ПОСЛЕДНЕЙ карточке своего
         преподавателя, чтобы отпуститься ровно вместе с ней;
       · отрицательный отступ первой карточки — чтобы слой не занимал
         места в потоке. */
  function tuneLessons(box) {
    var cards = Array.prototype.slice.call(box.querySelectorAll('.lesson_card'));
    var photos = Array.prototype.slice.call(box.querySelectorAll('.lessons_photo'));
    if (!cards.length) return;

    cards.forEach(function (el) {
      el.style.minHeight = '';
      el.style.top = '';
      el.style.marginTop = '';
    });
    photos.forEach(function (el) {
      el.style.height = '';
      el.style.top = '';
    });
    if (REDUCED.matches) return;

    var wide = WIDE.matches;
    var base = parseFloat(window.getComputedStyle(cards[0]).top) || 0;
    var screen = window.innerHeight;

    /* Высота ВИДИМОЙ полосы с фотографией над карточками модуля.
       На широком экране фото лежит поверх карточки и места не занимает. */
    function stripOf(group) {
      var layer = group ? group.querySelector('.lessons_photo') : null;
      return (layer && !wide) ? layer.offsetHeight : 0;
    }

    var prevGroup = null;
    var prevBottom = 0;          // нижний край прилипшей предыдущей карточки

    cards.forEach(function (card) {
      var group = card.closest('.lessons_group');
      var strip = stripOf(group);
      var height = card.offsetHeight;

      /* ЕДИНСТВЕННАЯ причина увеличить карточку: под ней лежит карточка
         ДРУГОГО преподавателя, а значит другого цвета. Если новая ниже,
         из-под неё выглянет чужой фон. Внутри одного преподавателя фон
         совпадает, и подгонять нечего — карточка остаётся по содержимому. */
      if (group !== prevGroup) {
        height = Math.max(height, prevBottom - base - strip);
      }

      var fits = strip + height + base + GAP <= screen;
      var top = fits ? base + strip : Math.round(screen - height - GAP);

      card.style.minHeight = height + 'px';
      card.style.top = top + 'px';

      prevBottom = top + height;
      prevGroup = group;
    });

    /* Слой с фотографией повторяет габарит ПОСЛЕДНЕЙ карточки своего
       преподавателя (плюс полоса сверху на телефоне) — тогда он
       отпускается ровно вместе с ней. Места в потоке слой не занимает:
       первая карточка модуля подтянута наверх на высоту этой карточки. */
    photos.forEach(function (layer) {
      var group = layer.parentElement;
      var own = group
        ? Array.prototype.slice.call(group.querySelectorAll('.lesson_card'))
        : [];
      if (!own.length) return;

      var strip = wide ? 0 : layer.offsetHeight;
      var last = own[own.length - 1];
      var height = last.offsetHeight;

      layer.style.height = (strip + height) + 'px';
      layer.style.top = (parseFloat(last.style.top) - strip) + 'px';
      own[0].style.marginTop = -height + 'px';
    });
  }

  function tune() {
    document.querySelectorAll('.stack_component').forEach(tuneStack);
    document.querySelectorAll('.lessons_stack').forEach(tuneLessons);
  }

  /* Пересчитываем не чаще одного раза за короткий промежуток, иначе при
     перетаскивании края окна пересчёт запускался бы сотни раз в секунду.

     Раньше здесь был requestAnimationFrame — и это оказалось ловушкой:
     в неактивной вкладке браузер не рисует кадры, а значит и пересчёт
     не запускался. Страница, открытая в фоновой вкладке, оставалась
     ненастроенной. Обычный таймер срабатывает всегда. */
  var waiting = false;
  function schedule() {
    if (waiting) return;
    waiting = true;
    window.setTimeout(function () {
      waiting = false;
      tune();
    }, 50);
  }

  tune();        /* сразу, не дожидаясь таймера */
  schedule();    /* и ещё раз чуть позже — на случай, если что-то доехало */
  window.addEventListener('load', schedule);
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
})();
