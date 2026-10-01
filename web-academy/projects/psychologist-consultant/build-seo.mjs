import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const root = new URL('./', import.meta.url);
const read = name => fs.readFile(new URL(name, root), 'utf8');
const readJson = async name => JSON.parse(await read(`data/${name}.json`));
const [seo, contract, pricing, program, faq, assets, teacherHtml, html] = await Promise.all([
  readJson('seo'), readJson('form-contract'), readJson('pricing'), readJson('program'),
  readJson('faq'), readJson('assets'), read('teachers/data.html'), read('index.html'),
]);
const teachers = JSON.parse(teacherHtml.match(/<script\b[^>]*id="consultant-teachers-data"[^>]*>([\s\S]*?)<\/script>/)[1]);
const clean = text => text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;|\u00a0/g, ' ').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const url = contract.reuse.destination_page;
const site = seo.organization.url;
const id = fragment => `${url}#${fragment}`;
const ref = value => ({'@id': value});
const organizationId = `${site}#organization`;
const teacherId = teacher => `${site}#${teacher.id}`;
const hero = assets.find(asset => asset.id === 'psychology-hero');
const offers = pricing.streams.flatMap(stream => pricing.plans.map(plan => ({
  '@type': 'Offer', '@id': id(`offer-${stream.id}-${plan.id}`),
  name: `${plan.name} — ${stream.label.toLowerCase()}`,
  description: `${plan.description} Полная стоимость при оплате одним платежом.`,
  url: `${url}#pricing`, price: plan.prices[stream.id].total, priceCurrency: 'RUB',
  seller: ref(organizationId), itemOffered: ref(id('course')),
})));
const instances = pricing.streams.map(stream => ({
  '@type': 'CourseInstance', '@id': id(`stream-${stream.id}`),
  name: `${seo.course.name} — ${stream.label.toLowerCase()}`,
  description: stream.start, courseMode: 'online', inLanguage: 'ru-RU',
  duration: seo.course.duration, courseWorkload: seo.course.workload,
  location: {'@type': 'VirtualLocation', url}, organizer: ref(organizationId),
  instructor: teachers.map(teacher => ref(teacherId(teacher))),
  offers: pricing.plans.map(plan => ref(id(`offer-${stream.id}-${plan.id}`))),
}));
const syllabus = program.stages.slice(0, -1).map((stage, index) => ({
  '@type': 'Syllabus', '@id': id(`syllabus-${index + 1}`),
  name: clean(stage.heading), description: clean(stage.description),
  position: index + 1, inLanguage: 'ru-RU',
}));
const graph = [
  {'@type': 'EducationalOrganization', '@id': organizationId, ...seo.organization,
    contactPoint: {'@type': 'ContactPoint', contactType: 'отдел продаж', telephone: seo.organization.telephone, email: seo.organization.email, availableLanguage: 'ru'}},
  {'@type': 'WebSite', '@id': `${site}#website`, url: site, name: seo.organization.name, inLanguage: 'ru-RU', publisher: ref(organizationId)},
  {'@type': 'WebPage', '@id': id('webpage'), url, name: seo.title, description: seo.description,
    inLanguage: 'ru-RU', isPartOf: ref(`${site}#website`), publisher: ref(organizationId),
    mainEntity: ref(id('course')), primaryImageOfPage: ref(id('hero-image')),
    breadcrumb: ref(id('breadcrumb')), hasPart: ref(id('faq'))},
  {'@type': 'ImageObject', '@id': id('hero-image'), contentUrl: hero.url, url: hero.url, width: hero.width, height: hero.height},
  {'@type': 'BreadcrumbList', '@id': id('breadcrumb'), itemListElement: [
    {'@type': 'ListItem', position: 1, name: seo.organization.name, item: site},
    {'@type': 'ListItem', position: 2, name: seo.course.name, item: url},
  ]},
  {'@type': 'Course', '@id': id('course'), url, name: seo.course.name,
    description: seo.description, inLanguage: 'ru-RU', provider: ref(organizationId),
    mainEntityOfPage: ref(id('webpage')), image: ref(id('hero-image')),
    educationalLevel: 'Профессиональная переподготовка',
    coursePrerequisites: seo.course.prerequisites,
    educationalCredentialAwarded: ref(id('diploma')),
    teaches: syllabus.map(stage => stage.description),
    syllabusSections: syllabus.map(stage => ref(stage['@id'])),
    hasCourseInstance: instances.map(instance => ref(instance['@id'])),
    offers: offers.map(offer => ref(offer['@id']))},
  {'@type': 'EducationalOccupationalProgram', '@id': id('professional-program'),
    name: `Профессиональная переподготовка «${seo.course.name}»`, url,
    description: seo.description, provider: ref(organizationId),
    educationalProgramMode: 'online', timeToComplete: seo.course.duration,
    occupationalCategory: seo.course.qualification, programPrerequisites: seo.course.prerequisites,
    educationalCredentialAwarded: ref(id('diploma')), hasCourse: ref(id('course')),
    offers: offers.map(offer => ref(offer['@id']))},
  {'@type': 'EducationalOccupationalCredential', '@id': id('diploma'),
    name: seo.course.credential, credentialCategory: 'Профессиональная переподготовка',
    description: 'После успешного завершения программы вы получаете диплом о профессиональной переподготовке и квалификацию психолога-консультанта.'},
  ...instances, ...offers, ...syllabus,
  ...teachers.map(teacher => ({'@type': 'Person', '@id': teacherId(teacher),
    name: teacher.name, description: teacher.description,
    ...(teacher.tag ? {jobTitle: teacher.tag} : {}),
    ...(teacher.photo ? {image: teacher.photo} : {}),
  })),
  {'@type': 'FAQPage', '@id': id('faq'), url: `${url}#faq`, inLanguage: 'ru-RU',
    isPartOf: ref(id('webpage')), mainEntity: faq.items.map(item => ({
      '@type': 'Question', name: clean(item.question),
      acceptedAnswer: {'@type': 'Answer', text: clean(item.answer.join(' '))},
    }))},
];
const ids = new Set(graph.map(node => node['@id']));
assert.equal(ids.size, graph.length, 'Duplicate graph IDs');
function check(value) {
  if (Array.isArray(value)) return value.forEach(check);
  if (value && typeof value === 'object') {
    if (Object.keys(value).length === 1 && value['@id']) assert(ids.has(value['@id']), `Unresolved reference: ${value['@id']}`);
    Object.values(value).forEach(check);
  } else if (typeof value === 'string') assert(value.trim(), 'Empty schema value');
}
check(graph);
const pageText = clean(html);
for (const teacher of teachers) {
  assert(pageText.includes(clean(teacher.name)), `Teacher missing from HTML: ${teacher.name}`);
  assert(pageText.includes(clean(teacher.description)), `Teacher description missing: ${teacher.name}`);
}
for (const item of faq.items) {
  assert(pageText.includes(clean(item.question)), 'FAQ question differs from page');
  assert(pageText.includes(clean(item.answer.join(' '))), 'FAQ answer differs from page');
}
for (const stage of syllabus) assert(pageText.includes(stage.description), 'Syllabus differs from page');
for (const offer of offers) assert(pageText.replace(/ /g, '').includes(`${offer.price}₽`), 'Offer price differs from page');
const payload = JSON.stringify({'@context': 'https://schema.org', '@graph': graph}, null, 2).replaceAll('<', '\\u003c');
JSON.parse(payload);
const schema = `<script type="application/ld+json">\n${payload}\n</script>\n`;
assert(schema.length < 65000, 'Schema exceeds Tilda fragment limit');
await fs.writeFile(new URL('schema.ld', root), schema);
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const tags = [
  ['og:title', seo.og_title], ['og:description', seo.og_description],
  ['og:type', 'website'], ['og:url', url], ['og:site_name', seo.organization.name],
  ['og:locale', 'ru_RU'], ['og:image', hero.url], ['og:image:width', String(hero.width)],
  ['og:image:height', String(hero.height)], ['og:image:alt', 'Онлайн-обучение по программе «Психолог-консультант» Академии Современной Психологии'],
].map(([property, value]) => `    <meta property="${property}" content="${escape(value)}">`).join('\n');
let nextHtml = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(seo.title)}</title>`)
  .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escape(seo.description)}">`);
const region = `    <!-- seo-og:start -->\n${tags}\n    <!-- seo-og:end -->`;
nextHtml = nextHtml.includes('<!-- seo-og:start -->')
  ? nextHtml.replace(/    <!-- seo-og:start -->[\s\S]*?<!-- seo-og:end -->/, region)
  : nextHtml.replace(/(    <meta name="description"[^>]*>)/, `$1\n${region}`);
if (nextHtml !== html) await fs.writeFile(new URL('index.html', root), nextHtml);
console.log(`SEO: ${graph.length} nodes, ${teachers.length} teachers, ${instances.length} streams, ${offers.length} offers, ${syllabus.length} syllabus sections, ${faq.items.length} FAQ; ${schema.length} characters.`);
