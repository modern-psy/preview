import {readFile,writeFile,mkdir,readdir,unlink} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {assertResponsiveContract} from '../../shared/academy/responsive.mjs';
import {assertMotionContract} from '../../shared/academy/motion-contract.mjs';
import {scope,cssBlocks,scopedCss,prettyHtml,productionFormScript,productionCourseScript} from './tilda-helpers.mjs';
import {nativeFixture,fixtureRuntimeSource} from './tilda-fixture.mjs';

// Править этот проект и данные. Папка apps/preview/act/tilda/ генерируется целиком.
const here=path.dirname(fileURLToPath(import.meta.url));
const page=path.resolve(here,'../../../act');
const output=path.join(page,'tilda');
const academy=path.resolve(here,'../../shared/academy');
const sections=JSON.parse(await readFile(path.join(page,'sections.json'),'utf8'));
const contract=JSON.parse(await readFile(path.join(here,'data/form-contract.json'),'utf8'));
const actions=JSON.parse(await readFile(path.join(here,'data/tilda-actions.json'),'utf8'));
if(!contract.nativeMarker||contract.nativeForm.markerCount!==1)throw new Error('Не подтверждён единственный marker нативной формы ACT');
const hash=value=>createHash('sha256').update(value).digest('hex');
const files={};
const svg={};
for(const folder of ['icons','assets/icons','assets/academy']){
  for(const name of await readdir(path.join(page,folder))){
    if(name.endsWith('.svg'))svg[`/act/${folder}/${name}`]='data:image/svg+xml;base64,'+(await readFile(path.join(page,folder,name))).toString('base64');
  }
}
const photo='https://static.tildacdn.com/tild6530-6365-4137-b836-353536303230/image_1409.jpg';
const assets=value=>{
  for(const [url,data] of Object.entries(svg))value=value.replaceAll(url,data);
  return value.replaceAll('/act/assets/community.webp',photo);
};
const productionHtml=value=>assets(value)
  .replaceAll('rec2371385461',actions.heroTrial.hash.slice(1)).replaceAll('rec781271521',actions.heroProgram.hash.slice(1))
  .replace(`data-tilda-form-name="${contract.previewMarker}"`,`data-tilda-form-name="${contract.nativeMarker}"`)
  .replace(' data-act-local-lead','')
  .replace('<button class="button is-lg" type="button" data-open-trial>Получить доступ</button>',`<a class="button is-lg" href="${actions.getFreeLectures.hash}" data-tilda-popup-link>Получить доступ</a>`);

await mkdir(output,{recursive:true});
files['head.html']='<!-- Добавить в HEAD страницы. Существующие метатеги, аналитику и шрифты других блоков сохранить. -->\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Wix+Madefor+Text:wght@400;500;600;700&amp;display=swap" rel="stylesheet">\n<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@29.1.2/dist/css/intlTelInput.css">\n';
const bodyNames=[];
for(const section of sections){
  const source=(await readFile(path.join(here,'sections',section.file),'utf8')).replace(/^<!--[\s\S]*?-->\s*/,'').trim();
  const name=`${String(section.number).padStart(2,'0')}-body-${section.key}.html`;
  if(section.key==='pricing'){
    // Блок цены уже стоит на странице (T123 rec4766225501). Его не меняем: здесь та же копия, apps/tilda/pricing-auto/act.html.
    files[name]=`<!-- Секция ${String(section.number).padStart(2,'0')}: ${section.title}. Уже на странице: T123 rec4766225501, не перезаливать. -->\n`+(await readFile(path.resolve(here,'../../../../tilda/pricing-auto/act.html'),'utf8')).trim()+'\n';
    bodyNames.push(name);
    continue;
  }
  const html=`<div class="act-page" data-act-part="${section.key}"><div class="academy-page act-course-page" data-academy-anchor-scroll>${productionHtml(source)}</div></div>`;
  files[name]=`<!-- Секция ${String(section.number).padStart(2,'0')}: ${section.title} -->\n`+prettyHtml(html)+'\n';
  bodyNames.push(name);
}

let css='';
for(const name of ['system.css','page.css','lead-form.css','faq.css','course.css']){
  let source=await readFile(path.join(page,name),'utf8');
  assertResponsiveContract(source,name);
  assertMotionContract(source,name);
  source=source.replace(/\/\*[\s\S]*?\*\//g,'').replace(/@font-face\s*\{[^}]*\}/g,'');
  source=source.replaceAll('button-spin','act-tilda-button-spin').replaceAll('skeleton-shimmer','act-tilda-skeleton-shimmer');
  css+=scopedCss(assets(source))+'\n';
}
css+=scopedCss((await readFile(path.join(academy,'anchor-scroll.css'),'utf8')).replace(/\/\*[\s\S]*?\*\//g,''));
css+=`\n${scope},${scope} > .academy-page{min-height:0;height:auto;box-sizing:border-box}\n`;
css+=`${scope}{font-family:var(--font-family-base)}\n${scope} [data-academy-anchor-scroll]{--anchor-scroll-offset:${actions.anchorOffsetRem}rem}\n${scope} [id]{scroll-margin-top:${actions.anchorOffsetRem}rem}\n`;
// Точечная защита semantic цветов от глобальных !important Тильды.
css+=`${scope} a.button,${scope} button.button{color:var(--text-inverse)!important}\n`;
css+=`${scope} a.button.is-secondary,${scope} button.button.is-secondary{color:var(--accent)!important}\n`;
css+=`${scope} a.act-trial_promo{color:var(--text-heading)!important}\n`;
css+=`${scope} .text-link{color:var(--text-accent)!important}\n`;
css+=`${scope} button.act-teachers_tab{color:var(--text-heading)!important}\n`;
css+=`${scope} .lead-form_control .iti__selected-country{color:var(--color-form-muted)!important}\n`;
css+=`@media(hover:hover) and (pointer:fine){${scope} .text-link:hover{color:var(--accent-hover)!important}}\n`;
css+=`body:has(${scope}) [data-act-native-form-record]{display:none!important}\n`;
let chunk='',part=1;
const styleNames=[];
const flush=()=>{if(!chunk)return;const name=`styles-${part++}.html`;files[name]=`<!-- Общие стили ACT, часть ${part-1}. Вставить один раз в указанном порядке. -->\n<style>\n${chunk}</style>\n`;styleNames.push(name);chunk='';};
for(const block of cssBlocks(css)){
  if(block.length>58000)throw new Error('CSS-блок превышает безопасный лимит T123');
  if(chunk.length+block.length>58000)flush();
  chunk+=block+'\n';
}
flush();

const localPage=await readFile(path.join(page,'index.html'),'utf8');
const snapshot=localPage.match(/<script type="application\/json" data-price-snapshot>[\s\S]*?<\/script>/)?.[0];
if(!snapshot)throw new Error('Нет резервного снимка CMS');
let cms=`(()=>{'use strict';const ACT_ICONS=${JSON.stringify({check:svg['/act/icons/check.svg'],x:svg['/act/icons/x.svg']})};const modules={};\n`;
for(const name of ['cms-model.mjs','tariff-content.mjs','price-model.mjs','price-client.mjs','course-cms.mjs']){
  let source=await readFile(path.join(page,name),'utf8');
  const exports=[...source.matchAll(/export\s+(?:function|const|let|class)\s+(\w+)/g)].map(m=>m[1]);
  source=source.replace(/import\s*\{([^}]+)\}\s*from\s*'\.\/([^']+)'\s*;/g,(_,names,dependency)=>`const {${names}}=modules[${JSON.stringify(dependency)}];`).replace(/\bexport\s+/g,'');
  source=source.replaceAll("/act/icons/${row.included ? 'check' : 'x'}.svg","${row.included ? ACT_ICONS.check : ACT_ICONS.x}");
  cms+=`modules[${JSON.stringify(name)}]=(()=>{\n${assets(source)}\nreturn {${exports.join(',')}};})();\n`;
}
cms+='})();';
const script=(description,code)=>`<!-- ${description} -->\n<script>\n${code.replace(/<\/script/gi,'<\\/script')}\n</script>\n`;
// Данные и обработчик всегда переносятся одним T123: отдельный JSON легко пропустить.
files['footer-cms.html']='<!-- CMS для Hero и цен: вставить весь файл одним T123 после содержательных блоков. Данные и скрипт не разделять. -->\n'+snapshot+'\n'+script('Hero и цены: живая CMS, оба потока, резервный снимок.',cms);
files['footer-components.html']=script('Общий FAQ, аккордеоны и якоря. Один экземпляр на странице.',(await readFile(path.join(academy,'components.js'),'utf8'))+'\n'+await readFile(path.join(academy,'anchor-scroll.js'),'utf8'));
files['footer-course.html']=script('Преподаватели и видео работают во всех отдельных T123.',productionCourseScript(await readFile(path.join(page,'course.js'),'utf8')));
files['footer-form.html']='<!-- После нативного блока ACT. Библиотека телефона закреплена, затем точный bridge marker=act. -->\n<script src="https://cdn.jsdelivr.net/npm/intl-tel-input@29.1.2/dist/js/intlTelInput.min.js"></script>\n'+script('Готовая форма Academy и адаптер штатного MAX Тильды. Без собственного транспорта.',productionFormScript(await readFile(path.join(academy,'lead-form.js'),'utf8'),contract));
const footerNames=['footer-cms.html','footer-components.html','footer-course.html','footer-form.html'];

for(const [name,value] of Object.entries(files)){
  if(value.length>=65000)throw new Error(`${name}: ${value.length} символов, превышен лимит T123`);
  if(/localhost|127\.0\.0\.1|\/act\/assets\/|\/act\/icons\/|(?:src|href)="assets\/|\bimport\s*\{/.test(value))throw new Error(`${name}: осталась локальная зависимость`);
  await writeFile(path.join(output,name),value);
}
const joined=bodyNames.map(name=>files[name]).join('\n');
const ids=[...joined.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
if(ids.length!==new Set(ids).size)throw new Error('Повторный DOM ID между T123');
for(const action of [actions.heroTrial,actions.heroProgram])if(ids.filter(id=>id===action.hash.slice(1)).length!==1)throw new Error('Якорь не существует ровно один раз: '+action.hash);
for(const popup of actions.existingPopupHashes)if(ids.includes(popup.slice(1)))throw new Error('Якорь совпадает с попапом: '+popup);
if(!joined.includes(`data-tilda-form-name="${contract.nativeMarker}"`))throw new Error('Marker формы не совпал с контрактом');
const manifest={format:2,page:'https://modern-psy.ru/act',head:'head.html',styles:styleNames,sections:bodyNames,footer:footerNames,nativeForm:{marker:contract.nativeMarker,recordIdForOperator:contract.nativeForm.recordIdForOperator,requiredSetup:contract.requiredNativeSetup},actions,files:Object.entries(files).map(([name,value])=>({name,characters:value.length,bytes:Buffer.byteLength(value),sha256:hash(value)}))};
await writeFile(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');

const assembledHead=files['head.html']+styleNames.map(name=>files[name]).join('\n');
const assembledFooter=footerNames.map(name=>files[name]).join('\n');
const conflict='<style>body{margin:0}.t-records a{color:#ff8562!important;text-decoration:none}.t-records button{color:#ff8562!important;font-family:Arial}.t-records p{margin:1rem}.t-records ul{padding:2rem}.t-records input{font-family:Arial}.t-rec{display:block}</style>';
const shell=(title,head,body)=>`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title}</title>${head}</head><body><div class="t-records">${body}</div></body></html>`;
await writeFile(path.join(output,'preview.html'),shell('ACT · сборка Tilda', '<style>body{margin:0}</style>'+assembledHead,joined+assembledFooter));
await writeFile(path.join(output,'fixture.html'),shell('ACT · стенд Tilda без отправки',conflict+assembledHead,nativeFixture(contract)+joined+script('Локальный имитатор. В production не переносить.',fixtureRuntimeSource)+assembledFooter));

const keep=new Set([...Object.keys(files),'manifest.json','README.md','FORM-TILDA.md','preview.html','fixture.html']);
for(const name of await readdir(output))if(/\.html$/.test(name)&&!keep.has(name))await unlink(path.join(output,name));
await writeFile(path.join(output,'README.md'),`# ACT · сборка для Тильды\n\nСборка: \`node apps/preview/act/build-tilda.mjs\`. Исходники — web-academy/projects/act. Файлы этой папки вручную не править.\n\n1. В HEAD страницы добавить head.html. Метатеги и аналитику оставить. ${styleNames.join(', ')} вставить отдельными T123 перед Hero, в указанном порядке, с нулевыми внешними полями. Общие стили разбиты с учётом лимита одного поля кода.\n2. Заменить содержательные старые секции файлами 01-body-hero.html … 16-body-faq.html: один файл — один T123. Внешние поля сверху/снизу у каждого T123 поставить 0. Хедер и футер сайта сохранить.\n3. Цены стоят над формой; условия оплаты и скидки — под формой. Отдельный блок двух рассрочек не переносится.\n4. Сохранить нативную форму ACT (подробности в FORM-TILDA.md) после 14-body-lead.html. Перед публикацией добавить в неё поле электронной почты с именем Email. Не удалять получателей и CAPTCHA.\n5. Сохранить существующий попап бесплатных лекций #free-lessons-act и его нативную форму. Кнопка «Получить доступ» открывает этот попап; Hero прокручивает к #act-trial и #act-program.\n6. После всех BODY и нативной формы вставить один раз: ${footerNames.join(', ')} в этом порядке. Старые скрипты ранее вставленных Hero/цен удалить, чтобы CMS не запускалась дважды.\n7. Старый ANNEXX/Нолим T123 rec781266852 (3SzwvUWF), который дублировал диплом, отключить.\n\n## Проверка до публикации\n\npreview.html собран из этих же HEAD, STYLE, BODY и FOOTER. fixture.html дополнительно имитирует стили и нативные события Тильды: реальные заявки он не отправляет. Все ${bodyNames.length} секций отдельные; SVG встроены, фото на постоянном Tilda CDN, Wix — Google Fonts, intl-tel-input — 29.1.2. Hero и цены используют Public API с резервным снимком. Manifest содержит SHA-256 и размеры каждого фрагмента; каждый HTML меньше 65 000 символов.\n\n## Проверка после публикации\n\nУбедиться, что видна одна кастомная форма, а нативный блок с marker act скрыт и остаётся в DOM. Проверить обе ветки MAX/Telegram, CAPTCHA и фактическое поступление тестовых заявок в CRM. Только matching tildaform:aftersuccess показывает успех. Локальный стенд не подтверждает доставку. Проверить оба потока, обе CTA, бесплатный попап, видео, преподавателей и FAQ.\n`);
await writeFile(path.join(output,'FORM-TILDA.md'),`# Нативная форма ACT\n\nИсточник конфигурации — projects/act/data/form-contract.json. На modern-psy.ru/act 14.10.2026 подтверждены marker \`act\`, форма form1084768151 и record rec1084768151; получатели подключены. ID указаны только для поиска в редакторе. Bridge ищет по точному hidden \`tildaspec-formname=act\`, а не по ID.\n\n1. Сохранить существующий нативный блок ACT с его получателями/CRM, CAPTCHA и служебными полями. Удаляется только прежняя видимая обёртка, если она отдельная; сам form block должен остаться в DOM.\n2. В этом же блоке добавить обязательное поле «Электронная почта», тип Email, имя переменной \`Email\`. На исходной опубликованной странице его нет. Без него bridge блокирует отправку и сохраняет введённые данные.\n3. Сохранить поля \`Name\`, \`Phone\`, \`messenger-type\` и \`messenger-id\`. Telegram использует значение \`telegram\`, штатный MAX — \`max_messenger\`. Телефонные result/ISO и штатные маски должны остаться; вручную их не переименовывать.\n4. Hidden marker \`tildaspec-formname\` должен равняться \`act\` ровно в одной нативной форме страницы. Не копировать этот marker в попап бесплатных лекций.\n5. Разместить нативный блок после 14-body-lead.html, до footer-form.html. После загрузки bridge скрывает только его ближайшую .t-rec, оставляя настоящую форму активной.\n6. Опубликовать и проверить поля в DOM, совпадение marker, обе ветки мессенджера и получение заявок у настроенного получателя.\n\nКастомное \`name\` → \`Name\`; \`email\` → \`Email\`; \`phone\` → \`Phone\`; выбранный мессенджер → \`messenger-type\`; только активный контакт → \`messenger-id\`. Предыдущая ветка очищается. Никаких прямых запросов в CRM и копирования ключей формы в пакет нет.\n\nПопап бесплатных лекций: сохранить #free-lessons-act, record rec2371427761 и marker free-psy0. Его transport и выдачу доступа пакет не подменяет.\n`);
console.log(JSON.stringify({output,sections:bodyNames.length,styles:styleNames.length,nativeMarker:contract.nativeMarker,requiredNativeSetup:contract.requiredNativeSetup,files:manifest.files.map(({name,characters})=>({name,characters}))},null,2));
