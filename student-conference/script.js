/* Поведение макета. Можно менять подписи и данные; отправку подключать только
   через отдельный контракт новой конференции, не через форму старого события. */
(() => {
  window.__studentConferenceCleanup?.();
  const page = document.querySelector('.student-conference-page');
  if (!page) return;
  const controller = new AbortController();
  const {signal} = controller;
  const animations = new Set();
  const observers = [];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 64.0625rem) and (hover: hover) and (pointer: fine)');
  const query = (hook) => page.querySelector(`[data-js="${hook}"]`);
  const all = (hook) => [...page.querySelectorAll(`[data-js="${hook}"]`)];
  const on = (element, event, handler, options = {}) => element?.addEventListener(event, handler, {...options, signal});
  page.classList.add('is-enhanced');

  // Табы: все темы остаются в HTML. Без скрипта видны все три трека.
  const choices = query('track-choices');
  const tabs = all('track');
  const panels = all('track-panel');
  choices.setAttribute('role', 'tablist');
  function selectTrack(id, focus = false) {
    tabs.forEach((tab) => {
      const selected = tab.dataset.track === id;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.track !== id;
      panel.setAttribute('role', 'tabpanel');
      if (!panel.hidden && !reduced.matches) {
        const animation = panel.animate([{opacity:.65,transform:'translateY(.5rem)'},{opacity:1,transform:'translateY(0)'}], {duration:300,easing:'ease-out'});
        animations.add(animation);
        animation.finished.then(() => animations.delete(animation)).catch(() => {});
      }
    });
  }
  tabs.forEach((tab, index) => {
    on(tab, 'click', () => selectTrack(tab.dataset.track));
    on(tab, 'keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectTrack(tabs[next].dataset.track, true);
    });
  });
  selectTrack('a');

  // Вопросы помогают выбрать трек, но не ограничивают доступ к программе.
  let suggestedTrack = 'a';
  all('audience-question').forEach((button) => on(button, 'click', () => {
    button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
    const selected = all('audience-question').filter(item => item.getAttribute('aria-pressed') === 'true');
    const scores = {a:0,b:0,c:0};
    selected.forEach(item => scores[item.dataset.track]++);
    suggestedTrack = Object.entries(scores).sort((a,b) => b[1]-a[1])[0][0];
    const names = {a:'С чего начать',b:'Выбор метода',c:'Путь с нуля'};
    query('audience-result').textContent = selected.length ? `Вам может подойти трек «${names[suggestedTrack]}».` : 'Начать можно с любого вопроса.';
  }));
  on(query('audience-go'), 'click', () => selectTrack(suggestedTrack));

  // Демо-форма не отправляет и не сохраняет персональные данные.
  const form = query('registration');
  const submit = query('form-submit');
  const phone = form.elements.phone;
  submit.disabled = false;
  on(phone, 'input', () => phone.setCustomValidity(''));
  on(form, 'submit', (event) => {
    event.preventDefault();
    const digits = phone.value.replace(/\D/g, '');
    phone.setCustomValidity(digits.length >= 10 && digits.length <= 15 ? '' : 'Укажите от 10 до 15 цифр, включая код страны.');
    if (!form.reportValidity()) return;
    const paid = form.elements.format.value === 'recordings';
    query('selected-plan').textContent = paid ? 'Вы выбрали: эфир + записи и сертификат · 1 999 ₽. В демо оплата не проводится.' : 'Вы выбрали бесплатное участие в прямом эфире.';
    form.hidden = true;
    query('messenger-step').hidden = false;
    query('messenger-step').focus();
  });
  on(query('form-back'), 'click', () => {
    query('messenger-step').hidden = true;
    form.hidden = false;
    query('messenger-status').textContent = 'Это просмотр сценария. Боты будут подключены перед запуском регистрации.';
    form.elements.name.focus();
  });
  all('messenger').forEach(button => on(button, 'click', () => {
    query('messenger-status').textContent = `${button.dataset.messenger} выбран. В рабочей версии здесь откроется бот конференции. Сейчас регистрация не создана, данные никуда не отправлены.`;
  }));

  // Один скролл-момент: фотография мягко выравнивается внутри первого экрана.
  // Текст всегда видим. На телефоне и при reduced-motion картинка статична.
  let frame = 0;
  const hero = query('hero-visual');
  function paintScroll() {
    frame = 0;
    if (reduced.matches || !desktop.matches) {
      hero.style.removeProperty('transform');
      return;
    }
    const progress = Math.max(0, Math.min(1, window.scrollY / 600));
    hero.style.transform = `rotate(${-3 + progress*3}deg)`;
  }
  const schedule = () => {if (!frame) frame = requestAnimationFrame(paintScroll);};
  on(window,'scroll',schedule,{passive:true});
  on(window,'resize',schedule,{passive:true});
  on(reduced,'change',() => {animations.forEach(animation => animation.cancel());animations.clear();schedule();});
  on(desktop,'change',schedule);
  schedule();
  window.__studentConferenceCleanup = () => {
    controller.abort();
    observers.forEach(observer => observer.disconnect());
    animations.forEach(animation => animation.cancel());
    cancelAnimationFrame(frame);
    panels.forEach(panel => {panel.hidden=false;panel.removeAttribute('role');});
    tabs.forEach(tab => {tab.removeAttribute('role');tab.removeAttribute('aria-selected');tab.tabIndex=0;});
    choices.removeAttribute('role');
    hero.style.removeProperty('transform');
    page.classList.remove('is-enhanced');
  };
})();
