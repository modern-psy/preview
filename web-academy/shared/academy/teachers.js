(() => {
  if (customElements.get('academy-teachers')) return;
  class AcademyTeachers extends HTMLElement {
    connectedCallback() {
      if (this.slider) return;
      this.connect();
    }
    disconnectedCallback() { this.disconnect(); }
    connect() {
      const module = this.ownerDocument.getElementById(this.dataset.config);
      if (module && globalThis.AcademyTeacherTemplate) {
        try {
          const layout = globalThis.AcademyTeacherTemplate.render(JSON.parse(module.textContent), this.id, {tabsLabel: this.dataset.tabsLabel, sliderLabel: this.dataset.sliderLabel});
          this.querySelector('.teachers_layout').outerHTML = layout;
        } catch (error) {
          console.warn('Преподаватели: сохранена предыдущая разметка.', error.message);
        }
      }
      // Tilda keeps bundled local photos in HEAD; user-provided URLs need no map.
      const photoModule = this.dataset.assets ? this.ownerDocument.getElementById(this.dataset.assets) : null;
      if (photoModule) {
        try {
          const photos = JSON.parse(photoModule.textContent);
          this.querySelectorAll('[data-teacher-asset]').forEach((image) => {
            const source = photos[image.dataset.teacherAsset];
            if (typeof source === 'string' && /^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(source)) image.src = source;
          });
        } catch (error) { console.warn('Преподаватели: не удалось прочитать фотографии.', error.message); }
      }
      if (typeof window.Splide !== 'function' || !window.AcademySliderControls) return;
      const root = this.querySelector('[data-js="teacher-slider"]');
      this.tabs = Array.from(this.querySelectorAll('[data-js="teacher-tab"]'));
      this.tablist = this.querySelector('[data-js="teacher-tabs"]');
      this.navigation = this.querySelector('[data-js="teacher-navigation"]');
      this.controls = this.querySelector('[data-js="teacher-controls"]');
      this.previous = this.querySelector('[data-js="teacher-previous"]');
      this.next = this.querySelector('[data-js="teacher-next"]');
      if (!root || !this.tabs.length || !this.tablist) return;
      this.previous?.setAttribute('aria-controls', root.id);
      this.next?.setAttribute('aria-controls', root.id);
      this.listeners = new AbortController();
      const signal = this.listeners.signal;
      root.tabIndex = 0;
      this.slider = new window.Splide(root, {
        type: 'slide', role: 'group', autoWidth: true, perMove: 1,
        focus: 0, trimSpace: true, arrows: false, pagination: false,
        ...window.AcademySliderControls.motion(root), gap: '1rem', breakpoints: {767: {gap: '0.75rem'}}, rewind: false,
        keyboard: false, drag: true, autoplay: false, waitForTransition: false,
        wheel: false, snap: true, noDrag: '[data-slider-no-drag], button, a',
        start: Math.max(0, this.tabs.findIndex(tab => tab.dataset.teacherId === this.selectedId)),
        reducedMotion: {speed: 0, rewindSpeed: 0, autoplay: 'pause'},
        i18n: {carousel: 'Преподаватели', slide: 'Преподаватель', slideLabel: '%s из %s', select: 'Выбрать преподавателя %s'},
      });
      this.tablist.setAttribute('role', 'tablist');
      this.tabs.forEach((tab, index) => {
        tab.setAttribute('role', 'tab');
        tab.id = `${this.id}-tab-${tab.dataset.teacherId}`;
        tab.setAttribute('aria-controls', tab.getAttribute('href').slice(1));
        tab.addEventListener('click', (event) => { event.preventDefault(); this.slider.go(index); }, {signal});
        tab.addEventListener('keydown', (event) => {
          const vertical = this.tablist.getAttribute('aria-orientation') === 'vertical';
          const previousKey = vertical ? 'ArrowUp' : 'ArrowLeft';
          const nextKey = vertical ? 'ArrowDown' : 'ArrowRight';
          let target;
          if (event.key === previousKey) target = (index - 1 + this.tabs.length) % this.tabs.length;
          if (event.key === nextKey) target = (index + 1) % this.tabs.length;
          if (event.key === 'Home') target = 0;
          if (event.key === 'End') target = this.tabs.length - 1;
          if (event.key === ' ') { event.preventDefault(); this.slider.go(index); }
          if (target === undefined) return;
          event.preventDefault();
          this.tabs[target].focus({preventScroll: true});
          this.slider.go(target);
        }, {signal});
      });
      this.sliderControls = window.AcademySliderControls.bind(root, this, () => this.slider, this.previous, this.next);
      this.tablist.addEventListener('scroll', () => this.updateOverflow(), {signal, passive: true});
      this.slider.on('mounted moved updated resized', () => this.update());
      this.slider.on('move', index => this.updateSelection(index));
      this.slider.mount();
      this.slider.refresh();
      root.querySelectorAll('.teachers_slide').forEach((slide, index) => {
        this.tabs[index].setAttribute('aria-controls', slide.id);
        slide.setAttribute('role', 'tabpanel');
        slide.setAttribute('aria-labelledby', this.tabs[index].id);
        slide.removeAttribute('aria-roledescription');
        slide.removeAttribute('aria-label');
      });
      if (this.controls) this.controls.hidden = this.tabs.length < 2;
      this.observer = new ResizeObserver(() => this.update());
      const photo = this.querySelector('.teacher-card_media');
      if (photo) this.observer.observe(photo);
      this.observer.observe(this.tablist);
      this.update();
    }
    update() {
      if (!this.slider) return;
      this.arrangeTabs();
      const vertical = getComputedStyle(this.querySelector('.teachers_tab-row')).display === 'contents';
      this.tablist.setAttribute('aria-orientation', vertical ? 'vertical' : 'horizontal');
      const height = this.querySelector('.teacher-card_media')?.getBoundingClientRect().height;
      if (height) this.style.setProperty('--teachers-media-height', `${height}px`);
      this.updateSelection(this.slider.index);
    }
    arrangeTabs() {
      const desktop = window.matchMedia('(min-width: 64.0625rem)').matches;
      const tablet = window.matchMedia('(min-width: 48rem)').matches;
      const count = this.tabs.length > 8 && !desktop ? (tablet ? 2 : 3) : 1;
      if (this.tablist.children.length === count) return;
      const rows = document.createDocumentFragment();
      const size = Math.ceil(this.tabs.length / count);
      for (let index = 0; index < count; index += 1) {
        const row = document.createElement('div');
        row.className = 'teachers_tab-row';
        row.append(...this.tabs.slice(index * size, (index + 1) * size));
        rows.append(row);
      }
      this.tablist.replaceChildren(rows);
    }
    updateSelection(index) {
      this.tabs.forEach((tab, position) => {
        tab.setAttribute('aria-selected', String(index === position));
        tab.tabIndex = index === position ? 0 : -1;
      });
      this.selectedId = this.tabs[index]?.dataset.teacherId;
      this.sliderControls?.update();
      const tab = this.tabs[index];
      if (tab) {
        const frame = this.tablist.getBoundingClientRect();
        const selected = tab.getBoundingClientRect();
        // Scroll only the list; scrollIntoView would also move the landing.
        if (this.tablist.getAttribute('aria-orientation') === 'vertical' && selected.top < frame.top + 16) this.tablist.scrollTop += selected.top - frame.top - 16;
        else if (this.tablist.getAttribute('aria-orientation') === 'vertical') {
          const inset = Math.min(120, frame.height * 0.25) + 16;
          if (selected.bottom > frame.bottom - inset) this.tablist.scrollTop += selected.bottom - frame.bottom + inset;
        }
        if (selected.left < frame.left + 16) this.tablist.scrollLeft += selected.left - frame.left - 16;
        else if (selected.right > frame.right - 16) this.tablist.scrollLeft += selected.right - frame.right + 16;
      }
      this.updateOverflow();
    }
    updateOverflow() {
      this.navigation.dataset.overflow = String(this.tablist.scrollHeight - this.tablist.clientHeight - this.tablist.scrollTop > 2);
    }
    disconnect() {
      this.observer?.disconnect();
      this.listeners?.abort();
      this.sliderControls?.destroy();
      this.slider?.destroy(true);
      this.slider = null;
      this.controls?.setAttribute('hidden', '');
      this.tablist?.removeAttribute('role');
      this.tablist?.removeAttribute('aria-orientation');
      this.tabs?.forEach(tab => ['role', 'aria-selected', 'aria-controls', 'tabindex'].forEach(name => tab.removeAttribute(name)));
    }
    refresh() { this.disconnect(); this.connect(); }
  }
  customElements.define('academy-teachers', AcademyTeachers);
})();
