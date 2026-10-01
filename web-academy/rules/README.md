# Web Academy rules

Тематические обязательные стандарты репозитория. Корневой `AGENTS.md` хранит
глобальные ограничения и маршрутизацию; подробное устойчивое правило записывается
здесь в самом узком подходящем домене.

## Маршруты

- [`engineering/components.md`](engineering/components.md) — уровни
  переиспользования, HTML/CSS-компоненты, Custom Elements, lifecycle, публичный API
  и progressive enhancement; обязательные цельные Hero, CTA, Академия, FAQ и форма.
- [`engineering/web-components-mdn.md`](engineering/web-components-mdn.md) —
  база MDN: Custom Elements, registry, lifecycle, Shadow DOM, CSS-изоляция,
  templates/slots, events, ElementInternals, совместимость и применение к секциям.
- [`engineering/tilda-delivery.md`](engineering/tilda-delivery.md) — обязательная
  посекционная передача: пространства имён проекта и Tilda, scroll/popup,
  native form marker, один T123 на секцию, защита от кратных отступов и release
  gates для сборки и опубликованной страницы.
- [`engineering/tilda-svg-and-masks.md`](engineering/tilda-svg-and-masks.md) —
  self-contained SVG, прозрачные placeholders, CSS masks, парный HEAD/BODY,
  лимит T123 и защита authored colors от каскада Tilda.
- [`engineering/tilda-form-bridges.md`](engineering/tilda-form-bridges.md) —
  контракт скрытой нативной формы, зеркалирование значений, CAPTCHA,
  `tildaform:aftersuccess` и end-to-end подтверждение заявки в CRM.
- [`product/semantic-accessibility.md`](product/semantic-accessibility.md) —
  semantic HTML, landmarks, headings, keyboard/focus, формы, ARIA, media и ручная
  проверка доступности.
- [`product/typography.md`](product/typography.md) — неразрывные пробелы,
  висячие служебные слова, тире, даты, величины и денежные суммы.
- [`product/seo.md`](product/seo.md) — metadata, canonical, Open Graph,
  индексируемая структура и изображения.

Не дублировать полные правила в `AGENTS.md`, project `STATE.md` или нескольких
тематических файлах. В них допустима только краткая маршрутизация к
каноническому правилу. Сессионные handoff-файлы после консолидации не хранить;
история остаётся в Git.
