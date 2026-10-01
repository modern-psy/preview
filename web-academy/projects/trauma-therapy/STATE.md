# «Терапия травмы: ПТСР и кПТСР» — текущее состояние

- Статус: source и сгенерированные Tilda HEAD/BODY синхронизированы; актуальная
  локальная ревизия ещё не перенесена в Tilda.
- Форма использует общий `shared/academy/lead-form.css` и `lead-form.js`;
  подключение — `shared/academy/lead-form.md`. Проектный marker/mapping сохранён.
- Production-зависимости: штатные header/footer Tilda, нативная форма и её
  получатели, а также popup `#form-download`. Точный контракт формы хранится в
  `data/form-contract.json`.
- Общая форма проверена локально на ширинах 375–1440px, в обоих messenger
  branches и после повторной инициализации. Визуальный просмотр всей страницы
  остаётся незавершённым: Browser screenshots недоступны.
- Следующее действие: проверить матрицу ширин, затем заменить в Tilda парные
  `tilda/head.html` и `tilda/body.html` и пройти опубликованный smoke-test.
