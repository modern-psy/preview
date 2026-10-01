import fs from 'node:fs/promises';
import './teacher-card.js';

// Build-time catalog; course rosters remain independently editable Tilda modules.
export async function selectTeachers(ids, {overrides = {}, catalog} = {}) {
  const data = catalog || JSON.parse(await fs.readFile(new URL('./teachers-catalog.json', import.meta.url), 'utf8'));
  const selected = ids.map(id => {
    const profile = data.profiles.find(item => item.record.id === id);
    if (!profile) throw new Error(`Unknown teacher: ${id}`);
    return {...profile.record, ...overrides[id], id};
  });
  return globalThis.AcademyTeacherCard.validate(selected);
}

export function renderTeachersData(records, id) {
  if (!/^[a-z][a-z0-9-]*$/.test(id)) throw new Error('Invalid teacher config id');
  const safe = JSON.stringify(globalThis.AcademyTeacherCard.validate(records), null, 2).replace(/</g, '\\u003c');
  return `<script type="application/json" id="${id}">\n${safe}\n</script>\n`;
}

export function parseTeachersData(html, id) {
  if (!/^[a-z][a-z0-9-]*$/.test(id)) throw new Error('Invalid teacher config id');
  const match = html.match(new RegExp(`<script\\s+type="application/json"\\s+id="${id}">([\\s\\S]*?)<\\/script>`));
  if (!match) throw new Error(`Missing teacher data: ${id}`);
  return globalThis.AcademyTeacherCard.validate(JSON.parse(match[1]));
}
