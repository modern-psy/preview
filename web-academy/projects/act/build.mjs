import {readFile,writeFile,mkdir,copyFile,readdir,unlink} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderSections} from './render-sections.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const preview=path.resolve(here,'../../..');
const output=path.join(preview,'act');
const approved=path.join(preview,'act-hero-variants');
const academy=path.resolve(here,'../../shared/academy');
const content=JSON.parse(await readFile(path.join(here,'data/content.json'),'utf8'));
const leadCopy=JSON.parse(await readFile(path.join(here,'data/lead-form.json'),'utf8'));
const formContract=JSON.parse(await readFile(path.join(here,'data/form-contract.json'),'utf8'));
if(formContract.transportEnabled)throw new Error('Локальная сборка ACT не должна подключать отправку заявок');
const original=await readFile(path.join(approved,'index.html'),'utf8');
const hero=original.match(/<section class="section_hero"[\s\S]*?<\/section>/)[0];
const approvedPricing=original.slice(original.indexOf('<section class="section_pricing"'),original.indexOf('</main>'));
const paymentTerms=approvedPricing.match(/<section class="price-terms_component"[\s\S]*?<\/section>/)?.[0];
if(!paymentTerms)throw new Error('Не найден согласованный блок условий оплаты');
const pricing=approvedPricing.replace(paymentTerms,'');
const snapshot=original.match(/<script type="application\/json" data-price-snapshot>[\s\S]*?<\/script>/)[0];
const {sections,dialog}=renderSections(content,{formId:formContract.formId,copy:{...leadCopy,...formContract.consent,nativeMarker:formContract.previewMarker}});
const normalized=html=>html.replaceAll('/act-hero-variants/','/act/').replaceAll('src="assets/','src="/act/assets/').replaceAll('https://modern-psy.ru/act#rec2371385461','#rec2371385461').replaceAll('https://modern-psy.ru/act#rec781271521','#rec781271521');
sections.unshift({key:'hero',title:'Первый экран',html:hero.replace('class="section_hero"','class="section_hero" data-act-section="hero"')});
sections.splice(sections.findIndex(s=>s.key==='lead'),0,{key:'pricing',title:'Стоимость обучения',html:pricing.replace('class="section_pricing"','class="section_pricing" data-act-section="pricing"')});
const termsContent=paymentTerms.replace(/^<section /,'<div ').replace(/<\/section>$/,'</div>').replace('<h3 ','<h2 ').replace('</h3>','</h2>');
sections.splice(sections.findIndex(s=>s.key==='lead')+1,0,{key:'terms',title:'Гибкие условия оплаты',html:`<section class="section_terms" id="act-payment-terms" data-act-section="terms" aria-labelledby="act-terms-heading"><div class="padding-global"><div class="container-large"><div class="padding-section-small">${termsContent}</div></div></div></section>`});
for(const s of sections)s.html=normalized(s.html);
await Promise.all([mkdir(path.join(output,'assets'),{recursive:true}),mkdir(path.join(output,'icons'),{recursive:true}),mkdir(path.join(output,'sections'),{recursive:true}),mkdir(path.join(here,'sections'),{recursive:true})]);
await mkdir(path.join(output,'assets/icons'),{recursive:true});
for(const name of ['form-error.svg','form-success.svg'])await copyFile(path.resolve(academy,'../../projects/psychologist-consultant/assets/icons',name),path.join(output,'assets/icons',name));
for(const name of ['system.css','page.css'])await copyFile(path.join(approved,name),path.join(output,name));
for(const name of await readdir(path.join(approved,'assets')))await copyFile(path.join(approved,'assets',name),path.join(output,'assets',name));
for(const name of await readdir(path.join(approved,'icons')))await copyFile(path.join(approved,'icons',name),path.join(output,'icons',name));
for(const name of ['cms-model.mjs','price-model.mjs','price-client.mjs','tariff-content.mjs','course-cms.mjs'])await writeFile(path.join(output,name),normalized(await readFile(path.join(approved,name),'utf8')));
// CMS обновляет только цену. Условия оплаты — самостоятельная секция после формы.
const priceModelPath=path.join(output,'price-model.mjs');
const priceModelSource=await readFile(priceModelPath,'utf8');
if((priceModelSource.match(/\$\{renderTerms\(\)\}/g)||[]).length!==1)throw new Error('Изменился контракт блока цены: проверьте отделение условий оплаты');
await writeFile(priceModelPath,priceModelSource.replace('${renderTerms()}',''));
// В отдельном просмотре цены нет Hero, но цена всё равно обновляется из CMS.
const cmsPath=path.join(output,'course-cms.mjs');
await writeFile(cmsPath,(await readFile(cmsPath,'utf8'))+`\nif(!root && document.querySelector('[data-cms-price]')){fetch(API+'/api/public/course/'+SLUG,{signal:AbortSignal.timeout(8000)}).then(response=>{if(!response.ok)throw new Error('CMS');return response.json();}).then(updatePrice).catch(()=>{document.querySelector('[data-cms-price]').dataset.cmsState='fallback';});}\n`);
for(const name of ['course.css','course.js'])await copyFile(path.join(here,name),path.join(output,name));
// Общие стили формы собираются из библиотеки. Тема ограничена секцией, чтобы остальные блоки не менялись.
const academyCss=await readFile(path.join(academy,'components.css'),'utf8');
const academyRoles=academyCss.match(/^\.academy-page \{([\s\S]*?)\n\}/)[1].match(/--[\w-]+\s*:[\s\S]*?;/g).join('\n');
const formStyles=await Promise.all(['lead-form.css','lead-form-responsive.css','button.css','section-heading.css'].map(name=>readFile(path.join(academy,name),'utf8')));
await writeFile(path.join(output,'lead-form.css'),`.section_lead {\n${academyRoles}\n}\n`+formStyles.join('\n'));
await copyFile(path.join(academy,'lead-form.js'),path.join(output,'lead-form.js'));
// Берём из общей базы только FAQ, аккордеон и его сетку; соседние блоки не меняются.
const faqBase=academyCss.slice(academyCss.indexOf('.accordion_component {'),academyCss.indexOf('.academy-showcase_component {'));
const faqGrid=academyCss.slice(academyCss.indexOf('.academy-page .container-xlarge {'),academyCss.indexOf('.section_hero {'));
const faqDesktop=academyCss.slice(academyCss.indexOf('  .faq_component {'),academyCss.indexOf('  .section-heading_component:not',academyCss.indexOf('  .faq_component {')));
const gridDesktop=academyCss.slice(academyCss.indexOf('  .column-grid_component {'),academyCss.indexOf('  .price-panel_component {',academyCss.indexOf('  .column-grid_component {')));
const reducedMotion=academyCss.slice(academyCss.indexOf('@media (prefers-reduced-motion: reduce) {'),academyCss.indexOf('/* Complete showcase and described CTA variants. */'));
const faqStyles=await Promise.all(['toggle-icon.css','faq-responsive.css','body-text.css','section-spacing.css','section-heading.css'].map(name=>readFile(path.join(academy,name),'utf8')));
await mkdir(path.join(output,'assets/academy'),{recursive:true});
await copyFile(path.join(academy,'assets/disclosure-cross.svg'),path.join(output,'assets/academy/disclosure-cross.svg'));
await writeFile(path.join(output,'faq.css'),(`.section_faq {\n${academyRoles}\n}\n`+faqGrid+faqBase+'\n@media (min-width:48rem) {\n'+faqDesktop+'}\n@media (min-width:64.0625rem) {\n'+gridDesktop+'}\n'+reducedMotion+faqStyles.join('\n')).replaceAll("./assets/disclosure-cross.svg","/act/assets/academy/disclosure-cross.svg"));
for(const [source,name] of [['components.js','academy-components.js'],['anchor-scroll.js','anchor-scroll.js']])await copyFile(path.resolve(here,'../../shared/academy',source),path.join(output,name));
const renderPage=(html,title,{tools='',section=false}={})=>`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title} · ACT</title><meta name="description" content="Локальный просмотр ACT в стилях Web Academy"><link rel="canonical" href="https://modern-psy.ru/act"><link rel="stylesheet" href="/act/system.css"><link rel="stylesheet" href="/act/page.css"><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@29.1.2/dist/css/intlTelInput.css"><link rel="stylesheet" href="/act/lead-form.css"><link rel="stylesheet" href="/act/faq.css"><link rel="stylesheet" href="/act/course.css"></head><body class="act-page"><div class="page-wrapper">${tools}<main class="main-wrapper academy-page act-course-page" data-academy-anchor-scroll>${html}</main>${dialog}</div>${snapshot}<script type="module" src="/act/course-cms.mjs"></script><script src="/act/academy-components.js" defer></script><script src="/act/anchor-scroll.js" defer></script><script src="https://cdn.jsdelivr.net/npm/intl-tel-input@29.1.2/dist/js/intlTelInput.min.js" defer></script><script src="/act/lead-form.js" defer></script><script src="/act/course.js" defer></script></body></html>`;
await writeFile(path.join(output,'index.html'),renderPage(sections.map(s=>s.html).join('\n'),'АСТ: Терапия принятия и ответственности'));
const manifest=sections.map((s,i)=>({number:i+1,key:s.key,title:s.title,file:`${String(i+1).padStart(2,'0')}-${s.key}.html`,source:content.source}));
// Удаляем только устаревшие нумерованные модули этой сборки после перестановки секций.
for(const directory of [path.join(here,'sections'),path.join(output,'sections')]){
  for(const file of await readdir(directory))if(/^\d{2}-[a-z-]+\.html$/.test(file)&&!manifest.some(s=>s.file===file))await unlink(path.join(directory,file));
}
for(let i=0;i<sections.length;i++){
  const s=sections[i],file=manifest[i].file;
  await writeFile(path.join(here,'sections',file),`<!-- Секция ${String(i+1).padStart(2,'0')}: ${s.title} -->\n${s.html}\n`);
  const tools=`<nav class="act-section-preview_nav" aria-label="Просмотр секций"><a class="button is-sm is-secondary" href="/act/sections/">Все секции</a><a class="button is-sm is-secondary" href="/act/">Лендинг целиком</a>${i?`<a class="button is-sm is-secondary" href="${manifest[i-1].file}">← Предыдущая</a>`:''}${i+1<sections.length?`<a class="button is-sm" href="${manifest[i+1].file}">Следующая →</a>`:''}<span class="text-size-note">${i+1}/${sections.length} · ${s.title}</span></nav>`;
  const standalone=s.html.replace(/href="#(rec2371385461|rec781271521)"/g,'href="/act/#$1"');
  await writeFile(path.join(output,'sections',file),renderPage(standalone,s.title,{tools,section:true}));
}
await writeFile(path.join(output,'sections','index.html'),renderPage(`<div class="padding-global"><div class="container-large"><div class="act-section-index_component"><h1 class="text-size-section-title">ACT · секции по отдельности</h1><a class="text-link text-size-body" href="/act/">Лендинг целиком</a>${manifest.map(s=>`<a class="text-link text-size-body" href="${s.file}">${s.number}. ${s.title}</a>`).join('')}</div></div></div>`,'Секции'));
await writeFile(path.join(output,'sections.json'),JSON.stringify(manifest,null,2)+'\n');
await writeFile(path.join(here,'COMPONENTS.md'),'# Секции ACT\n\n'+manifest.map(s=>`${s.number}. ${s.title} — sections/${s.file}`).join('\n')+'\n\nHero и цена: согласованный проект act-hero-variants. Прочие композиции: текущий ACT. FAQ: shared/academy/faq-render.mjs и исходные вопросы/ответы data/content.json. Условия оплаты — отдельная секция после формы; CMS обновляет только карточки цен над формой. Поведение аккордеонов: shared/academy/components.js; якоря: shared/academy/anchor-scroll.js. Форма заявки: shared/academy/lead-form-render.mjs, lead-form.css и lead-form.js; тексты и локальный контракт — data/lead-form.json и data/form-contract.json. Локальные адаптеры преподавателей, видео и бесплатного окна: course.js. Тильда в этой сборке не меняется.\n');
console.log(JSON.stringify({output,sections:manifest.length,videos:content.community.videos.length+content.reviews.items.length,teachers:content.teachers.items.length,faq:content.faq.items.length},null,2));
