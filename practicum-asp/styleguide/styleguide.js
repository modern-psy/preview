/* ==========================================================================
   Стайлгайд АСП Практикума · поведение страницы-справочника
   Шкалы цвета с копированием кода, индикатор полосы ширины,
   подсветка раздела в оглавлении, фильтр-теги, повтор появления.
   В лендинг не переносится.
   ========================================================================== */

(function () {
  'use strict';

  var page = document.querySelector('.styleguide_page');
  if (!page) return;

  /* --- Шкалы цвета из data-colors: «шаг:hex шаг:hex» --- */
  page.querySelectorAll('.ramp_component').forEach(function (ramp) {
    var label = document.createElement('p');
    label.className = 'ramp_label';
    label.textContent = ramp.dataset.label;

    var chips = document.createElement('div');
    chips.className = 'ramp_chips';

    ramp.dataset.colors.split(' ').forEach(function (pair) {
      var parts = pair.split(':');
      var step = parts[0];
      var hex = parts[1];
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'ramp_chip' + (step === ramp.dataset.key ? ' is-key' : '');
      chip.dataset.hex = hex;
      chip.setAttribute('aria-label', ramp.dataset.ramp + '-' + step + ', ' + hex + ', скопировать');
      chip.innerHTML =
        '<span class="ramp_swatch" style="background:' + hex + ';color:' + (parseInt(step, 10) >= 500 ? '#fff' : '#0A1A0E') + '"></span>' +
        '<span class="ramp_step">' + step + '</span>' +
        '<span class="ramp_hex">' + hex + '</span>';
      chips.appendChild(chip);
    });

    ramp.appendChild(label);
    ramp.appendChild(chips);
  });

  /* --- Копирование кода цвета --- */
  var status = page.querySelector('[data-js="copy-status"]');

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'absolute';
      area.style.left = '-9999px';
      document.body.appendChild(area);
      area.select();
      try { document.execCommand('copy') ? resolve() : reject(); } catch (e) { reject(e); }
      document.body.removeChild(area);
    });
  }

  page.addEventListener('click', function (event) {
    var chip = event.target.closest('.ramp_chip');
    if (!chip) return;
    var hexNode = chip.querySelector('.ramp_hex');
    copy(chip.dataset.hex).then(function () {
      hexNode.textContent = 'Скопировано';
      chip.classList.add('is-copied');
      if (status) status.textContent = 'Скопировано ' + chip.dataset.hex;
      window.setTimeout(function () {
        hexNode.textContent = chip.dataset.hex;
        chip.classList.remove('is-copied');
      }, 1400);
    }).catch(function () {
      if (status) status.textContent = 'Не удалось скопировать, код цвета ' + chip.dataset.hex;
    });
  });

  /* --- Текущая полоса ширины: те же границы, что в CSS --- */
  var bands = [
    { query: '(min-width: 64.0625rem)', band: '4', device: 'десктоп, ', range: 'от 1025' },
    { query: '(min-width: 48rem)', band: '3', device: 'планшет, ', range: '768–1024' },
    { query: '(min-width: 32.5625rem)', band: '2', device: 'телефон боком, ', range: '521–767' }
  ];
  var bandLabel = page.querySelector('[data-js="band-label"]');

  function updateBand() {
    var current = { band: '1', device: 'телефон, ', range: 'до 520' };
    for (var i = 0; i < bands.length; i++) {
      if (window.matchMedia(bands[i].query).matches) { current = bands[i]; break; }
    }
    page.dataset.band = current.band;
    // На телефоне видно только диапазон, название устройства скрыто стилями
    if (bandLabel) {
      bandLabel.innerHTML = '<span class="styleguide_band-device">' + current.device + '</span>' + current.range;
    }
  }

  bands.forEach(function (item) {
    var mq = window.matchMedia(item.query);
    if (mq.addEventListener) mq.addEventListener('change', updateBand);
    else mq.addListener(updateBand);
  });
  updateBand();

  /* --- Подсветка раздела в оглавлении --- */
  var links = Array.prototype.slice.call(page.querySelectorAll('.styleguide_nav-link'));
  var linkById = {};
  links.forEach(function (link) { linkById[link.getAttribute('href').slice(1)] = link; });

  function setActive(id) {
    links.forEach(function (link) {
      var isActive = link === linkById[id];
      link.classList.toggle('is-active', isActive);
      if (isActive) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    var active = linkById[id];
    var list = active && active.closest('.styleguide_nav-list');
    // На телефоне держим активный пункт видимым в ленте
    if (list && list.scrollWidth > list.clientWidth) {
      var left = active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2;
      list.scrollTo({ left: left, behavior: 'smooth' });
    }
  }

  if ('IntersectionObserver' in window) {
    var visible = {};
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { visible[entry.target.id] = entry.isIntersecting; });
      // Вступление на экране: ничего не подсвечиваем, лента в начале
      if (visible.top) { setActive(null); var list = page.querySelector('.styleguide_nav-list'); if (list) list.scrollTo({ left: 0 }); return; }
      var firstVisible = Object.keys(linkById).filter(function (id) { return visible[id]; })[0];
      if (firstVisible) setActive(firstVisible);
    }, { rootMargin: '-20% 0px -65% 0px' });
    Object.keys(linkById).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    var intro = page.querySelector('.styleguide_intro');
    if (intro) { intro.id = intro.id || 'top'; observer.observe(intro); }
  }

  /* --- Теги-фильтры: один выбранный --- */
  page.querySelectorAll('[data-js="filter-tags"]').forEach(function (group) {
    group.addEventListener('click', function (event) {
      var tag = event.target.closest('.tag_component');
      if (!tag) return;
      group.querySelectorAll('.tag_component').forEach(function (item) {
        item.setAttribute('aria-pressed', String(item === tag));
      });
    });
  });

  /* --- Повтор появления блока --- */
  var replay = page.querySelector('[data-js="reveal-replay"]');
  var target = page.querySelector('[data-js="reveal-demo"]');
  if (replay && target) {
    replay.addEventListener('click', function () {
      target.classList.remove('is-playing');
      target.classList.add('is-hidden');
      // Принудительный перерасчёт, чтобы браузер увидел исходное состояние
      void target.offsetWidth;
      target.classList.add('is-playing');
      target.classList.remove('is-hidden');
    });
  }
})();
