(() => {
  if (customElements.get('academy-review-panel')) return;
  customElements.define('academy-review-panel', class extends HTMLElement {
    connectedCallback() {
      this.disconnect();
      this.controller = new AbortController();
      this.update = () => {
        const scroll = this.querySelector('[data-review-full]');
        if (!scroll) return;
        this.dataset.scrollable = String(!scroll.hidden && scroll.scrollHeight > scroll.clientHeight + 1);
        this.dataset.scrollEnd = String(scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 2);
      };
      this.addEventListener('scroll', this.update, {capture: true, signal: this.controller.signal});
      this.resize = new ResizeObserver(this.update);
      this.resize.observe(this);
      this.update();
    }
    disconnect() { this.controller?.abort(); this.resize?.disconnect(); }
    disconnectedCallback() { this.disconnect(); }
  });
})();
