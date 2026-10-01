import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {selectTeachers, renderTeachersData, parseTeachersData} from '../teachers-catalog.mjs';
const catalog = JSON.parse(await fs.readFile(new URL('../teachers-catalog.json', import.meta.url),'utf8'));
test('Every catalog profile is reusable and retains provenance', async () => {
  const ids = catalog.profiles.map(p=>p.record.id);
  const records = await selectTeachers(ids);
  assert.equal(ids.length,new Set(ids).size);
  assert.equal(records.length,ids.length);
  for (const profile of catalog.profiles) {
    assert.ok(profile.sources.length);
    for (const variant of profile.variants) {
      assert.ok(variant.source);
      globalThis.AcademyTeacherCard.validate([variant.record]);
    }
  }
});
test('Course selection is ordered, independent, and safe in a Tilda JSON module', async () => {
  const records=await selectTeachers(['boris-pashkov','iona-gusachenko'],{overrides:{'boris-pashkov':{description:'</script><script>alert(1)</script>'}}});
  const html=renderTeachersData(records,'example-teachers');
  assert.equal((html.match(/<script/g)||[]).length,1);
  assert.deepEqual(parseTeachersData(html,'example-teachers'),records);
  assert.equal(records[0].id,'boris-pashkov');
  assert.notEqual((await selectTeachers(['boris-pashkov']))[0].description,records[0].description);
  await assert.rejects(selectTeachers(['unknown']));
});
