(() => {
  'use strict';
  if (!window.customElements || customElements.get('academy-typewriter')) return;
  class AcademyTypewriter extends HTMLElement {
    connectedCallback() {
      if (this.cleanup) return;
      const sources = [...this.querySelectorAll('[data-typewriter-text]')], visuals = [...this.querySelectorAll('[data-typewriter-visual]')];
      if (!sources.length || sources.length !== visuals.length) return;
      const steps = sources.map((source, i) => ({text: Array.from(source.textContent), visual: visuals[i], row: source.closest('[data-typewriter-step]')}));
      const reduced = matchMedia('(prefers-reduced-motion: reduce)');
      const motion = window.AcademyDemoMotion;
      if (!motion) return;
      const owner = this.closest('academy-showcase-tabs'), panel = this.closest('[data-tabs-panel]');
      const speed = Math.max(20, Math.min(100, Number(this.dataset.typewriterSpeed) || motion.type));
      const loop = this.hasAttribute('data-typewriter-loop');
      const viewport = this.closest('[data-typewriter-viewport]') || this;
      viewport.style.setProperty('--demo-motion-duration', `${motion.enter}ms`);
      const reveal = viewport.querySelector('[data-typewriter-reveal]');
      const card = viewport.querySelector('[data-typewriter-card]');
      const choice = this.querySelector('[data-typewriter-choice]');
      const staged = this.hasAttribute('data-typewriter-staged');
      const enhanced = () => !reduced.matches && !!window.IntersectionObserver;
      const syncReveal = () => { reveal?.classList.toggle('is-typewriter-reveal', enhanced()); card?.classList.toggle('is-typewriter-card', enhanced()); this.classList.toggle('is-staged-idle', staged && enhanced()); choice?.classList.toggle('is-selected', !enhanced()); };
      const threshold = viewport === this ? 0.3 : 0.5;
      let timer = 0, visibilityFrame = 0, index = 0, stepIndex = 0, inView = false, state = 'idle', disposed = false;
      const refreshInView = () => {
        const rect = viewport.getBoundingClientRect();
        const visibleWidth = Math.max(0, Math.min(rect.right, document.documentElement.clientWidth) - Math.max(rect.left, 0));
        const visibleHeight = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
        inView = rect.width > 0 && rect.height > 0 && visibleWidth * visibleHeight / (rect.width * rect.height) >= threshold;
      };
      const showFullText = () => { this.classList.remove('is-playing'); steps.forEach(step => { step.visual.textContent = ''; step.row?.classList.remove('is-typing', 'is-complete'); }); };
      const stop = () => { clearTimeout(timer); timer = 0; state = 'idle'; showFullText(); card?.classList.remove('is-card-visible'); reveal?.classList.remove('is-revealed'); syncReveal(); };
      syncReveal();
      const eligible = () => !disposed && inView && !reduced.matches && !document.hidden && !panel?.hidden;
      const finish = () => {
        showFullText(); state = 'done'; timer = 0;
        reveal?.classList.add('is-revealed');
        if (loop && eligible()) {
          state = 'waiting';
          timer = setTimeout(() => {
            card?.classList.remove('is-card-visible');
            timer = setTimeout(() => { timer = 0; state = 'idle'; start(); }, card ? motion.enter : 0);
          }, motion.hold + motion.enter);
        }
      };
      const type = () => {
        if (!eligible()) { stop(); return; }
        const {text, visual, row} = steps[stepIndex];
        row?.classList.add('is-typing');
        index = Math.min(text.length, index + 1); visual.textContent = text.slice(0, index).join('');
        if (index < text.length) timer = setTimeout(type, speed);
        else {
          row?.classList.remove('is-typing'); row?.classList.add('is-complete');
          if (++stepIndex < steps.length) { index = 0; timer = setTimeout(type, motion.pause); }
          else if (choice) {
            timer = setTimeout(() => {
              if (!eligible()) { stop(); return; }
              choice.classList.add('is-selected');
              timer = setTimeout(() => { if (eligible()) finish(); else stop(); }, motion.enter + motion.pause);
            }, motion.pause);
          } else timer = setTimeout(() => { if (eligible()) finish(); else stop(); }, motion.pause);
        }
      };
      const start = () => {
        if (!eligible() || state !== 'idle') return;
        state = 'typing'; index = 0; stepIndex = 0; showFullText();
        choice?.classList.remove('is-selected'); reveal?.classList.remove('is-revealed');
        this.classList.remove('is-staged-idle'); this.classList.add('is-playing');
        timer = setTimeout(() => {
          if (!eligible()) { stop(); return; }
          card?.classList.add('is-card-visible');
          timer = setTimeout(type, card ? motion.enter + motion.pause : 0);
        }, motion.empty);
      };
      const change = () => {
        stop();
        observer?.unobserve(viewport);
        observer?.observe(viewport);
        refreshInView();
        start();
      };
      const visibility = () => { if (document.hidden) stop(); else start(); };
      const preference = () => { stop(); start(); };
      const observer = window.IntersectionObserver ? new IntersectionObserver(entries => { inView = entries.some(e => e.isIntersecting && e.intersectionRatio >= threshold); if (inView) start(); else stop(); }, {threshold}) : null;
      const requestVisibility = () => {
        if (visibilityFrame) return;
        visibilityFrame = requestAnimationFrame(() => { visibilityFrame = 0; refreshInView(); if (inView) start(); else stop(); });
      };
      observer?.observe(viewport); owner?.addEventListener('academy-tabs:change', change);
      window.addEventListener('scroll', requestVisibility, {passive: true});
      reduced.addEventListener('change', preference); document.addEventListener('visibilitychange', visibility);
      this.cleanup = () => { disposed = true; stop(); cancelAnimationFrame(visibilityFrame); this.classList.remove('is-staged-idle'); choice?.classList.add('is-selected'); card?.classList.remove('is-typewriter-card', 'is-card-visible'); reveal?.classList.remove('is-typewriter-reveal'); observer?.disconnect(); owner?.removeEventListener('academy-tabs:change', change); window.removeEventListener('scroll', requestVisibility); reduced.removeEventListener('change', preference); document.removeEventListener('visibilitychange', visibility); };
    }
    disconnectedCallback() { this.cleanup?.(); this.cleanup = null; }
  }
  customElements.define('academy-typewriter', AcademyTypewriter);
})();
