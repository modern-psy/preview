// Собирает разметку формы заявки для стенда и пример request-form.html.
// Запуск из web-academy: node shared/academy/tests/build-request-form-fixture.mjs
import fs from 'node:fs/promises';
import {renderRequestForm} from '../request-form-render.mjs';

const examples = {
  course: {
    heading: 'Запишитесь на курс',
    description: 'Менеджер напишет и ответит на вопросы о программе и оплате',
    submitLabel: 'Записаться',
    lecture: {label: 'первая лекция курса бесплатно', url: 'https://modern-psy.ru/'},
  },
  access: {
    heading: 'Получите доступ к мини-курсу',
    description: 'Пришлём ссылку на уроки на почту',
    submitLabel: 'Получить доступ',
  },
  webinar: {
    heading: 'Запишитесь на вебинар',
    description: 'Ссылку на эфир пришлём в мессенджер',
    submitLabel: 'Записаться',
    successText: 'Ссылку на эфир пришлём в выбранный мессенджер до начала вебинара.',
  },
};

const render = mode => renderRequestForm({
  mode, nativeMarker: 'fixture-form', source: `fixture · ${mode}`, deviceField: 'fixture_device', ...examples[mode],
}, {id: 'fixture-form'});

const templates = Object.keys(examples)
  .map(mode => `    <template id="request-form-markup-${mode}">${render(mode)}</template>`)
  .join('\n');

const fixtureUrl = new URL('request-form-fixture.html', import.meta.url);
const fixture = await fs.readFile(fixtureUrl, 'utf8');
const updated = fixture.replace(
  /<!-- request-form:markup:start -->[\s\S]*?<!-- request-form:markup:end -->/,
  `<!-- request-form:markup:start -->\n${templates}\n    <!-- request-form:markup:end -->`,
);
if (updated === fixture && !fixture.includes('request-form-markup-course')) throw new Error('Fixture markers not found');
await fs.writeFile(fixtureUrl, updated);

await fs.writeFile(
  new URL('../request-form.html', import.meta.url),
  `<!-- Пример разметки. Собрано tests/build-request-form-fixture.mjs из request-form-render.mjs: правьте renderer, не этот файл. -->\n${renderRequestForm({...examples.course, mode: 'course', nativeMarker: 'YOUR_FORM_MARKER'}, {id: 'request-form'})}\n`,
);
