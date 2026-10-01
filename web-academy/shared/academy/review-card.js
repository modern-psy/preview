(() => {
  if (customElements.get('academy-review')) return;
  customElements.define('academy-review', class extends HTMLElement {
    static observedAttributes = ['open'];
    connectedCallback() {
      this.observer?.disconnect();
      const initialize = () => {
        if (this.hasAttribute('data-review-video-card')) {
          if (!this.controller && this.querySelector('[data-review-video-toggle]')) this.initializeVideo();
          return;
        }
        if (this.controller || !this.querySelector('[data-review-full]')) return;
        this.observer?.disconnect();
        this.button = this.querySelector('[data-review-toggle]');
        this.panel = this.querySelector('academy-review-panel');
        this.quote = this.querySelector('[data-review-quote]');
        this.full = this.querySelector('[data-review-full]');
        this.controller = new AbortController();
        const signal = this.controller.signal;
        this.motion = matchMedia('(prefers-reduced-motion: reduce)');
        this.motion.addEventListener('change', () => this.cancelMotion(), {signal});
        this.button.addEventListener('click', () => this.toggleAttribute('open'), {signal});
        this.addEventListener('keydown', event => {
          if (event.key === 'Escape' && this.hasAttribute('open')) {
            event.preventDefault(); this.removeAttribute('open'); this.button.focus({preventScroll: true});
          }
        }, {signal});
        this.button.hidden = false;
        this.dataset.ready = '';
        this.sync(false);
      };
      initialize();
      if (!this.controller) {
        this.observer = new MutationObserver(initialize);
        this.observer.observe(this, {childList: true, subtree: true});
      }
    }
    attributeChangedCallback() { if (this.controller && this.full) this.sync(true); }
    initializeVideo() {
      this.observer?.disconnect();
      this.controller = new AbortController();
      const signal = this.controller.signal;
      this.video = this.querySelector('[data-review-video]');
      this.videoButton = this.querySelector('[data-review-video-toggle]');
      this.videoStatus = this.querySelector('[data-review-video-status]');
      this.videoPoster = this.querySelector('[data-review-video-poster]');
      this.previewPlaying = false;
      this.videoButton.hidden = false;
      this.videoButton.addEventListener('click', () => this.toggleVideo(), {signal});
      if (this.video) {
        this.video.controls = false;
        this.video.addEventListener('play', () => {
          this.clearPosterTimer();
          if (this.videoPoster) this.videoPoster.hidden = true;
          this.closest('[data-slider-component]')?.querySelectorAll('[data-review-video]').forEach(video => {
            if (video !== this.video) video.pause();
          });
        }, {signal});
        this.video.addEventListener('pause', () => {
          this.clearPosterTimer();
          this.posterTimer = setTimeout(() => {
            this.posterTimer = null;
            if (this.isConnected && this.video.paused && this.videoPoster) this.videoPoster.hidden = false;
          }, 2500);
        }, {signal});
        for (const name of ['play', 'playing', 'pause', 'ended', 'emptied']) {
          this.video.addEventListener(name, () => this.syncVideo(), {signal});
        }
        this.video.addEventListener('error', () => this.showVideoError(), {signal});
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) this.pauseVideo();
        }, {signal});
        // Stop sound when the card leaves either the viewport or the carousel.
        this.videoObserver = new IntersectionObserver(entries => {
          if (!entries[0].isIntersecting) this.pauseVideo();
        });
        this.videoObserver.observe(this);
      }
      this.syncVideo();
    }
    syncVideo() {
      const playing = this.video ? !this.video.paused && !this.video.ended : this.previewPlaying;
      this.videoButton.toggleAttribute('data-playing', playing);
      this.videoButton.setAttribute('aria-label', `${playing ? 'Пауза' : 'Воспроизвести видеоотзыв'}${this.video ? '' : ' — предпросмотр'}`);
    }
    clearPosterTimer() {
      clearTimeout(this.posterTimer);
      this.posterTimer = null;
    }
    pauseVideo() {
      this.playRequest = null;
      this.video?.pause();
      this.previewPlaying = false;
      this.syncVideo();
    }
    showVideoError() {
      this.pauseVideo();
      this.videoStatus.textContent = 'Не удалось воспроизвести видео. Попробуйте ещё раз.';
      this.videoStatus.hidden = false;
    }
    async toggleVideo() {
      if (!this.video) {
        this.previewPlaying = !this.previewPlaying;
        this.syncVideo();
        return;
      }
      if (!this.video.paused || this.playRequest) {
        this.pauseVideo();
        return;
      }
      this.videoStatus.hidden = true;
      if (this.video.error) this.video.load();
      if (this.video.ended) this.video.currentTime = 0;
      const request = {};
      this.playRequest = request;
      try {
        await this.video.play();
      } catch (error) {
        if (this.playRequest === request && !this.controller?.signal.aborted && this.isConnected && error.name !== 'AbortError') this.showVideoError();
      } finally {
        if (this.playRequest === request) {
          this.playRequest = null;
          this.syncVideo();
        }
      }
    }
    cancelMotion() { this.animations?.forEach(animation => animation.cancel()); this.animations = []; }
    sync(animate) {
      const height = this.panel.getBoundingClientRect().height;
      const width = this.button.getBoundingClientRect().width;
      this.cancelMotion();
      const open = this.hasAttribute('open');
      this.toggleAttribute('data-open', open);
      if (!open && this.full.contains(document.activeElement)) this.button.focus({preventScroll: true});
      this.full.hidden = !open;
      this.full.tabIndex = open && !this.closest('[aria-hidden="true"]') ? 0 : -1;
      this.quote.hidden = open;
      this.button.setAttribute('aria-expanded', String(open));
      this.button.setAttribute('aria-label', `${open ? 'Свернуть' : 'Подробнее'}: ${this.dataset.author}`);
      this.panel.update?.();
      if (!animate || this.motion.matches) return;
      const styles = getComputedStyle(this);
      const token = styles.getPropertyValue('--motion-duration').trim() || '250ms';
      const duration = parseFloat(token) * (token.endsWith('ms') ? 1 : 1000);
      const options = {duration, easing: styles.getPropertyValue('--motion-easing').trim() || 'linear'};
      const buttonContent = this.button.querySelector(open ? '.review-toggle_icon' : '.review-toggle_label');
      this.animations = [
        this.panel.animate([{height: `${height}px`}, {height: `${this.panel.getBoundingClientRect().height}px`}], options),
        this.button.animate([{width: `${width}px`, offset: 0}, {width: `${this.button.getBoundingClientRect().width}px`, offset: 0.7}, {width: `${this.button.getBoundingClientRect().width}px`, offset: 1}], options),
        buttonContent.animate([{opacity: 0, offset: 0}, {opacity: 0, offset: 0.7}, {opacity: 1, offset: 1}], options),
        (open ? this.full : this.quote).animate([{opacity: 0}, {opacity: 1}], options),
      ];
    }
    disconnectedCallback() {
      this.observer?.disconnect(); this.controller?.abort(); this.controller = null; this.cancelMotion();
      if (this.videoButton) {
        this.clearPosterTimer();
        if (this.videoPoster) this.videoPoster.hidden = true;
        this.videoObserver?.disconnect();
        this.pauseVideo();
        this.videoButton.hidden = true;
        if (this.video) this.video.controls = true;
        this.videoStatus.hidden = true;
        return;
      }
      if (!this.button) return;
      delete this.dataset.ready; this.button.hidden = true; this.full.hidden = false; this.quote.hidden = true;
    }
  });
})();
