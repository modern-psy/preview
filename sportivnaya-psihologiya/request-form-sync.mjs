// Форма заявки: общий компонент Академии web-academy/shared/academy/request-form* (правила: request-form.md там же).
// Сценарий копирует в папку лендинга стили и скрипт компонента и собирает разметку формы в index.html
// между метками request-form:start и request-form:end. Тексты формы лендинга: ниже, в FORM.
// Запуск из apps/preview: node sportivnaya-psihologiya/request-form-sync.mjs
// Копии request-form.css и request-form.js руками не править: правки делаются в общем компоненте.
import fs from 'node:fs/promises';
import {renderRequestForm} from '../web-academy/shared/academy/request-form-render.mjs';

const root = new URL('./', import.meta.url);
const shared = new URL('../web-academy/shared/academy/', import.meta.url);

const FORM = {
  mode: 'course',
  // Имя нативной формы Тильды на modern-psy.ru/sportivnaya-psihologiya (блок t1040 rec2163116591, поля Name, Phone,
  // messenger-type: telegram и max_messenger, messenger-id). До 08.11.2026 она называлась «womens-care».
  // Нативную форму не удалять и не скрывать: эта форма отправляет через неё и сама её прячет.
  nativeMarker: 'sport-psy',
  // Заголовок, пока CMS не ответила: старт 11 мая (дата от Дарьи 23.11.2026, в CMS у потока даты ещё нет).
  // page.js ставит дату из CMS, только если у потока она есть.
  heading: 'Занятия начнутся 11 мая',
  description: 'Оставьте свои данные в форме, и мы свяжемся с вами в рабочее время. Ответим на все вопросы, поможем определиться с направлением и способом оплаты.',
  submitLabel: 'Оставить заявку',
  source: 'ПП «Спортивная психология»',
};

// Вторая форма: мини-курс в секции free-course (вариант B, 25.11.2026). Режим access: имя, почта, телефон.
// Нативная форма Тильды «sport-minicourse» живёт в попапе rec4408884401 на modern-psy.ru/sportivnaya-psihologiya:
// поля Name, Phone, Email и блок «способ связи» (messenger-type). Блок способа связи там обязательный,
// а в режиме access форма мессенджер не спрашивает: пока в Тильде он обязателен, заявка не уйдёт
// (компонент покажет ошибку с кнопкой бота). Обязательность снять в Тильде, только с согласия Дарьи.
// Попап не удалять: форма отправляет через него и сама его прячет.
const FREE_FORM = {
  mode: 'access',
  nativeMarker: 'sport-minicourse',
  heading: 'Начните мини\u2011курс бесплатно',
  description: 'Письмо с\u00a0уроками придёт на\u00a0почту сразу после заявки.',
  submitLabel: 'Начать мини\u2011курс',
  source: 'Мини-курс «Спортивная психология»',
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
let next = index.replace(pattern, `$1\n      ${markup}\n      $2`);
// Заголовок формы мини-курса h3: заголовок секции h2 стоит в карточке слева
const freeMarkup = renderRequestForm(FREE_FORM, {id: 'free-course-form', headingLevel: 3});
const freePattern = /(<!-- request-form-free:start[^>]*-->)[\s\S]*?(<!-- request-form-free:end -->)/;
if (!freePattern.test(next)) throw new Error('index.html: нет меток request-form-free:start и request-form-free:end');
next = next.replace(freePattern, `$1\n      ${freeMarkup}\n      $2`);
await fs.writeFile(indexUrl, next);
console.log('формы обновлены: request-form.css, request-form.js, index.html (заявка на курс и мини-курс)');
