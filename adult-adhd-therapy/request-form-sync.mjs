// Форма заявки: общий компонент Академии web-academy/shared/academy/request-form* (правила: request-form.md там же).
// Сценарий копирует в папку лендинга стили и скрипт компонента и собирает разметку формы в index.html
// между метками request-form:start и request-form:end. Тексты формы лендинга: ниже, в FORM.
// Запуск из apps/preview: node adult-adhd-therapy/request-form-sync.mjs
// Копии request-form.css и request-form.js руками не править: правки делаются в общем компоненте.
import fs from 'node:fs/promises';
import {renderRequestForm} from '../web-academy/shared/academy/request-form-render.mjs';

const root = new URL('./', import.meta.url);
const shared = new URL('../web-academy/shared/academy/', import.meta.url);

const FORM = {
  mode: 'course',
  // Имя нативной формы Тильды на modern-psy.ru/adult-adhd-therapy (rec1981798501). До 07.11.2026 она называлась
  // «course-rl» (скопирована со страницы /course-rl), по просьбе Дарьи переименована в «adult-adhd-therapy».
  // Имя здесь и formname нативной формы в Тильде должны совпадать, иначе заявки не уйдут.
  nativeMarker: 'adult-adhd-therapy',
  heading: 'Первая встреча 31 января',
  description: 'Оставьте заявку, и мы свяжемся с вами. Ответим на вопросы и поможем выбрать: один вебинар или весь цикл',
  submitLabel: 'Оставить заявку',
  source: 'Вебинары «Тонкости работы со взрослыми с СДВГ»',
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
