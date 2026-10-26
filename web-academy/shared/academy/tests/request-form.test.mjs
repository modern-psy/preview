// Проверки формы заявки без браузера: правила полей и разметка по режимам.
// Запуск из web-academy: node --test shared/academy/tests/request-form.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {renderRequestForm} from '../request-form-render.mjs';

const source = await readFile(new URL('../request-form.js', import.meta.url), 'utf8');
const context = {window: {}, document: {querySelectorAll: () => []}};
vm.runInNewContext(source, context);
const h = context.window.__academyRequestFormHelpers;

test('телефон: любой привычный ввод даёт один номер', () => {
  for (const value of ['89123456789', '+7 (912) 345 67 89', '9123456789', '79123456789', '+79123456789', '8 912 345-67-89']) {
    const {foreign, national} = h.parseRuPhone(value);
    assert.equal(foreign, false, value);
    assert.equal(h.formatRuPhone(national), '+7 912 345-67-89', value);
  }
});

test('телефон: восьмёрка после +7 убирается на одиннадцатой цифре', () => {
  assert.equal(h.parseRuPhone('+7 8').national, '8');
  assert.equal(h.parseRuPhone('+7 891 234-56-789').national, '9123456789');
});

test('телефон: форматирование по ходу ввода без висящих разделителей', () => {
  assert.equal(h.formatRuPhone('912'), '+7 912');
  assert.equal(h.formatRuPhone('912345'), '+7 912 345');
  assert.equal(h.formatRuPhone('9123456'), '+7 912 345-6');
  assert.equal(h.formatRuPhone(''), '');
});

test('телефон: иностранный код уводит в режим другой страны', () => {
  assert.equal(h.parseRuPhone('+375 29 123-45-67').foreign, true);
  assert.equal(h.parseRuPhone('00375291234567').foreign, true);
  assert.equal(h.sanitizeIntlPhone('375 29 123-45-67'), '+375 29 123-45-67');
  assert.equal(h.intlPhoneMessage('+375 29 123-45-67'), '');
  assert.match(h.intlPhoneMessage('+375 29'), /код страны/);
});

test('телефон: ошибки', () => {
  assert.equal(h.ruPhoneMessage(''), h.TEXT.phoneEmpty);
  assert.equal(h.ruPhoneMessage('912345'), h.TEXT.phoneShort);
  assert.equal(h.ruPhoneMessage('1123456789'), h.TEXT.phoneCode);
  assert.equal(h.ruPhoneMessage('9123456789'), '');
});

test('Telegram: ник из любой записи, номер не принимается', () => {
  for (const value of ['anna_psy', '@anna_psy', 't.me/anna_psy', 'https://t.me/anna_psy', ' @@anna_psy ']) {
    assert.equal(h.normalizeTelegram(value), 'anna_psy', value);
    assert.equal(h.telegramMessage(value), '', value);
  }
  assert.equal(h.telegramMessage(''), h.TEXT.telegramEmpty);
  assert.equal(h.telegramMessage('+7 912 345 67 89'), h.TEXT.telegramPhone);
  assert.equal(h.telegramMessage('анна'), h.TEXT.telegramCyrillic);
  assert.equal(h.telegramMessage('anna.psy'), h.TEXT.telegramChars);
  assert.equal(h.telegramMessage('an'), h.TEXT.telegramLength);
});

test('почта: проверка и подсказка опечатки', () => {
  assert.equal(h.emailMessage('anna@mail.ru'), '');
  assert.equal(h.emailMessage(''), h.TEXT.emailEmpty);
  assert.equal(h.emailMessage('анна@mail.ru'), h.TEXT.emailCyrillic);
  assert.equal(h.emailMessage('anna@mail'), h.TEXT.emailInvalid);
  assert.equal(h.suggestEmail('anna@gmial.com'), 'anna@gmail.com');
  assert.equal(h.suggestEmail('anna@yandex.ry'), 'anna@yandex.ru');
  assert.equal(h.suggestEmail('Anna@Mail.ry'), 'Anna@mail.ru');
  assert.equal(h.suggestEmail('anna@mail.ru'), '');
});

test('имя', () => {
  assert.equal(h.nameMessage('Анна'), '');
  assert.equal(h.nameMessage('Анна-Мария д’Арк'), '');
  assert.equal(h.nameMessage('  '), h.TEXT.nameEmpty);
  assert.equal(h.nameMessage('А'), h.TEXT.nameShort);
  assert.equal(h.nameMessage('Анна1'), h.TEXT.nameChars);
  assert.equal(h.nameMessage('А'.repeat(61)), h.TEXT.nameLong);
});

test('срок ответа по московскому времени', () => {
  assert.equal(h.moscowHour(new Date('2026-10-24T06:30:00Z')), 9);
  assert.equal(h.moscowHour(new Date('2026-10-24T22:30:00Z')), 1);
  assert.match(h.replyWhen(9, 10, 20), /сегодня после 10:00/);
  assert.match(h.replyWhen(12, 10, 20), /сегодня до 20:00/);
  assert.match(h.replyWhen(21, 10, 20), /завтра после 10:00/);
});

test('склонение «поле»', () => {
  assert.deepEqual([1, 2, 4, 5, 11, 21, 22].map(h.fieldsWord), ['поле', 'поля', 'поля', 'полей', 'полей', 'поле', 'поля']);
});

test('устройство', () => {
  assert.equal(h.detectDevice({userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148'}), 'телефон');
  assert.equal(h.detectDevice({userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-X200) Safari/537.36'}), 'планшет');
  assert.equal(h.detectDevice({userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', maxTouchPoints: 5}), 'планшет');
  assert.equal(h.detectDevice({userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}), 'компьютер');
});

const base = {nativeMarker: 'kpt-bek', heading: 'Запишитесь на курс', submitLabel: 'Записаться'};

test('разметка: заявка на курс без почты, Telegram первым и выбран', () => {
  const html = renderRequestForm({...base, mode: 'course'}, {id: 'lead'});
  assert.doesNotMatch(html, /name="email"/);
  assert.match(html, /name="name"[^>]*autocomplete="name"/);
  assert.match(html, /type="tel" name="phone" inputmode="tel" autocomplete="tel"/);
  assert.ok(html.indexOf('value="telegram"') < html.indexOf('value="max"'));
  assert.match(html, /value="telegram" id="lead-messenger-telegram" checked/);
  assert.match(html, /data-request-field="telegram" data-state="idle">/, 'поле ника видно при Telegram по умолчанию');
  assert.match(html, /data-tilda-form-name="kpt-bek"/);
  assert.match(html, /Нажимая на кнопку «Записаться»/);
  assert.match(html, /https:\/\/t\.me\/Welcometoasp_bot/);
  assert.match(html, /с&nbsp;10:00 до&nbsp;19:00/);
  assert.match(html, /data-hours-from="10" data-hours-to="19"/);
  assert.match(html, /data-device-field="form_source" data-device-mode="append"/, 'устройство дописывается к источнику: utm_* переписывает скрипт в head сайта');
  assert.doesNotMatch(html, /type="checkbox"/, 'согласие строкой, без чекбокса');
  assert.doesNotMatch(html, /Написать в&nbsp;MAX/, 'без адреса бота в MAX кнопки MAX нет');
});

test('разметка: телефон готов к маске Тильды, Россия по умолчанию', () => {
  const html = renderRequestForm({...base, mode: 'course'}, {id: 'lead'});
  assert.match(html, /<label class="request-form_label" for="input_lead-phone">Телефон<\/label>/);
  assert.match(html, /id="reclead-phone" data-request-phone-mask><div class="request-form_phone-group" data-input-lid="lead-phone"><div class="t-input-block">/);
  assert.match(html, /class="request-form_input js-phonemask-input" id="input_lead-phone"[^>]*data-phonemask-id="lead-phone" data-phonemask-lid="lead-phone" data-phonemask-maskcountry="RU"[^>]*data-phonemask-skip-auto-init="true"/);
  assert.doesNotMatch(html, /Другая страна/);
});

test('разметка: пояснения про Telegram и MAX под «?», часы ответа в самом низу', () => {
  const html = renderRequestForm({...base, mode: 'course'}, {id: 'lead'});
  assert.equal((html.match(/data-request-tip>/g) || []).length, 2);
  assert.match(html, /aria-controls="lead-telegram-tip"[^>]*>.*?<\/button><\/div><p class="request-form_tip" id="lead-telegram-tip" hidden>По&nbsp;номеру в&nbsp;Telegram/);
  assert.match(html, /role="radiogroup" aria-labelledby="lead-messenger-label" aria-describedby="lead-messenger-tip"/);
  assert.match(html, /id="lead-messenger-tip" hidden>В&nbsp;Telegram напишем по&nbsp;нику\. В&nbsp;MAX напишем на&nbsp;номер телефона/);
  assert.match(html, /name="telegram"[^>]*aria-describedby="lead-telegram-error lead-telegram-tip"/);
  assert.doesNotMatch(html, /data-request-max-hint/);
  assert.ok(html.indexOf('request-form_legal') < html.indexOf('request-form_note'), 'часы ответа под согласием');
  assert.match(html, /<\/p><\/div><\/div><p class="request-form_note" data-request-content>/, 'часы ответа вне колонки с полями, сетка ставит их влево');
});

test('разметка: лист ожидания как заявка на курс', () => {
  const course = renderRequestForm({...base, mode: 'course'}, {id: 'lead'});
  const waitlist = renderRequestForm({...base, mode: 'waitlist', submitLabel: 'Записаться'}, {id: 'lead'});
  assert.match(waitlist, /data-mode="waitlist"/);
  assert.equal(waitlist.replace('data-mode="waitlist"', 'data-mode="course"'), course);
});

test('разметка: часы ответа только у курса и листа ожидания', () => {
  assert.match(renderRequestForm({...base, mode: 'waitlist'}), /request-form_note/);
  assert.doesNotMatch(renderRequestForm({...base, mode: 'webinar', successText: 'Ссылку пришлём'}), /request-form_note/, 'вебинарная форма запасная, BotHelp работает круглые сутки');
});

test('разметка: в имени пример значения', () => {
  assert.match(renderRequestForm(base, {id: 'lead'}), /name="name"[^>]*placeholder="Анна"/);
});

test('разметка: MAX по умолчанию прячет ник', () => {
  const html = renderRequestForm({...base, mode: 'course', defaultMessenger: 'max'}, {id: 'lead'});
  assert.match(html, /data-request-field="telegram" data-state="idle" hidden>/);
  assert.match(html, /name="telegram"[^>]*disabled/);
});

test('разметка: доступ к мини-курсу с почтой и без мессенджера', () => {
  const html = renderRequestForm({...base, mode: 'access', submitLabel: 'Получить доступ'}, {id: 'mini'});
  assert.match(html, /type="email" name="email" inputmode="email" autocomplete="email"/);
  assert.doesNotMatch(html, /name="messenger"/);
  assert.match(html, /name="phone"[^>]*enterkeyhint="done"/);
  assert.doesNotMatch(html, /request-form_note/, 'письмо приходит сразу, часы ответа не нужны');
});

test('разметка: вебинару нужен свой текст успеха', () => {
  assert.throws(() => renderRequestForm({...base, mode: 'webinar'}), /successText/);
  assert.match(renderRequestForm({...base, mode: 'webinar', successText: 'Ссылку пришлём'}), /data-success-text="Ссылку пришлём"/);
});

test('разметка: обязательные данные и экранирование', () => {
  assert.throws(() => renderRequestForm({...base, nativeMarker: ' '}), /nativeMarker/);
  assert.throws(() => renderRequestForm({...base, mode: 'program'}), /unknown mode/);
  assert.throws(() => renderRequestForm({...base, agreementUrl: 'http://x'}), /agreementUrl/);
  const html = renderRequestForm({...base, heading: '<b>Курс</b>'}, {id: 'lead'});
  assert.match(html, /&lt;b&gt;Курс&lt;\/b&gt;/);
});

test('разметка: id уникальны', () => {
  const html = renderRequestForm({...base, mode: 'course', lecture: {label: 'лекция', url: 'https://modern-psy.ru/'}}, {id: 'lead'});
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
});
