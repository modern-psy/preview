// Форма заявки: общий компонент Академии web-academy/shared/academy/request-form* (правила: request-form.md там же).
// Сценарий копирует в папку лендинга стили и скрипт компонента и собирает разметку формы в index.html
// между метками request-form:start и request-form:end. Тексты формы лендинга: ниже, в FORM.
// Запуск из apps/preview: node psihiatriya-dlya-psihologov/request-form-sync.mjs
// После него пересобрать пакет Тильды: node psihiatriya-dlya-psihologov/build-tilda.mjs
// Копии request-form.css и request-form.js руками не править: правки делаются в общем компоненте.
import fs from 'node:fs/promises';
import {renderRequestForm} from '../web-academy/shared/academy/request-form-render.mjs';

const root = new URL('./', import.meta.url);
const shared = new URL('../web-academy/shared/academy/', import.meta.url);

const FORM = {
  mode: 'course',
  // имя нативной формы Тильды на modern-psy.ru/psychiatry-for-psy (подтвердила Дарья 20.10.2026)
  nativeMarker: 'psychiatry-basics',
  heading: 'Оставьте заявку, и мы свяжемся с вами',
  description: 'Пришлём полную программу курса и ответим на вопросы о поступлении',
  submitLabel: 'Оставить заявку',
  source: 'ПК «Психиатрия для психологов»',
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
