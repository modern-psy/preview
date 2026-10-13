(() => {
  if (customElements.get('academy-pricing')) return;

  class AcademyPricing extends HTMLElement {
    static observedAttributes = ['selected-stream'];

    connectedCallback() {
      this.initialize();
      if (!this.controls) {
        this.observer = new MutationObserver(() => this.initialize());
        this.observer.observe(this, { childList: true, subtree: true });
      }
    }

    initialize() {
      if (this.controls) return;
      const tablist = this.querySelector('[data-pricing-tabs]');
      const panel = this.querySelector('[data-pricing-panel]');
      const tabs = [...this.querySelectorAll('[data-pricing-tab]')];
      if (!tablist || !panel || !tabs.length) return;
      this.observer?.disconnect();
      this.controls = { tablist, panel, tabs };
      this.abort = new AbortController();
      this.animations = [];
      this.motion = matchMedia('(prefers-reduced-motion: reduce)');
      this.columns = matchMedia('(min-width: 768px)');
      this.columns.addEventListener('change', () => this.orderPlans(), { signal: this.abort.signal });
      this.orderPlans();
      this.motion.addEventListener('change', () => this.cancelAnimations(), { signal: this.abort.signal });
      tablist.hidden = tabs.length < 2;
      tablist.addEventListener('click', (event) => {
        const tab = event.target.closest('[data-pricing-tab]');
        if (tabs.includes(tab)) this.select(tab.dataset.pricingTab);
      }, { signal: this.abort.signal });
      tablist.addEventListener('keydown', (event) => {
        const current = tabs.indexOf(event.target);
        if (current < 0) return;
        const offsets = { ArrowLeft: -1, ArrowRight: 1, Home: -current, End: tabs.length - 1 - current };
        if (!(event.key in offsets)) return;
        event.preventDefault();
        const next = tabs[(current + offsets[event.key] + tabs.length) % tabs.length];
        this.select(next.dataset.pricingTab);
        next.focus();
      }, { signal: this.abort.signal });
      this.select(this.getAttribute('selected-stream') || tabs[0].dataset.pricingTab, false);
      this.setAttribute('data-ready', '');
    }

    attributeChangedCallback() {
      if (this.controls) this.select(this.getAttribute('selected-stream'));
    }

    select(stream, animate = true) {
      const { tabs, panel } = this.controls;
      const index = Math.max(0, tabs.findIndex(tab => tab.dataset.pricingTab === stream));
      const selected = tabs[index].dataset.pricingTab;
      if (this.getAttribute('selected-stream') !== selected) {
        // The attribute is the public source of truth; the nested callback renders it once.
        this.setAttribute('selected-stream', selected);
        return;
      }
      const changed = this.currentStream !== selected;
      this.currentStream = selected;
      this.cancelAnimations();
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
      });
      panel.setAttribute('aria-labelledby', tabs[index].id);
      const visible = [];
      this.querySelectorAll('[data-pricing-stream]').forEach(value => {
        value.hidden = value.dataset.pricingStream !== selected;
        if (!value.hidden) visible.push(value);
      });
      if (changed && animate && this.hasAttribute('data-ready') && !this.motion.matches) {
        const style = getComputedStyle(this);
        const duration = parseFloat(style.getPropertyValue('--motion-duration')) || 250;
        const easing = style.getPropertyValue('--motion-easing').trim() || 'linear';
        visible.forEach(value => {
          if (typeof value.animate === 'function') this.animations.push(value.animate([{ opacity: 0.5 }, { opacity: 1 }], { duration, easing }));
        });
      }
      if (changed && this.hasAttribute('data-ready')) {
        this.dispatchEvent(new CustomEvent('academy-pricing:change', { bubbles: true, detail: { stream: selected } }));
      }
    }

    cancelAnimations() {
      this.animations?.forEach(animation => animation.cancel());
      this.animations = [];
    }

    orderPlans() {
      const grid = this.querySelector('.pricing_grid');
      if (!grid) return;
      const current = [...grid.children];
      const ordered = [...current].sort((a, b) => {
        const featured = this.columns.matches ? 0 : Number(b.hasAttribute('data-pricing-featured')) - Number(a.hasAttribute('data-pricing-featured'));
        return featured || Number(a.dataset.pricingOrder) - Number(b.dataset.pricingOrder);
      });
      if (ordered.every((plan, index) => plan === current[index])) return;
      const active = document.activeElement;
      ordered.forEach(plan => grid.append(plan));
      if (this.contains(active)) active.focus({ preventScroll: true });
    }

    disconnectedCallback() {
      this.abort?.abort();
      this.observer?.disconnect();
      this.cancelAnimations();
      this.controls = null;
      this.removeAttribute('data-ready');
      this.querySelectorAll('[data-pricing-stream]').forEach(value => { value.hidden = false; });
      const tabs = this.querySelector('[data-pricing-tabs]');
      if (tabs) tabs.hidden = true;
    }
  }

  customElements.define('academy-pricing', AcademyPricing);
})();
