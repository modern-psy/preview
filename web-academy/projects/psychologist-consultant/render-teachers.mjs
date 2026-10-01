import fs from 'node:fs/promises';
import {renderTeachersSection} from '../../shared/academy/teachers-render.mjs';

const root = new URL('./', import.meta.url);
export const dataModule = await fs.readFile(new URL('teachers/data.html', root), 'utf8');
const json = dataModule.match(/<script\b[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/)?.[1];
if (!json) throw new Error('Missing teachers/data.html JSON module.');
export const teachers = globalThis.AcademyTeacherTemplate.validate(JSON.parse(json));
const config = `<script type="application/json" id="consultant-teachers-data">${JSON.stringify(teachers).replaceAll('<', '\\u003c')}</script>`;
const source = new URL('index.html', root);
const html = await fs.readFile(source, 'utf8');
const copy = JSON.parse(await fs.readFile(new URL('data/teachers-section.json', root), 'utf8'));
const section = renderTeachersSection(copy, teachers, {id: 'teachers', instanceId: 'consultant-teachers', configId: 'consultant-teachers-data', assetsId: 'consultant-teacher-assets'});
const markup = `<!-- teachers:start -->\n${config}\n${section}\n<!-- teachers:end -->`;
if (!html.includes('<!-- teachers:start -->') && !html.includes('<section class="section_diploma')) throw new Error('Missing insertion point for teachers.');
const next = html.includes('<!-- teachers:start -->') ? html.replace(/<!-- teachers:start -->[\s\S]*?<!-- teachers:end -->/, () => markup) : html.replace('<section class="section_diploma', () => `${markup}\n<section class="section_diploma`);
if (next !== html) await fs.writeFile(source, next);
