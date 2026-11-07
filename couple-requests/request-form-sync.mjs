// Форма заявки: общий компонент Академии web-academy/shared/academy/request-form* (правила: request-form.md там же).
// Сценарий копирует в папку лендинга стили и скрипт компонента и собирает разметку формы в index.html
// между метками request-form:start и request-form:end. Тексты формы лендинга: ниже, в FORM.
// Запуск из apps/preview: node couple-requests/request-form-sync.mjs
// Копии request-form.css и request-form.js руками не править: правки делаются в общем компоненте.
import fs from 'node:fs/promises';
import {renderRequestForm} from '../web-academy/shared/academy/request-form-render.mjs';

const root = new URL('./', import.meta.url);
const shared = new URL('../web-academy/shared/academy/', import.meta.url);

const FORM = {
  mode: 'course',
  // Имя нативной формы Тильды, которая уже стоит на modern-psy.ru/couple-requests (блок t1040 rec2321644891).
  // Она называется womens-care: блок когда-то скопировали со страницы «Забота о женщинах». Заявки уходят и сейчас
  // под этим именем; если в Тильде форму переименуют (например, в couple-requests), поменять здесь и пересобрать.
  nativeMarker: 'womens-care',
  // Заголовок по умолчанию: курс сейчас в листе ожидания. page.js ставит «Занятия начнутся …», когда в CMS откроется набор.
  heading: 'Запишитесь в лист ожидания',
  description: 'Оставьте свои данные в форме, и мы свяжемся с вами в рабочее время. Ответим на все вопросы, поможем определиться с направлением и способом оплаты.',
  submitLabel: 'Оставить заявку',
  source: 'ПК «Работа с темой отношений в практике психолога»',
};

const note = file => `Копия web-academy/shared/academy/${file}, её кладёт request-form-sync.mjs. Руками не править: правки в общем компоненте, потом снова запустить сценарий.`;
const css = await fs.readFile(new URL('request-form.css', shared), 'utf8');
const js = await fs.readFile(new URL('request-form.js', shared), 'utf8');
await fs.writeFile(new URL('request-form.css', root), `/* ${note('request-form.css')} */\n${css}`);
await fs.writeFile(new URL('request-form.js', root), `// ${note('request-form.js')}\n${js}`);

// Заголовок формы («Занятия начнутся …» или «Запишитесь в лист ожидания») page.js берёт из CMS по метке data-cms="enrollment-start"
const markup = renderRequestForm(FORM, {id: 'signup-form'})
  .replace('id="signup-form-heading"', 'id="signup-form-heading" data-cms="enrollment-start"');
if (!markup.includes('data-cms="enrollment-start"')) throw new Error('не нашёлся заголовок формы для метки data-cms');
const indexUrl = new URL('index.html', root);
const index = await fs.readFile(indexUrl, 'utf8');
const pattern = /(<!-- request-form:start[^>]*-->)[\s\S]*?(<!-- request-form:end -->)/;
if (!pattern.test(index)) throw new Error('index.html: нет меток request-form:start и request-form:end');
await fs.writeFile(indexUrl, index.replace(pattern, `$1\n      ${markup}\n      $2`));
console.log('форма заявки обновлена: request-form.css, request-form.js, index.html');
