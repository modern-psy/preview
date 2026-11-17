// Вставляет в index.html два готовых блока, которые на этой странице не верстаются заново:
// 1) форму заявки — общий компонент Академии web-academy/shared/academy/request-form* (правила: request-form.md там же);
//    копирует в папку страницы его стили и скрипт и собирает разметку между метками request-form:start и request-form:end;
// 2) блок цены — копию блока, который уже стоит на Тильде (apps/tilda/pricing-auto/ro-dbt-2-fixed.html),
//    между метками price-block:start и price-block:end. Он нужен только превью: в пакет T123 не идёт.
// Запуск из apps/preview: node rodbt-lvl2/sync-blocks.mjs
// Копии request-form.css и request-form.js руками не править: правки делаются в общем компоненте.
import fs from 'node:fs/promises';
import {renderRequestForm} from '../web-academy/shared/academy/request-form-render.mjs';

const root = new URL('./', import.meta.url);
const shared = new URL('../web-academy/shared/academy/', import.meta.url);
const priceSource = new URL('../../tilda/pricing-auto/ro-dbt-2-fixed.html', import.meta.url);

const FORM = {
  mode: 'course',
  // Имя нативной формы Тильды на modern-psy.ru/rodbt-lvl2 (блок t1040 rec2220076591, варианты telegram и max_messenger),
  // от Дарьи 17.11.2026. Общая форма сама кладёт выбор MAX в слот max_messenger.
  nativeMarker: 'rodbt-lvl2',
  // Заголовок — со старой страницы. Подзаголовок — коротко вместо трёх абзацев старой страницы
  // («Важно: обучение строго последовательно…», «Начните с группы самообучения…», «После оплаты вы получите доступ…»).
  heading: 'Готовы сделать первый шаг?',
  description: 'Обучение идёт строго по порядку: Уровень 2 доступен только после Уровня 1. При оплате всех четырёх частей сразу откроются блоки 1–3, остальные появятся по мере перевода.',
  submitLabel: 'Оставить заявку',
  source: 'Второй уровень РО ДБТ',
};

const note = file => `Копия web-academy/shared/academy/${file}, её кладёт sync-blocks.mjs. Руками не править: правки в общем компоненте, потом снова запустить сценарий.`;
const css = await fs.readFile(new URL('request-form.css', shared), 'utf8');
const js = await fs.readFile(new URL('request-form.js', shared), 'utf8');
await fs.writeFile(new URL('request-form.css', root), `/* ${note('request-form.css')} */\n${css}`);
await fs.writeFile(new URL('request-form.js', root), `// ${note('request-form.js')}\n${js}`);

const indexUrl = new URL('index.html', root);
let index = await fs.readFile(indexUrl, 'utf8');

const formPattern = /(<!-- request-form:start[^>]*-->)[\s\S]*?(<!-- request-form:end -->)/;
if (!formPattern.test(index)) throw new Error('index.html: нет меток request-form:start и request-form:end');
const markup = renderRequestForm(FORM, {id: 'signup-form'});
index = index.replace(formPattern, (_, start, end) => `${start}\n      ${markup}\n      ${end}`);

const pricePattern = /(<!-- price-block:start -->)[\s\S]*?(<!-- price-block:end -->)/;
if (!pricePattern.test(index)) throw new Error('index.html: нет меток price-block:start и price-block:end');
const price = (await fs.readFile(priceSource, 'utf8')).trim();
if (!price.includes('id="rec2220051871"')) throw new Error('В блоке цены нет секции rec2220051871: на неё ведёт кнопка первого экрана');
index = index.replace(pricePattern, (_, start, end) => `${start}\n${price}\n      ${end}`);

await fs.writeFile(indexUrl, index);
console.log('обновлено: request-form.css, request-form.js, форма и блок цены в index.html');
