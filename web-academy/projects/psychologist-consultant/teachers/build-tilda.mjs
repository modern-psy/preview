import fs from 'node:fs/promises';
import {teachers} from '../render-teachers.mjs';

const root = new URL('../', import.meta.url);
const read = (path) => fs.readFile(new URL(path, root), 'utf8');
const json = value => JSON.stringify(value, null, 2).replaceAll('<', '\\u003c');
export const teacherPhotos = {};
export const deliveredTeachers = await Promise.all(teachers.map(async teacher => {
  if (!teacher.photo.startsWith('assets/')) return teacher;
  const bytes = await fs.readFile(new URL(teacher.photo, root));
  teacherPhotos[teacher.id] = `data:image/webp;base64,${bytes.toString('base64')}`;
  return {...teacher, photo: `teacher:${teacher.id}`};
}));
export const teacherDataModule = `<!-- Управление преподавателями. Отдельный T123 перед кодом запуска секции.
Порядок объектов задаёт порядок табов и карточек. Для добавления скопируйте объект,
задайте уникальный id, name, tag, photo (HTTPS) и description.
null в photo показывает инициалы. teacher:... использует фото из HEAD этой сборки.
При замене фото на собственную ссылку удалите необязательное поле crop.
-->\n<script type="application/json" id="consultant-teachers-data">\n${json(deliveredTeachers)}\n</script>\n`;
if (teacherDataModule.length >= 65000) throw new Error('Teacher data exceeds the T123 limit.');
export const teacherAssetsHead = `<script type="application/json" id="consultant-teacher-assets">${json(teacherPhotos)}</script>`;
export const teacherPhotoCss = Object.entries(teacherPhotos).map(([id, source]) => `.teacher-card_image[data-teacher-asset="${id}"]{background:url("${source}") center/cover no-repeat}`).join('\n');
export const teacherCss = (await Promise.all(['teacher-card', 'teachers'].map(name => read(`../../shared/academy/${name}.css`)))).join('\n');
const sharedComponents = await read('../../shared/academy/components.js');
const sliderControls = sharedComponents.match(/\/\/ academy-slider-controls:start\n([\s\S]*?)\/\/ academy-slider-controls:end/)?.[1];
if (!sliderControls) throw new Error('Missing shared reviews slider controls.');
export const teacherRuntime = `${sliderControls}\n${await read('../../shared/academy/teacher-card.js')}\n${await read('../../shared/academy/teachers-template.js')}\n${await read('../../shared/academy/teachers.js')}`;
const html = await read('index.html');
const section = html.match(/<section class="section_teachers\b[\s\S]*?<\/section>/)?.[0];
if (!section) throw new Error('Missing generated teacher section.');
export const teacherSection = section.replace(/<div class="teachers_layout">[\s\S]*?(?=\s*<\/academy-teachers>)/, () => globalThis.AcademyTeacherTemplate.render(deliveredTeachers, 'consultant-teachers'));

// Independent handoff: each T123 is under budget even while the complete landing is not.
const sharedRoot = new URL('../../shared/academy/', root);
const cssFiles = ['components', 'card-spacing', 'review-controls', 'section-spacing', 'body-text', 'section-heading'];
let shared = (await Promise.all(cssFiles.map(name => fs.readFile(new URL(`${name}.css`, sharedRoot), 'utf8')))).join('\n');
for (const match of [...shared.matchAll(/url\(["']?(\.\/assets\/[^"')]+\.svg)["']?\)/g)]) {
  const bytes = await fs.readFile(new URL(match[1], sharedRoot));
  shared = shared.replaceAll(match[0], `url("data:image/svg+xml;base64,${bytes.toString('base64')}")`);
}
const projectCss = await read('styles.css');
const theme = projectCss.match(/\.psychologist-consultant-page\s*\{[^}]*\}/)?.[0];
const font = html.match(/<link rel="stylesheet" href="https:\/\/fonts.googleapis.com[^>]+>/)?.[0];
const splideCss = html.match(/<link rel="stylesheet" href="https:\/\/cdn.jsdelivr.net\/npm\/@splidejs\/splide@[^>]+>/)?.[0];
const sizing = `.psychologist-consultant-page{--section-subtitle-color:#747476}@media(min-width:48rem){.psychologist-consultant-page{--page-padding:1.5rem}}@media(min-width:75rem){.psychologist-consultant-page{--page-padding:5rem}}`;
const head = `${font}\n${splideCss}\n<style>${shared}\n${theme}\n${sizing}\n${teacherCss}\n${teacherPhotoCss}</style>\n${teacherAssetsHead}`;
const body = teacherSection.replace('section_teachers section-spacing_component', 'section_teachers section-spacing_component academy-page psychologist-consultant-page');
const footer = `<script>\n(() => {\nconst start = () => {\n${teacherRuntime}\n};\nif (typeof window.Splide === 'function') start();\nelse { const script = document.createElement('script'); script.src = 'https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js'; script.onload = start; document.head.append(script); }\n})();\n</script>`;
const outputs = {'head.html': head, 'section.html': body, 'data.html': teacherDataModule, 'footer.html': footer};
for (const [name, content] of Object.entries(outputs)) {
  if (content.length >= 65000) throw new Error(`${name} exceeds Tilda limit.`);
  if (/(?:src|href)="(?:\.\.?\/|assets\/)|url\(["']?(?:\.\.?\/|assets\/)/.test(content)) throw new Error(`Local runtime asset in ${name}.`);
}
const boot = `<script>if(new URLSearchParams(location.search).get('js')!=='off'){const s=document.createElement('script');s.textContent=new TextDecoder().decode(Uint8Array.from(atob('${Buffer.from(footer.replace(/^<script>\n?|<\/script>$/g, '')).toString('base64')}'),c=>c.charCodeAt(0)));document.body.append(s)}</script>`;
const preview = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><link rel="icon" href="data:,"><title>Преподаватели — проверка Tilda</title><style>body{margin:0;background:#f5f5f5}a,button{color:red!important}</style>${head}</head><body>${body}${teacherDataModule}${boot}</body></html>`;
outputs['preview.html'] = preview;
await fs.mkdir(new URL('teachers/tilda/', root), {recursive: true});
for (const [name, content] of Object.entries(outputs)) await fs.writeFile(new URL(`teachers/tilda/${name}`, root), content);
console.log(`Teachers: ${teachers.length}; T123 section ${body.length}, data ${teacherDataModule.length}, footer ${footer.length} characters.`);
