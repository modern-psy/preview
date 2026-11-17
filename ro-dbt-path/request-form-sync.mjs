// Форма заявки: общий компонент Академии web-academy/shared/academy/request-form* (правила: request-form.md там же).
// Сценарий копирует в папку страницы стили и скрипт компонента и собирает разметку формы в index.html
// между метками request-form:start и request-form:end. Тексты формы: ниже, в FORM.
// Запуск из apps/preview: node ro-dbt-path/request-form-sync.mjs
// Копии request-form.css и request-form.js руками не править: правки делаются в общем компоненте.
import fs from 'node:fs/promises';
import {renderRequestForm} from '../web-academy/shared/academy/request-form-render.mjs';

const root = new URL('./', import.meta.url);
const shared = new URL('../web-academy/shared/academy/', import.meta.url);

const FORM = {
  mode: 'course',
  // Имя нативной формы Тильды на modern-psy.ru/ro-dbt-path (блок t1040 rec2026380751), проверено 17.11.2026.
  nativeMarker: 'RODBT-general',
  // Заголовок и подзаголовок — со старой страницы.
  heading: 'Готовы сделать первый шаг?',
  description: 'Начните с группы самообучения, чтобы познакомиться с методом без больших вложений, или сразу переходите к Модулю 1.',
  submitLabel: 'Оставить заявку',
  source: 'Обучение RO DBT в России',
};

const note = file => `Копия web-academy/shared/academy/${file}, её кладёт request-form-sync.mjs. Руками не править: правки в общем компоненте, потом снова запустить сценарий.`;
const css = await fs.readFile(new URL('request-form.css', shared), 'utf8');
const js = await fs.readFile(new URL('request-form.js', shared), 'utf8');
await fs.writeFile(new URL('request-form.css', root), `/* ${note('request-form.css')} */\n${css}`);
await fs.writeFile(new URL('request-form.js', root), `// ${note('request-form.js')}\n${js}`);

const markup = renderRequestForm(FORM, {id: 'signup-form'});
const indexUrl = new URL('index.html', root);
const index = await fs.readFile(indexUrl, 'utf8');
const pattern = /(<!-- request-form:start[^>]*-->)[\s\S]*?(<!-- request-form:end -->)/;
if (!pattern.test(index)) throw new Error('index.html: нет меток request-form:start и request-form:end');
await fs.writeFile(indexUrl, index.replace(pattern, `$1\n      ${markup}\n      $2`));
console.log('форма заявки обновлена: request-form.css, request-form.js, index.html');
