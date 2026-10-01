(() => {
  'use strict';
  if (!window.customElements || customElements.get('academy-practice-stories')) return;
  const clamp = (value, max) => Math.min(Math.max(value, 0), max);

  class AcademyPracticeStories extends HTMLElement {
    connectedCallback() {
      if (this.cleanup) return;
      const sticky = this.querySelector('[data-stories-sticky]');
      const viewport = this.querySelector('[data-stories-viewport]');
      const track = this.querySelector('[data-stories-track]');
      if (!sticky || !viewport || !track) return;
      const desktop = matchMedia('(min-width: 48rem) and (hover: hover) and (pointer: fine)');
      const mobile = matchMedia('(max-width: 47.999rem)');
      const reduced = matchMedia('(prefers-reduced-motion: reduce)');
      let frame = 0, measurement = 0, distance = 0, active = false;
      let offset = 0, disposed = false;
      const start = () => this.getBoundingClientRect().top + window.scrollY;
      const render = () => {
        frame = 0;
        if (!active) return;
        offset = clamp(window.scrollY - start(), distance);
        this.style.setProperty('--stories-offset', `${offset}px`);
      };
      const requestRender = () => { if (!frame) frame = requestAnimationFrame(render); };
      const measure = () => {
        measurement = 0;
        const last = track.lastElementChild?.firstElementChild;
        distance = last ? Math.max(0, last.getBoundingClientRect().right - track.getBoundingClientRect().left - track.clientWidth) : 0;
        const enabled = desktop.matches && !reduced.matches && distance > 1;
        viewport.tabIndex = mobile.matches ? -1 : 0;
        if (enabled !== active) {
          active = enabled;
          this.classList.toggle('is-scroll-driven', active);
          viewport.scrollLeft = 0;
        }
        if (active) {
          const cards = [...track.children].map(item => item.firstElementChild).filter(Boolean);
          const copyHeights = cards.map(card => card.querySelector('.review-card_copy')?.getBoundingClientRect().height || 0);
          const maxCopyHeight = Math.max(0, ...copyHeights);
          const cardStyle = cards[0] ? getComputedStyle(cards[0]) : null;
          const cardGap = cardStyle ? parseFloat(cardStyle.rowGap || cardStyle.gap) || 0 : 0;
          const mediaHeight = Math.max(0, track.getBoundingClientRect().height - maxCopyHeight - cardGap);
          // Every photo uses the same remaining height. Copy keeps its natural
          // height, so shorter stories may simply leave more room below it.
          this.style.setProperty('--stories-media-height', `${mediaHeight}px`);
          // Pin from the dark section boundary so the fixed header never becomes
          // the visual anchor for the horizontal story sequence.
          const height = sticky.offsetHeight;
          const overflow = Math.max(0, sticky.scrollHeight - height);
          this.style.setProperty('--stories-sticky-top', '0px');
          this.style.setProperty('--stories-shell-height', `${height + distance + overflow}px`);
          render();
        } else {
          this.style.removeProperty('--stories-shell-height');
          this.style.removeProperty('--stories-sticky-top');
          this.style.removeProperty('--stories-offset');
          this.style.removeProperty('--stories-media-height');
        }
      };
      const requestMeasure = () => { if (!disposed && !measurement) measurement = requestAnimationFrame(measure); };
      const keydown = event => {
        if (mobile.matches || event.target !== viewport || event.altKey || event.ctrlKey || event.metaKey) return;
        const step = track.firstElementChild?.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap) || viewport.clientWidth;
        const current = active ? offset : viewport.scrollLeft;
        const targets = {ArrowRight: current + step, ArrowLeft: current - step, Home: 0, End: distance};
        if (!(event.key in targets)) return;
        event.preventDefault();
        const target = clamp(targets[event.key], distance);
        if (active) window.scrollTo({top: start() + target, behavior: 'instant'});
        else viewport.scrollTo({left: target, behavior: 'instant'});
      };
      const observer = 'ResizeObserver' in window ? new ResizeObserver(requestMeasure) : null;
      observer?.observe(sticky);
      observer?.observe(track);
      window.addEventListener('scroll', requestRender, {passive: true});
      window.addEventListener('resize', requestMeasure, {passive: true});
      window.addEventListener('pageshow', requestMeasure);
      desktop.addEventListener('change', requestMeasure);
      reduced.addEventListener('change', requestMeasure);
      viewport.addEventListener('keydown', keydown);
      document.fonts?.ready.then(requestMeasure);
      requestMeasure();
      this.cleanup = () => {
        disposed = true;
        cancelAnimationFrame(frame);
        cancelAnimationFrame(measurement);
        observer?.disconnect();
        window.removeEventListener('scroll', requestRender);
        window.removeEventListener('resize', requestMeasure);
        window.removeEventListener('pageshow', requestMeasure);
        desktop.removeEventListener('change', requestMeasure);
        reduced.removeEventListener('change', requestMeasure);
        viewport.removeEventListener('keydown', keydown);
        this.classList.remove('is-scroll-driven');
        viewport.tabIndex = 0;
        ['--stories-shell-height', '--stories-sticky-top', '--stories-offset', '--stories-media-height'].forEach(key => this.style.removeProperty(key));
      };
    }
    disconnectedCallback() { this.cleanup?.(); this.cleanup = null; }
  }
  customElements.define('academy-practice-stories', AcademyPracticeStories);
})();
