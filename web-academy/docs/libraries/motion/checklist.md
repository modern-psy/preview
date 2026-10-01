# Motion checklist

- [ ] Используется точная версия CDN, не `@latest`.
- [ ] Выбран минимально достаточный Motion bundle/API.
- [ ] Без JavaScript essential content остаётся видимым.
- [ ] `prefers-reduced-motion` убирает несущественное движение.
- [ ] Обычный preview не подменяет системный matchMedia по query-параметру;
  принудительный reduced motion изолирован в явно названном тестовом стенде.
- [ ] Проверены фактическая длительность, промежуточное состояние и завершение,
  а не только конечный DOM; учтены CSS/JS токены, единицы ms/s и внешние overrides.
- [ ] При жалобе на мгновенное переключение проверены URL, computed styles,
  настройки экземпляра, media query и console; причина не приписана ОС без данных.
- [ ] Основные свойства — `transform` и `opacity`.
- [ ] Нет конфликта ownership с CSS, GSAP или Splide.
- [ ] Все observers, scroll handlers и controls очищаются.
- [ ] Повторная Tilda initialization не дублирует motion.
- [ ] Animation не блокирует click, focus, scroll или form input.
- [ ] Проверены mobile, tablet, desktop и изменение viewport.
