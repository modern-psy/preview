(() => {
  'use strict';
  if (!window.customElements || customElements.get('academy-demo-sequence')) return;
  class AcademyDemoSequence extends HTMLElement {
    connectedCallback() {
      if (this.cleanup) return;
      const items = [...this.querySelectorAll('[data-sequence-item]')], motion = window.AcademyDemoMotion;
      if (!items.length || !motion) return;
      const requested = (this.dataset.sequenceOrder || '').split(',').map(Number);
      const order = requested.length === items.length && new Set(requested).size === items.length && requested.every(i => Number.isInteger(i) && i >= 0 && i < items.length) ? requested : items.map((_, i) => i);
      const panel = this.closest('[data-tabs-panel]'), owner = this.closest('academy-showcase-tabs');
      const card = this.querySelector('[data-sequence-card]'), action = this.querySelector('[data-sequence-reveal]');
      const reduced = matchMedia('(prefers-reduced-motion: reduce)');
      const threshold = 0.5;
      this.style.setProperty('--demo-motion-duration', `${motion.enter}ms`);
      let timer = 0, visibilityFrame = 0, inView = false, running = false, disposed = false, index = 0;
      const refreshInView = () => {
        const rect = this.getBoundingClientRect();
        const visibleWidth = Math.max(0, Math.min(rect.right, document.documentElement.clientWidth) - Math.max(rect.left, 0));
        const visibleHeight = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
        inView = rect.width > 0 && rect.height > 0 && visibleWidth * visibleHeight / (rect.width * rect.height) >= threshold;
      };
      const clear = () => items.forEach(item => item.classList.remove('is-emphasized'));
      const hide = () => items.forEach(item => item.classList.remove('is-visible'));
      const sync = () => {
        const enhanced = !reduced.matches && !!window.IntersectionObserver;
        this.classList.toggle('is-sequence-enhanced', enhanced);
        card?.classList.toggle('is-typewriter-card', enhanced);
        action?.classList.toggle('is-typewriter-reveal', enhanced);
      };
      sync();
      const eligible = () => !disposed && inView && !document.hidden && !panel?.hidden && !reduced.matches;
      const stop = () => { clearTimeout(timer); timer = 0; running = false; clear(); hide(); card?.classList.remove('is-card-visible'); action?.classList.remove('is-revealed'); };
      const later = (callback, delay) => { timer = setTimeout(() => { if (eligible()) callback(); else stop(); }, delay); };
      const hold = () => later(() => {
        card?.classList.remove('is-card-visible');
        if (!card) hide();
        later(() => { running = false; start(); }, motion.enter);
      }, motion.hold + (action ? motion.enter : 0));
      const step = () => {
        clear(); const item = items[order[index++]]; item.classList.add('is-visible');
        if (!card) item.classList.add('is-emphasized');
        if (index < items.length) later(step, motion.enter + motion.pause);
        else later(() => { clear(); action?.classList.add('is-revealed'); hold(); }, motion.enter + motion.pause);
      };
      const start = () => {
        if (!eligible() || running) return;
        running = true; index = 0; clear(); hide(); action?.classList.remove('is-revealed');
        later(() => {
          if (card) { card.classList.add('is-card-visible'); later(step, motion.enter + motion.pause); }
          else step();
        }, motion.empty);
      };
      const change = () => {
        stop();
        observer?.unobserve(this);
        observer?.observe(this);
        refreshInView();
        start();
      };
      const visibility = () => { if (document.hidden) stop(); else start(); };
      const preference = () => { stop(); sync(); start(); };
      const observer = window.IntersectionObserver ? new IntersectionObserver(entries => {
        inView = entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= threshold);
        if (inView) start(); else stop();
      }, {threshold}) : null;
      const requestVisibility = () => {
        if (visibilityFrame) return;
        visibilityFrame = requestAnimationFrame(() => { visibilityFrame = 0; refreshInView(); if (inView) start(); else stop(); });
      };
      observer?.observe(this); owner?.addEventListener('academy-tabs:change', change);
      window.addEventListener('scroll', requestVisibility, {passive: true});
      reduced.addEventListener('change', preference); document.addEventListener('visibilitychange', visibility);
      this.cleanup = () => { disposed = true; stop(); cancelAnimationFrame(visibilityFrame); this.classList.remove('is-sequence-enhanced'); card?.classList.remove('is-typewriter-card'); action?.classList.remove('is-typewriter-reveal'); observer?.disconnect(); owner?.removeEventListener('academy-tabs:change', change); window.removeEventListener('scroll', requestVisibility); reduced.removeEventListener('change', preference); document.removeEventListener('visibilitychange', visibility); };
    }
    disconnectedCallback() { this.cleanup?.(); this.cleanup = null; }
  }
  customElements.define('academy-demo-sequence', AcademyDemoSequence);
})();
