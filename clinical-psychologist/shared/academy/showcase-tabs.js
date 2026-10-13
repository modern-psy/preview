(() => {
  'use strict';
  if (!window.customElements || customElements.get('academy-showcase-tabs')) return;
  class AcademyShowcaseTabs extends HTMLElement {
    connectedCallback() {
      if (this.cleanup) return;
      const owned = selector => [...this.querySelectorAll(selector)].filter(el => el.closest('academy-showcase-tabs') === this);
      const list = owned('[data-tabs-list]')[0], tabs = owned('[data-tabs-trigger]'), panels = owned('[data-tabs-panel]');
      if (!list || !tabs.length || tabs.length !== panels.length || tabs.some((tab, i) => tab.dataset.tabsTrigger !== panels[i].dataset.tabsPanel)) return;
      let active = 0, disposed = false;
      const measure = () => { if (!disposed) this.style.setProperty('--tabs-navigation-height', `${list.getBoundingClientRect().height}px`); };
      const select = (index, focus = false, notify = true) => {
        active = index;
        tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === active)); tab.tabIndex = i === active ? 0 : -1; panels[i].hidden = i !== active; });
        if (focus) tabs[active].focus({preventScroll: true});
        if (notify) this.dispatchEvent(new CustomEvent('academy-tabs:change', {bubbles: true, detail: {id: tabs[active].dataset.tabsTrigger, index: active}}));
      };
      const click = event => { const i = tabs.indexOf(event.target.closest('[data-tabs-trigger]')); if (i >= 0) select(i); };
      const keydown = event => {
        const i = tabs.indexOf(event.target);
        if (i < 0 || event.altKey || event.ctrlKey || event.metaKey) return;
        const targets = {ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1};
        if (!(event.key in targets)) return;
        event.preventDefault(); select(targets[event.key], true);
      };
      list.hidden = false; list.setAttribute('role', 'tablist');
      tabs.forEach((tab, i) => { tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', panels[i].id); panels[i].setAttribute('role', 'tabpanel'); panels[i].setAttribute('aria-labelledby', tab.id); panels[i].tabIndex = 0; });
      select(0, false, false);
      this.classList.add('is-enhanced'); measure();
      const observer = window.ResizeObserver ? new ResizeObserver(measure) : null;
      observer?.observe(list); window.addEventListener('resize', measure); document.fonts?.ready.then(measure);
      list.addEventListener('click', click); list.addEventListener('keydown', keydown);
      this.cleanup = () => {
        disposed = true; observer?.disconnect(); window.removeEventListener('resize', measure);
        list.removeEventListener('click', click); list.removeEventListener('keydown', keydown);
        list.hidden = true; list.removeAttribute('role'); this.classList.remove('is-enhanced'); this.style.removeProperty('--tabs-navigation-height');
        tabs.forEach((tab, i) => { ['role', 'aria-controls', 'aria-selected', 'tabindex'].forEach(a => tab.removeAttribute(a)); panels[i].hidden = false; panels[i].removeAttribute('role'); panels[i].removeAttribute('tabindex'); panels[i].setAttribute('aria-labelledby', panels[i].querySelector('h3').id); });
      };
    }
    disconnectedCallback() { this.cleanup?.(); this.cleanup = null; }
  }
  customElements.define('academy-showcase-tabs', AcademyShowcaseTabs);
})();
