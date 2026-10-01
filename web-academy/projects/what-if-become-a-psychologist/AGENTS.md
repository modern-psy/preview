# «А что, если стать психологом» — правила проекта

Правила относятся только к `projects/what-if-become-a-psychologist/`.

## Источники и workflow

- Tilda — production; canonical — `https://modern-psy.ru/how-to-enter-psy`.
- Канонические исходники: `index.html`, `styles.css`, `script.js`, `schema.org`,
  `tilda-assets.json` и локальные assets.
- Figma Dev Mode и явные пользовательские правки — визуальный источник. Узлы:
  header `100:1160`, hero `161:3223`, dialogue `106:1327`, doubts `115:3049`,
  agenda `118:3314`, speaker `115:3050`, Academy `161:3225`, CTA `150:396`,
  FAQ `157:563`.
- После проверенного изменения сохраняй единый source/generated набор.

## Инварианты

- Используй semantic plain HTML/CSS/JS, Client-First, fluid layout, доступный
  progressive enhancement и идемпотентную инициализацию.
- Не переноси значения из других лендингов. Сохраняй unrelated user changes.
- Два локальных hero-видео и два URL из `tilda-assets.json` — одна атомарная
  пара. Не менять или удалять её без прямого запроса.
- FAQ остаётся в source, но исключается из Tilda BODY; не возвращать его без
  прямого запроса. JSON-LD не должен описывать скрытый FAQ.
- На mobile essential content остаётся в normal flow без обязательных
  scroll/pointer/compositor effects.

## Tilda package

- `build-tilda-bundle.mjs` — единственный генератор `tilda/`; generated files не
  редактировать вручную.
- После source/config changes пересобрать дважды, запустить Tilda test,
  `node --check script.js` и `git diff --check`.
- Допустимы только запрограммированные builder-различия между source и BODY.
