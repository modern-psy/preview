/* Hero, блок цены и дата CTA из Public API. Запасные тексты и числа живут в data/.
   Часы берём из каталога: отдельный ответ курса пока не содержит hours.
   При ошибке API сохраняем запаску. Остальные блоки здесь не меняем. */
(function () {
  'use strict';
  const roots = [...document.querySelectorAll('[data-cms-pricing], [data-cms-hero], [data-cms-cta]')].filter(root => !root.__clinicalCmsStarted);
  if (!roots.length) return;
  roots.forEach(root => { root.__clinicalCmsStarted = true; root.dataset.cmsState = 'loading'; });
  const api = roots[0].dataset.api.replace(/\/+$/, '');
  const slug = roots[0].dataset.course;
  const cache = (window.__aspCourseCache = window.__aspCourseCache || {});
  const digits = value => new Intl.NumberFormat('ru-RU', {maximumFractionDigits: 0}).format(value);
  const rub = value => `${digits(value)}\u00a0₽`;
  const copy = value => String(value).replace(/(?<![\p{L}\p{N}])(в|и|к|о|с|у|во|до|за|из|на|не|но|об|от|по|со|без|для|под|при|про) /giu, '$1\u00a0');
  function load(path, key) {
    if (cache[key]) return cache[key];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    cache[key] = fetch(api + path, {headers: {Accept: 'application/json'}, signal: controller.signal})
      .then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
      .finally(() => clearTimeout(timeout));
    return cache[key];
  }
  function fill(root, values) {
    root.querySelectorAll('[data-cms]').forEach(node => {
      if (Object.hasOwn(values, node.dataset.cms)) {
        node.textContent = values[node.dataset.cms];
        node.dataset.cmsState = 'ready';
      }
    });
    root.dataset.cmsState = 'ready';
  }
  const heroes = roots.filter(root => root.hasAttribute('data-cms-hero'));
  const ctas = roots.filter(root => root.hasAttribute('data-cms-cta'));
  const prices = roots.filter(root => root.hasAttribute('data-cms-pricing'));
  load(`/api/public/course/${encodeURIComponent(slug)}`, `${api}|${slug}`)
    .then(course => {
      if (course.slug !== slug) throw new Error('Ответ API другого курса.');
      const stream = course.nearestStream || course.streams?.find(item => /^Ид[её]т набор$/i.test(item.status));
      const date = new Date(`${stream?.startDate}T00:00:00Z`);
      if (!Number.isFinite(date.getTime())) throw new Error('Нет даты старта CMS.');
      const start = new Intl.DateTimeFormat('ru-RU', {day: 'numeric', month: 'long', timeZone: 'UTC'}).format(date).replace(' ', '\u00a0');
      ctas.forEach(root => fill(root, {'enrollment-start': `Занятия начнутся ${start}`}));
      const heroValues = {'start': `Старт ${start}`, 'hero-start-note': `Ближайший старт потока: ${start}`};
      if (typeof course.title === 'string' && course.title.trim()) heroValues['course-title'] = copy(course.title);
      if (typeof course.description === 'string' && course.description.trim()) heroValues['course-description'] = copy(course.description);
      const diploma = course.documents?.find(text => typeof text === 'string' && /^Диплом\s+/i.test(text))?.match(/^(Диплом)\s+(.+)$/i);
      if (diploma) {
        heroValues['document-name'] = diploma[1];
        heroValues['document-description'] = copy(diploma[2]);
      }
      heroes.forEach(root => fill(root, heroValues));
      try {
        const pricing = stream?.pricing;
        if (!pricing || pricing.hasTariffs) throw new Error('Изменился формат цены курса.');
        const full = pricing.fullPaymentPrice ?? pricing.currentPrice;
        const months = pricing.installmentMonths || 24;
        const monthly = pricing.installmentPerMonth ?? pricing.currentPrice / months;
        if (![full, months, monthly, pricing.currentPrice].every(value => Number.isFinite(value) && value > 0)) throw new Error('Неполные цены CMS.');
        const gain = Math.max(0, pricing.currentPrice - full);
        const values = {
          'full-money': rub(full), 'monthly-money': rub(monthly), 'monthly-number': digits(monthly), 'full-number': digits(full),
          'installment-terms': `На\u00a0${months}\u00a0месяца или ${rub(full)} одним платежом`,
          'installment-schedule': `Официальная цена, ${months}\u00a0ежемесячных платежа`,
          'installment-caption': `или ${rub(monthly)}\u2060/\u2060мес в\u00a0рассрочку на\u00a0${months}\u00a0мес`,
          'benefit-inline': `Выгода ${rub(gain)}`, 'benefit-badge': `Выгода ${rub(gain)}`,
          'start': `Старт ${start}`, 'course-lead': `${copy(course.title)}, старт ${start}, ${copy(course.educationLevel?.toLowerCase() || 'профессиональная переподготовка')}`,
        };
        prices.forEach(root => fill(root, values));
      } catch (error) {
        prices.forEach(root => { root.dataset.cmsState = 'error'; });
        console.error('[clinical-cms] Сохранены запасные цены.', error);
      }
    })
    .catch(error => {
      roots.forEach(root => { root.dataset.cmsState = 'error'; });
      console.error('[clinical-cms] Курс не загружен, сохранена запаска.', error);
    });
  const hoursNodes = heroes.flatMap(root => [...root.querySelectorAll('[data-cms="course-hours"]')]);
  if (hoursNodes.length) {
    hoursNodes.forEach(node => { node.dataset.cmsState = 'loading'; });
    load('/api/public/catalog', `${api}|/api/public/catalog`)
      .then(catalog => {
        const course = catalog.cards?.find(item => item.slug === slug);
        if (!Number.isInteger(course?.hours) || course.hours <= 0) throw new Error('Нет часов обучения в каталоге.');
        hoursNodes.forEach(node => {
          node.textContent = String(course.hours);
          node.setAttribute('value', String(course.hours));
          node.dataset.cmsState = 'ready';
        });
      })
      .catch(error => {
        hoursNodes.forEach(node => { node.dataset.cmsState = 'error'; });
        console.error('[clinical-cms] Сохранены запасные часы обучения.', error);
      });
  }
})();
