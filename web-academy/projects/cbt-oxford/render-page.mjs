import fs from 'node:fs/promises';
import {renderHeroSection, replaceHeroRegion} from '../../shared/academy/hero-render.mjs';
import {renderRecognition} from '../../shared/academy/recognition-render.mjs';
import {renderCourseAudience} from '../../shared/academy/course-audience-render.mjs';
import {renderRatings} from '../../shared/academy/ratings-render.mjs';
import {renderPracticeStories} from '../../shared/academy/practice-stories-render.mjs';

import {renderShowcaseTabs} from '../../shared/academy/showcase-tabs-render.mjs';
import {renderLearningTimeline} from '../../shared/academy/learning-timeline-render.mjs';
import {renderTeachersSection} from '../../shared/academy/teachers-render.mjs';
import {parseTeachersData} from '../../shared/academy/teachers-catalog.mjs';
import {renderTabMedia} from './render-tab-media.mjs';
import {renderLowerSections} from './render-lower-sections.mjs';

const root = new URL('./', import.meta.url);
const read = async name => JSON.parse(await fs.readFile(new URL(`data/${name}.json`, root), 'utf8'));
export async function renderPage() {
  const [hero, assets, actions, recognition, audience, ratings, stories] = await Promise.all(['hero', 'assets', 'actions', 'recognition', 'course-audience', 'ratings', 'practice-stories'].map(read));
  const tabs = await read('showcase-tabs');
  const timeline = await read('learning-timeline');
  const teacherCopy = await read('teachers-section');
  const teacherData = await fs.readFile(new URL('teachers/data.html', root), 'utf8');
  const teachers = parseTeachersData(teacherData, 'oxford-teachers-data');
  let html = await fs.readFile(new URL('index.html', root), 'utf8');
  html = replaceHeroRegion(html, renderHeroSection(hero, {assets, actions}));
  for (const [name, markup] of [
    ['recognition', renderRecognition(recognition, {id: 'recognition', columns: 3, width: 'full'})],
    ['course-audience', renderCourseAudience(audience)],
    ['ratings', renderRatings(ratings)],
    ['practice-stories', renderPracticeStories(stories)],
    ['showcase-tabs', renderShowcaseTabs(tabs, {id: 'oxford-model', renderMedia: renderTabMedia})],
    ['learning-timeline', renderLearningTimeline(timeline, {id: 'cbt-oxford-program'})],
    ...await renderLowerSections(),
    ['teachers', renderTeachersSection(teacherCopy, teachers, {instanceId:'oxford-teachers', configId:'oxford-teachers-data'})],
    ['teachers-data', teacherData.trim()],
  ]) {
    const start = `<!-- ${name}:start -->`, end = `<!-- ${name}:end -->`;
    if (html.split(start).length !== 2 || html.split(end).length !== 2 || html.indexOf(end) < html.indexOf(start)) throw new Error(`Invalid ${name} markers`);
    const a = html.indexOf(start), b = html.indexOf(end) + end.length;
    html = html.slice(0, a) + `${start}\n${markup}\n${end}` + html.slice(b);
  }
  await fs.writeFile(new URL('index.html', root), html);
  return html;
}
if (process.argv[1] && new URL(process.argv[1], 'file:').href === import.meta.url) await renderPage();
