/* ============================================================
   Мероприятия modern-psy.ru/events · поведение страницы
   1. Видеоотчёт грузится только по кнопке «Смотреть, как это было»:
      до клика на странице нет ни одного плеера — так она открывается быстрее.
   2. Ближайшее мероприятие прячется само на следующий день после даты
      (атрибут data-until у карточки).
   Здесь ничего править не нужно: видео и даты задаются в data/events.json.
   ============================================================ */
(function () {
  'use strict';

  var page = document.querySelector('.events-page');
  if (!page || page.hasAttribute('data-events-ready')) return; // не запускать дважды
  page.setAttribute('data-events-ready', '');

  // 1. Видео по клику: Kinescope работает в России без VPN, YouTube остался у одного ролика
  page.addEventListener('click', function (event) {
    var button = event.target.closest('[data-event-play]');
    if (!button) return;
    var box = button.closest('[data-event-video]');
    if (!box) return;

    var kinescope = box.getAttribute('data-kinescope');
    var youtube = box.getAttribute('data-youtube');
    var frame = document.createElement('iframe');
    frame.src = kinescope
      ? 'https://kinescope.io/embed/' + kinescope + '?autoplay=1'
      : 'https://www.youtube-nocookie.com/embed/' + youtube + '?autoplay=1&rel=0';
    frame.title = 'Видеоотчёт: ' + box.getAttribute('data-event-title');
    frame.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write';
    frame.allowFullscreen = true;
    box.appendChild(frame);
    button.remove();
    frame.focus();
  });

  // 2. Прошедшее «ближайшее» прячем, пока его не перенесли в список вручную
  var today = new Date().toISOString().slice(0, 10);
  var upcoming = page.querySelector('[data-events-upcoming]');
  if (upcoming) {
    var cards = upcoming.querySelectorAll('[data-until]');
    var left = 0;
    cards.forEach(function (card) {
      if (card.getAttribute('data-until') <= today) {
        card.hidden = true;
        var link = page.querySelector('.events-index_link[href="#' + card.id + '"]');
        if (link) link.parentElement.hidden = true;
      } else {
        left += 1;
      }
    });
    if (!left) upcoming.hidden = true;
  }
})();
