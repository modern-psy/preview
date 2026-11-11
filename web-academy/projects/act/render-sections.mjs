import {escapeHtml as esc} from '../act-hero-variants/cms-model.mjs';
import {renderLeadForm} from '../../shared/academy/lead-form-render.mjs';
import {renderFaq} from '../../shared/academy/faq-render.mjs';

// Содержимое приходит из зафиксированного DOM. Скрипты и стили исходного сайта не исполняем.
export function rich(value='') {
  return value.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,(tag,name)=>{
    name=name.toLowerCase();
    if(!['p','br','strong','b','em','i','ul','ol','li','a'].includes(name))return '';
    if(tag.startsWith('</'))return `</${name}>`;
    if(name==='a'){
      const href=tag.match(/href=["']([^"']+)["']/i)?.[1]||'';
      if(!/^(https?:|\/|#)/.test(href))return '<span>';
      const absolute=href.startsWith('/')?'https://modern-psy.ru'+href:href;
      return `<a class="text-link" href="${esc(absolute)}"${absolute.startsWith('http')?' target="_blank" rel="noopener"':''}>`;
    }
    return `<${name}${name==='p'?' class="act-copy_paragraph"':['ul','ol'].includes(name)?' class="act-copy_list"':name==='li'?' class="act-copy_item"':''}>`;
  });
}
const text=value=>esc(value||'');
// Общий FAQ владеет разметкой. Здесь сохраняем исходный HTML ответов и ссылку на лицензию.
export function renderCourseFaq(faq) {
  let html=renderFaq({heading:faq.heading,items:faq.items.map((item,i)=>({question:item.question,answer:[`ACT_FAQ_ANSWER_${i}`]}))},{id:'act-faq'});
  faq.items.forEach((item,i)=>{html=html.replace(`<p>ACT_FAQ_ANSWER_${i}</p>`,`<p>${rich(item.answer)}</p>`);});
  return html.replace('id="act-faq"','id="act-faq" data-act-section="faq"').replaceAll('is-center','is-left');
}
const icon=(name='check')=>`<span class="icon is-lg" aria-hidden="true" style="--icon-url:url('/act/icons/${name}.svg')"></span>`;
const heading=(title,id,description='')=>`<div class="act-section_header"><h2 class="text-size-section-title" id="${id}-heading">${text(title)}</h2>${description?`<div class="text-size-lead text-color-secondary">${rich(description)}</div>`:''}</div>`;
const section=(key,title,body,{id=`act-${key}`,description='',tone='',header=true}={})=>({key,title,html:`<section class="section_${key} ${tone}" id="${id}" data-act-section="${key}" aria-labelledby="${id}-heading"><div class="padding-global"><div class="container-large"><div class="padding-section-small"><div class="act-section_component">${header?heading(title,id,description):''}${body}</div></div></div></div></section>`});
const card=(item,{decor=false,image=false}={})=>`<article class="act-card_component${decor?' is-decorated':''}">${item.image?`<img class="${decor?'act-card_decoration':'act-card_icon'}" src="${esc(item.image)}" alt="" aria-hidden="true" loading="lazy">`:''}<h3 class="text-size-block-title">${text(item.title)}</h3><div class="act-card_body text-size-note text-color-secondary">${rich(item.body)}</div></article>`;
const embed=(id,title,poster='',portrait=false)=>`<div class="act-video_component${portrait?' is-portrait':''}" data-video="${esc(id)}">${poster?`<button class="act-video_trigger" type="button" aria-label="Смотреть видео: ${esc(title)}" data-video-play><img class="act-video_poster" src="${esc(poster)}" alt="${esc(title)}" loading="lazy"><span class="act-video_play">${icon('play')}</span></button>`:`<iframe class="act-video_frame" src="https://kinescope.io/embed/${esc(id)}" title="${esc(title)}" loading="lazy" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe>`}</div>`;
// Бесплатное окно сохраняет свои поля; основная заявка рендерится общей библиотекой.
const trialForm=prefix=>`<form class="act-form_component" data-local-form="trial">
  <div class="act-form_field"><label class="text-size-body" for="${prefix}-name">Ваше имя</label><input class="act-form_input" id="${prefix}-name" name="name" autocomplete="name" required></div>
  <div class="act-form_field"><label class="text-size-body" for="${prefix}-phone">Ваш телефон</label><input class="act-form_input" id="${prefix}-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="(000) 000-00-00" required></div>
  <div class="act-form_field"><label class="text-size-body" for="${prefix}-email">Электронная почта</label><input class="act-form_input" id="${prefix}-email" name="email" type="email" autocomplete="email" required></div>
  <p class="text-size-note text-color-secondary">Нажимая на кнопку «Отправить», я даю <a class="text-link" href="https://modern-psy.ru/agreement" target="_blank" rel="noopener">согласие</a> на обработку моих персональных данных в соответствии с <a class="text-link" href="https://modern-psy.ru/privacy" target="_blank" rel="noopener">политикой обработки персональных данных</a></p>
  <button class="button is-lg act-form_submit" type="submit">Отправить</button><p class="text-size-note text-color-secondary" data-form-status role="status" hidden></p>
</form>`;

function programBody(module) {
  const atoms=module.body.flatMap(part=>part.texts).sort((a,b)=>Math.abs(a.y-b.y)<16?a.x-b.x:a.y-b.y);
  const columns=items=>`<div class="act-program_columns">${items.filter(a=>/^\d+[.]/.test(a.text.trim())).map(a=>`<div class="act-program_topic">${rich(a.html)}</div>`).join('')}</div>${items.filter(a=>/тестирование|Итоговый экзамен/.test(a.text)).map(a=>`<div class="act-program_assessment text-size-note text-weight-medium">${rich(a.html)}</div>`).join('')}`;
  if(module.number!==3)return columns(atoms);
  const starts=atoms.filter(a=>/^Модуль 3\./.test(a.text));
  return starts.map((start,i)=>{
    const items=atoms.filter(a=>a.y>start.y&&a.y<(starts[i+1]?.y||Infinity));
    const title=items.find(a=>!/^\d+[.]/.test(a.text));
    return `<div class="act-program_submodule"><p class="text-size-note text-color-accent">${text(start.text)}</p><h4 class="text-size-block-title">${text(title.text)}</h4>${columns(items.filter(a=>a!==title))}</div>`;
  }).join('');
}

export function renderSections(data,leadForm) {
  const sections=[];
  sections.push(section('foundation',data.intro.title,`<div class="act-foundation_component">${data.intro.cards.map(c=>card(c,{decor:true})).join('')}</div>`,{description:data.intro.body}));
  sections.push(section('community',data.community.title,`<div class="act-community_component">${data.community.videos.map((id,i)=>embed(id,`ACT Petersburg Episode ${i+1}`)).join('')}</div>`,{description:data.community.body}));
  sections.push(section('benefits',data.benefits.title,`<div class="act-benefits_component">${data.benefits.cards.map(c=>`<article class="act-benefits_card"><img class="act-benefits_icon" src="${esc(c.image)}" alt="" aria-hidden="true" loading="lazy"><div class="act-benefits_copy"><h3 class="text-size-block-title">${text(c.title)}</h3><div class="text-size-note text-color-secondary">${rich(c.body)}</div></div></article>`).join('')}</div>`));
  sections.push(section('standards',data.standards.title,`<div class="act-standards_component"><article class="act-card_component is-decorated"><img class="act-card_decoration" src="${esc(data.standards.questionImage)}" alt="" aria-hidden="true" loading="lazy"><div class="text-size-lead">${rich(data.standards.quote)}</div><div class="text-size-body text-weight-medium">${rich(data.standards.statement)}</div></article><div class="act-standards_grid"><div class="act-standards_intro"><div class="text-size-lead">${rich(data.standards.intro)}</div><img class="act-standards_logo" src="${esc(data.standards.logo)}" alt="ACBS — Association for Contextual Behavioral Science" loading="lazy"></div><div class="act-standards_tiles">${data.standards.cards.map(c=>card(c)).join('')}</div></div><article class="act-card_component is-decorated"><img class="act-card_decoration" src="${esc(data.standards.international.image)}" alt="" aria-hidden="true" loading="lazy"><h3 class="text-size-block-title">${text(data.standards.international.title)}</h3><div class="text-size-lead">${rich(data.standards.international.body)}</div></article><div class="act-standards_note text-size-lead">${rich(data.standards.international.note)}</div></div>`));
  sections.push(section('outcomes',data.outcomes.title,`<div class="act-outcomes_component">${data.outcomes.cards.map(c=>`<article class="act-outcomes_card"><img class="act-outcomes_icon" src="${esc(c.image)}" alt="" aria-hidden="true" loading="lazy"><div class="text-size-body text-color-secondary">${rich(c.body)}</div></article>`).join('')}</div>`,{tone:'is-accent-section'}));
  sections.push(section('program',data.program.title,`<div class="act-program_component" data-accordion>${data.program.modules.map(m=>{
    const title=m.head.find(a=>!/^\d|модуль|экзамен|сессия|включает/i.test(a.text))?.text||m.head.find(a=>a.text.length>35)?.text;
    const hours=m.head.find(a=>/академ/.test(a.text))?.text||'';
    const note=(m.number===4?'Экзамен':'')+m.head.filter(a=>/Включает|Сессия|Экзамен/.test(a.text)).map(a=>a.text).join(' · ');
    const body=m.body.flatMap(b=>b.texts).sort((a,b)=>Math.abs(a.y-b.y)<16?a.x-b.x:a.y-b.y);
    const rows=body.map(a=>({html:rich(a.html),x:a.x,y:a.y}));
    return `<details class="act-program_item" data-accordion-item><summary class="act-program_summary" data-accordion-trigger><span class="act-program_number text-size-body text-weight-medium">${m.number} модуль</span><span class="act-program_title"><h3 class="text-size-block-title">${text(title)}</h3>${note?`<span class="text-size-note text-color-secondary">${text(note)}</span>`:''}</span><span class="act-program_hours text-size-note text-color-secondary">${text(hours)}</span><span class="act-toggle_component" aria-hidden="true"><span class="act-toggle_symbol">+</span></span></summary><div class="act-program_panel" data-accordion-panel><div class="act-program_inner text-size-note" data-accordion-panel-inner>${programBody(m)}</div></div></details>`;
  }).join('')}</div>`,{id:'rec781271521',description:data.program.description}));
  const trialTitle='Получите бесплатный доступ к лекциям, по которым учатся студенты курса';
  sections.push(section('trial',trialTitle,`<div class="act-trial-lectures_component"><article class="act-trial-lectures_copy"><h3 class="text-size-block-title">Знакомство с АСТ: две вводные лекции</h3><p class="text-size-body text-color-secondary">Две лекции о терапии принятия и ответственности: как устроен подход и как сегодня по международным стандартам выглядит профессиональное обучение АСТ.</p><ul class="act-trial-lectures_list text-size-note" role="list">${['Доступ сразу — бесплатно','Смотреть можно в любом порядке и темпе','Доступ к материалам на 7 дней'].map(t=>`<li class="act-trial-lectures_item">${icon()}<span>${t}</span></li>`).join('')}</ul><div class="act-trial-lectures_note text-size-body">Лекции читают преподаватели программы<br><span class="text-weight-medium">«АСТ: Терапия принятия и ответственности»</span></div><button class="button is-lg" type="button" data-open-trial>Получить доступ</button></article><div class="act-trial-lectures_media"><img class="act-trial-lectures_image" src="${esc(data.trialImage)}" alt="Карточка с двумя лекциями курса" loading="lazy"></div></div>`,{id:'rec2371385461'}));
  sections.push(section('teachers',data.teachers.title,`<div class="act-teachers_component" data-teacher-tabs><div class="act-teachers_tabs" role="tablist" aria-label="Преподаватели">${data.teachers.items.map((teacher,i)=>`<button class="act-teachers_tab text-size-body${i===0?' is-active':''}" type="button" role="tab" id="act-teacher-tab-${i}" aria-controls="act-teacher-${i}" aria-selected="${i===0}" tabindex="${i===0?'0':'-1'}" data-teacher-tab="${i}">${text(teacher.name)}</button>`).join('')}</div><div class="act-teachers_panels">${data.teachers.items.map((teacher,i)=>`<article class="act-teachers_panel" role="tabpanel" id="act-teacher-${i}" aria-labelledby="act-teacher-tab-${i}"${i?' hidden':''}><img class="act-teachers_photo" src="${esc(teacher.image)}" alt="${text(teacher.name)}" loading="lazy"><h3 class="text-size-card-title">${text(teacher.name)}</h3><div class="text-size-body text-color-secondary">${rich(teacher.bio)}</div></article>`).join('')}</div></div>`,{description:data.teachers.description}));
  const diplomaTexts=data.diploma.texts;
  const diplomaTitle=diplomaTexts.find(a=>a.text.startsWith('Выдаём'))?.text||diplomaTexts[0].text;
  sections.push(section('diploma',diplomaTitle,`<div class="act-diploma_component"><div class="act-diploma_copy"><h2 class="text-size-section-title" id="act-diploma-heading">${text(diplomaTitle)}</h2>${diplomaTexts.filter(a=>a.text!==diplomaTitle).map(a=>`<div class="text-size-body text-color-secondary">${rich(a.html)}</div>`).join('')}</div><img class="act-diploma_image" src="${esc(data.diploma.image)}" alt="Диплом о профессиональной переподготовке Академии современной психологии" loading="lazy"></div>`,{header:false}));
  sections.push(section('reviews',data.reviews.title,`<div class="act-reviews_component"><div class="act-reviews_track" data-review-track tabindex="0" aria-label="Видеоотзывы выпускников">${data.reviews.items.map(r=>`<article class="act-reviews_card">${embed(r.video,r.name,r.poster,true)}<div class="act-reviews_copy"><h3 class="text-size-block-title">${text(r.name)}</h3>${r.body?`<div class="text-size-note text-color-secondary">${rich(r.body)}</div>`:''}</div></article>`).join('')}</div><div class="act-reviews_controls"><button class="button is-md is-secondary is-icon-only" type="button" data-reviews-prev aria-label="Предыдущие отзывы">←</button><button class="button is-md is-secondary is-icon-only" type="button" data-reviews-next aria-label="Следующие отзывы">→</button></div></div>`));
  sections.push(section('why',data.why.title,`<div class="act-why_component">${data.why.cards.map(c=>card(c)).join('')}</div>`));
  const lead=renderLeadForm(leadForm.copy,{id:leadForm.formId}).replace('data-academy-lead-form','data-academy-lead-form data-act-local-lead');
  sections.push(section('lead',leadForm.copy.heading,lead,{id:'act-lead',header:false}));
  sections[sections.length-1].html=sections[sections.length-1].html.replace('aria-labelledby="act-lead-heading"',`aria-labelledby="${esc(leadForm.formId)}-heading"`);
  sections.push({key:'faq',title:data.faq.heading,html:renderCourseFaq(data.faq)});
  const dialog=`<dialog class="act-dialog_component" id="act-trial-dialog" aria-labelledby="act-trial-dialog-heading"><button class="act-dialog_close button is-secondary is-md is-icon-only" type="button" data-close-trial aria-label="Закрыть">×</button><h2 class="act-dialog_heading text-size-card-title" id="act-trial-dialog-heading">Посмотрите две лекции бесплатно</h2><p class="act-dialog_description text-size-body text-color-secondary">Вышлем доступ к лекциям на почту. Лекции будут открыты в течение 7 дней.</p>${trialForm('act-trial-form')}</dialog>`;
  return {sections,dialog};
}
