import {readFile, writeFile, mkdir, cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {assertResponsiveContract} from '../../shared/academy/responsive.mjs';
import {assertMotionContract} from '../../shared/academy/motion-contract.mjs';
const root = path.dirname(fileURLToPath(import.meta.url));
const shared = path.resolve(root,'../../shared/academy');
const preview = path.resolve(root,'../../../student-conference');
const read = file => readFile(path.join(root,file),'utf8');
const escape = text => String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
// Можно править тексты. Неразрывные связи добавляются только в текстовые узлы.
const typo = text => escape(text).replace(/(^|\s)(а|в|и|к|о|с|у|я|во|до|за|из|на|не|ни|но|об|от|по|со|без|для|над|под|при|про)\s+(?=\S)/giu,'$1$2&nbsp;').replace(/ (—)/g,'&nbsp;$1').replace(/(\d) (?=₽|ноября|года|лет|вузов)/g,'$1&nbsp;');
const body = text => `<p class="body-text_component is-reading">${typo(text)}</p>`;
const {tracks} = JSON.parse(await read('data/program.json'));
const reviews = JSON.parse(await read('data/reviews.json'));
const audience = [
 ['Вы на старших курсах или недавно получили диплом, а консультировать всё ещё страшно','a'],
 ['В вузе было много теории и почти не было практики с живыми клиентами','a'],
 ['Вы не понимаете, какой метод выбрать и какой из них доказательный','b'],
 ['Непонятно, где искать первых клиентов и сколько брать за сессию','a'],
 ['Вы не знаете, куда идти: клиника, частная практика, психологический центр или компания','a'],
 ['Кажется, что «настоящим психологом» становятся только лет через десять','a'],
 ['Вы из педагогики, социологии, философии или медицины и хотите в психологию','c'],
 ['Непонятно, сколько займёт переподготовка, сколько она стоит и что даст','c']
];
const outcomes = ['Куда пойти работать после вуза и чем отличаются разные форматы практики','Как выбрать метод и отличить доказательный подход от остальных','Где искать первых клиентов и как назначать цену на старте','Зачем начинающему супервизия и как выбрать супервизора','Чем клинический психолог отличается от психолога-консультанта','Какие специализации сейчас востребованы','Как прийти в психологию из другой профессии и сколько это займёт','Как вести блог начинающему психологу и не нарушать этику'];
const faq = [
 ['Нужно ли быть психологом, чтобы участвовать?','Нет. Трек «Путь с нуля» сделан для тех, кто приходит из других профессий.'],
 ['Я на втором курсе, можно прийти?','Можно, хотя основная программа рассчитана на третий курс и старше.'],
 ['Можно ли переходить между треками?','Да, в любой момент. Ссылки на все залы придут в мессенджер утром 21 ноября.'],
 ['Выдаётся ли сертификат участника?','Да. Электронный сертификат доступен для тарифа с записями.'],
 ['Что нужно для участия?','Компьютер или телефон с Zoom и стабильный интернет.']
];
const fragments = {
 AUDIENCE: audience.map(([text,track],i)=>`<button class="conference-question_component" type="button" aria-pressed="false" data-js="audience-question" data-track="${track}"><span class="conference-question_text">${typo(text)}</span><span class="conference-question_mark" aria-hidden="true">↗</span></button>`).join('\n'),
 TRACK_BUTTONS: tracks.map(t=>`<button class="conference-track_choice" type="button" id="sc-tab-${t.id}" aria-controls="sc-panel-${t.id}" data-js="track" data-track="${t.id}"><span class="conference-track_choice-copy"><span class="conference-track_name">${typo(t.name)}</span></span><span class="conference-track_choice-arrow" aria-hidden="true">↗</span></button>`).join('\n'),
 TRACK_PANELS: tracks.map(t=>`<div class="conference-track_panel" id="sc-panel-${t.id}" aria-labelledby="sc-tab-${t.id}" data-js="track-panel" data-track="${t.id}"><div class="conference-track_panel-header"><h3 class="content-heading_component is-profile">${typo(t.lead)}</h3>${body(t.audience)}</div><div class="accordion_component" data-accordion data-accordion-single>${t.topics.map(([title,description],i)=>`<details class="conference-topic_component" data-accordion-item><summary class="conference-topic_trigger" data-accordion-trigger><span class="conference-topic_number">${String(i+1).padStart(2,'0')}</span><div><h4 class="conference-topic_title">${typo(title)}</h4><span class="conference-topic_meta">Спикера объявим скоро</span></div><span class="accordion_icon" aria-hidden="true"></span></summary><div data-accordion-panel><div class="conference-topic_panel" data-accordion-panel-inner>${body(description)}</div></div></details>`).join('\n')}</div></div>`).join('\n'),
 REVIEWS:reviews.map((r,i)=>`<figure class="conference-review_component${i===0?' is-featured':''}"><span class="conference-review_mark" aria-hidden="true">“</span><blockquote class="conference-review_quote" style="margin:0">${typo(r.quote)}</blockquote>${r.demo?'<span class="conference_demo">Демо-текст · заменим реальным отзывом</span>':''}<figcaption class="conference-review_author"><span><span class="conference-review_name">${typo(r.name)}</span><span class="conference-review_meta">${typo(r.meta)}</span></span></figcaption></figure>`).join('\n'),
 OUTCOMES:outcomes.map(text=>`<li class="conference-outcomes_item">${typo(text)}</li>`).join('\n'),
 FAQ:faq.map(([q,a])=>`<details class="faq_item accordion_item" data-accordion-item><summary class="faq_question accordion_summary" data-accordion-trigger><h3 class="content-heading_component is-card">${typo(q)}</h3><span class="accordion_icon" aria-hidden="true"></span></summary><div class="faq_answer accordion_panel" data-accordion-panel><div class="faq_answer-inner accordion_panel-inner">${body(a)}</div></div></details>`).join('\n')
};
let html = await read('index.template.html');
for(const [key,value] of Object.entries(fragments)) html=html.replace(`{{${key}}}`,value);
html=html.replace(/>([^<>]+)</g,(match,text)=>text.includes('&nbsp;')?match:`>${text.replace(/(^|\s)(а|в|и|к|о|с|у|я|во|до|за|из|на|не|ни|но|об|от|по|со|без|для|над|под|при|про)\s+(?=\S)/giu,'$1$2&nbsp;').replace(/ (—)/g,'&nbsp;$1').replace(/(\d) (?=₽|ноября|года|лет)/g,'$1&nbsp;')}<`);
// Можно менять подписи; иконки остаются геометрией одной системы.
const arrow = '<svg class="conference-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
html=html.replaceAll('↗',arrow).replaceAll('Наверх ↑','Наверх').replaceAll('← Вернуться','Вернуться');
html=html.replaceAll('<img ','<img draggable="false" ');
const sharedCSS=['components.css','body-text.css','card-spacing.css','section-spacing.css','button.css','faq-responsive.css','section-heading.css','anchor-scroll.css'];
let css=await readFile(path.resolve(root,'../../../../../design-system/tokens.css'),'utf8');
for(const file of sharedCSS)css+='\n'+await readFile(path.join(shared,file),'utf8');
const js=(await Promise.all(['components.js','anchor-scroll.js'].map(file=>readFile(path.join(shared,file),'utf8')))).join('\n');
const localCSS=await read('styles.css');
const localJS=await read('script.js');
assertResponsiveContract(localCSS,'Student conference CSS');
assertResponsiveContract(localJS,'Student conference JS');
assertMotionContract(localCSS,'Student conference CSS');
await writeFile(path.join(root,'index.html'),html);
await writeFile(path.join(root,'academy.css'),css);
await writeFile(path.join(root,'academy.js'),js);
await mkdir(preview,{recursive:true});
for(const file of ['index.html','academy.css','academy.js','styles.css','script.js'])await cp(path.join(root,file),path.join(preview,file));
await cp(path.join(root,'assets'),path.join(preview,'assets'),{recursive:true});
await writeFile(path.join(preview,'robots.txt'),'User-agent: *\nDisallow: /\n');
console.log(`Built ${preview}; 3 tracks / ${tracks.reduce((sum,t)=>sum+t.topics.length,0)} topics / ${reviews.length} reviews.`);
