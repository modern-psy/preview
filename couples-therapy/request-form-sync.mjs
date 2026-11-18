// Форма заявки: общий компонент Академии web-academy/shared/academy/request-form* (правила: request-form.md там же).
// Сценарий копирует в папку лендинга стили и скрипт компонента и собирает разметку формы в index.html
// между метками request-form:start и request-form:end. Тексты формы лендинга: ниже, в FORM.
// Запуск из apps/preview: node couples-therapy/request-form-sync.mjs
// Копии request-form.css и request-form.js руками не править: правки делаются в общем компоненте.
import fs from 'node:fs/promises';
import {renderRequestForm} from '../web-academy/shared/academy/request-form-render.mjs';

const root = new URL('./', import.meta.url);
const shared = new URL('../web-academy/shared/academy/', import.meta.url);

const FORM = {
  mode: 'course',
  // Имя нативной формы Тильды на modern-psy.ru/couples-therapy (блок t1040 rec1080810061, поля Name, Phone,
  // messenger-type: telegram и max_messenger, messenger-id). На старой странице эта форма была видна сама,
  // теперь её прячет скрипт формы.
  nativeMarker: 'couples-therapy',
  // Заголовок, пока CMS не ответила: ближайший поток в CMS (17.11.2026) — 23 ноября 2026. page.js сам ставит дату из CMS,
  // а в листе ожидания — «Запишитесь в лист ожидания».
  heading: 'Занятия начнутся 23 ноября',
  description: 'Оставьте свои данные в форме, и мы свяжемся с вами в рабочее время. Ответим на все вопросы, поможем определиться с направлением и способом оплаты.',
  submitLabel: 'Оставить заявку',
  source: 'ПК «Терапия пар»',
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
