# Психолог-консультант

Отдельный лендинг Академии для локальной разработки и последующего переноса
в Tilda. Стек: семантический HTML, CSS и JavaScript.

Обязательные проектные правила — в [AGENTS.md](AGENTS.md), текущий статус и
следующее действие — в [STATE.md](STATE.md). Начинать следующую сессию с проектных `AGENTS.md` и `STATE.md`,
затем читать контракт нужной секции в `COMPONENTS.md` и `data/design-source.json`.

## Контекст и источники

[COMPONENTS.md](COMPONENTS.md) — полная карта секций, shared-контрактов, данных
и render-адаптеров. [Общая библиотека](../../shared/academy/README.md) задаёт
компоненты, [new-landing.md](../../shared/academy/new-landing.md) — их применение
в следующем курсе. Проектные исключения хранятся только в [AGENTS.md](AGENTS.md).

## Локальный просмотр

Из корня репозитория:

```sh
python3 -m http.server 4193 --bind 127.0.0.1
```

Страница: <http://127.0.0.1:4193/projects/psychologist-consultant/>.

## Командное превью Vercel

По поручению пользователя для тестирования создан отдельный проект
`psychologist-consultant` в Vercel team `gleb-projects-work`.
Production-хост лендинга — Tilda.

Адрес для команды: <https://psychologist-consultant.vercel.app/>.

```sh
node projects/psychologist-consultant/build-vercel-preview.mjs
vercel link --yes --project psychologist-consultant --scope gleb-projects-work --cwd projects/psychologist-consultant/exports/vercel
vercel deploy --prod --yes --scope gleb-projects-work --cwd projects/psychologist-consultant/exports/vercel
```

Сборщик создаёт `exports/vercel/index.html` из актуального автономного Tilda
preview, убирая тестовый конфликт цветов. CSS/JS и локальные медиа встроены;
в публикацию не входят исходники, реестры или другие проекты. Экспорт закрыт
от индексации. Публикация выполняется CLI после сборки; push сам по себе не
обновляет этот отдельный проект. Неназначенные CTA и форма сохраняют preview-состояния.

## Исходники и проверка

- `index.html` содержит generated-области общих секций; `styles.css` — тему и внешнюю сетку.
- [COMPONENTS.md](COMPONENTS.md) определяет, какие данные и adapter менять для каждой секции.
- `data/design-source.json`, `assets.json`, `actions.json` — дизайн, медиа и действия.
- [CHECKLIST.md](CHECKLIST.md) — повторяемые проверки и локальные стенды.
- `build-tilda-bundle.mjs` — генератор автономного пакета; `build-seo.mjs` — метаданные.

## Перенос в Tilda

SEO-поля хранятся в `data/seo.json`. Команда
`node projects/psychologist-consultant/build-seo.mjs` обновляет метаданные
`index.html` и отдельный [schema.ld](schema.ld); её также вызывает сборщик Tilda.
`schema.ld` уже содержит один `<script type="application/ld+json">`: вставить
целиком в дополнительный HEAD страницы, заменив прежнюю схему. Этот отдельный
файл не входит в ZIP с визуальными T123-фрагментами. Title, description и
Open Graph перенести в соответствующие настройки Tilda; canonical уже настроен.
Генератор берёт преподавателей из `teachers/data.html`, цены из
`data/pricing.json`, этапы из `data/program.json`, FAQ из `data/faq.json`.
Источники реквизитов и причины исключения неподтверждённых свойств —
`data/seo.json#provenance` и `#omissions`. При изменении потоков обновить схему;
год старта не опубликован, поэтому точные ISO-даты не подставляются.

Перед переносом прочитать актуальные правила [кнопок](../../shared/academy/button.md),
[отступов карточек](../../shared/academy/card-spacing.md) и
[общей типографики](../../shared/academy/body-text.md).
Пользовательские уточнения этих компонентов имеют приоритет над старыми
размерами в Figma. Подключения и области переиспользования — [COMPONENTS.md](COMPONENTS.md).

Полный актуальный комплект готовится `build-tilda-bundle.mjs`. Порядок вставки
и размеры файлов — [tilda/README.md](tilda/README.md), контрольные суммы —
`tilda/manifest.json`. Обновлять HEAD и все STYLE/BODY/FOOTER одной сборкой.

Готовый комплект с инструкцией —
[`exports/psychologist-consultant-tilda.zip`](exports/psychologist-consultant-tilda.zip).
После каждой новой сборки для передачи обновлять архив: все файлы из
`manifest.files`, `README.md` и `manifest.json` помещаются в корень ZIP.
Проверять hashes содержимого архива против текущего manifest; `preview.html`
в архив для вставки не включать. Количество BODY/FOOTER может увеличиваться
по мере роста лендинга — источником списка остаётся manifest.

- `head.html` — короткий дополнительный HEAD в настройках страницы.
- `styles.html`, `styles-02.html` и остальные из `manifest.style_files` — каждый
  целиком в отдельный T123 до всех BODY; поля сверху и снизу — 0.
  Они содержат CSS и встроенные изображения. Старый большой HEAD заменить полностью.
- `body.html`, `body-02.html`, `body-03.html` — три T123 в этом порядке, с нулевыми внешними полями.
- Далее сохранить настроенный нативный блок формы по [контракту](data/form-contract.json).
- `teachers-data.html` — редактируемые данные преподавателей в отдельном T123.
- `footer.html`, `footer-02.html` — два последних T123 в этом порядке.

CSS делится только между целыми правилами. Секции и скриптовые модули не разрезаются внутри; каждый файл, включая HEAD, меньше 65 000 символов.
Все общие CSS/JS и локальные ассеты встроены, `shared/` в runtime не требуется.
Общий runtime работает во всех корнях BODY; native блок остаётся в DOM.
Преподаватели и рейтинги уже входят в страницу — не добавлять их отдельные пакеты повторно.

Опубликованная страница и подтверждение пользователя о работе формы —
[data/form-contract.json](data/form-contract.json). Настройки форм, попапов и
получателей в Tilda выполняет пользователь. Оставшиеся вопросы — [STATE.md](STATE.md).

## Команды сборки и проверки

```sh
node projects/psychologist-consultant/build-tilda-bundle.mjs --preview-only
node --test projects/psychologist-consultant/tests/*.test.mjs
```

Полный пакет для передачи:

```sh
node projects/psychologist-consultant/build-tilda-bundle.mjs
```

Обычная сборка обновляет весь комплект, README и manifest. `--preview-only`
обновляет только автономное превью и не подготавливает файлы для переноса.
При изменении сборщика проверить повторяемость сборки и manifest hashes.
Матрица проверки и браузерные сценарии — [CHECKLIST.md](CHECKLIST.md).

Состав секций, редактирование данных и отдельные подключения — [COMPONENTS.md](COMPONENTS.md).
