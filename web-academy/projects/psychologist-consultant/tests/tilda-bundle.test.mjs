import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {splitTildaStyles} from '../tilda-fragments.mjs';
import {assertResponsiveContract} from '../../../shared/academy/responsive.mjs';

const root = new URL('../', import.meta.url);
const read = (file) => fs.readFile(new URL(file, root), 'utf8');
const readParts = async kind => { const manifest = JSON.parse(await read('tilda/manifest.json')); return (await Promise.all(manifest[`${kind}_files`].map(name => read(`tilda/${name}`)))).join(''); };

test('Delivered CSS and JavaScript share the tablet boundary; stale queries fail the build guard', async () => {
  assertResponsiveContract(await readParts('style'), 'CSS');
  assertResponsiveContract(await readParts('footer'), 'JavaScript');
  for (const query of ['(min-width: 62rem)', '(max-width:991px)', '(max-width:61.999rem)', '(min-width:1024px)', '(max-width:64.0625rem)']) {
    assert.throws(() => assertResponsiveContract(query), /conflicts/);
  }
  assert.doesNotThrow(() => assertResponsiveContract('@media (min-width:64.0625rem){} @media (max-width:64rem){} /* Figma 16:991, anchor 991px */'));
});

test('Tilda fragments are self-contained and their hashes match', async () => {
  const manifest = JSON.parse(await read('tilda/manifest.json'));
  for (const [name, metadata] of Object.entries(manifest.files)) {
    const content = await read(`tilda/${name}`);
    assert.equal(crypto.createHash('sha256').update(content).digest('hex'), metadata.sha256);
    assert.doesNotMatch(content, /localhost|127\.0\.0\.1|(?:src|href)="(?:\.\.?\/|assets\/)/);
    assert.doesNotMatch(content, /figma\.com\/api\/mcp\/asset/);
  }
  const body = await readParts('body');
  for (const name of Object.keys(manifest.files)) assert.ok((await read(`tilda/${name}`)).length < 65000, name);
  assert.equal(body.split('\n').length, 1);
  assert.equal((body.match(/data-tilda-page-part=/g) || []).length, manifest.body_files.length);
  assert.equal((body.match(/id="main-content"/g) || []).length, 1);
  assert.equal(((await read('tilda/preview.html')).match(/<main\b/g) || []).length, 1);
  assert.equal((body.match(/<h1\b/g) || []).length, 1);
  assert.match(await readParts('style'), /data:image\/svg\+xml;base64,/);
  assert.match(body, /\u00a0/);
  assert.match(body, /data-cta-grid-highlights/);
  assert.equal((body.match(/class="cta_grid-image"/g) || []).length, 3);
  assert.match(await readParts('style'), /\.cta_grid-image\{background:url\("data:image\/svg\+xml;base64,/);
  assert.match(body, /class="ratings_component"/);
  assert.match(await readParts('style'), /\.ratings_layout\s*\{/);
  assert.match(body, /hero_component is-dual-action/);
  assert.match(await readParts('style'), /\.hero_component\.is-dual-action \.hero_media/);
  assert.match(body, /academy-showcase_layout/);
  assert.match(await readParts('style'), /\.academy-showcase_layout\s*\{/);
  assert.doesNotMatch(body, /consultant-hero_|consultant-academy_layout|consultant-audience_cta/);
});

test('Tilda form delivery retains its contract and loads the phone library before the bridge', async () => {
  const body = await readParts('body');
  const head = await read('tilda/head.html');
  const footer = await readParts('footer');
  const contract = JSON.parse(await read('data/form-contract.json'));
  assert.match(body, /data-academy-lead-form/);
  assert.ok(body.includes(`data-tilda-form-name="${contract.native_tilda_form.discovery.value}"`));
  assert.match(body, /data-lead-success\s+hidden/);
  assert.match(head, /intl-tel-input@29\.1\.2\/dist\/css\/intlTelInput\.css/);
  assert.doesNotMatch(head, /url\(["']?\.\/?assets\//);
  assert.ok(footer.indexOf('intlTelInput.min.js') < footer.indexOf('__academyLeadFormCleanup'));
  assert.match(footer, /intl-tel-input@29\.1\.2\/dist\/js\/utils\.js/);
  assert.match(footer, /nativeForm\.requestSubmit\(/);
  assert.doesNotMatch(footer, /Отправка заявки пока недоступна/);
});

test('All images have explicit semantics, geometry and stable delivery', async () => {
  const html = await read('index.html');
  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
    assert.match(tag, /\balt="[^"]*"/);
    assert.match(tag, /\bwidth="\d+"/);
    assert.match(tag, /\bheight="\d+"/);
    assert.match(tag, /\bdraggable="false"/);
  }
  const registry = JSON.parse(await read('data/assets.json'));
  for (const [tag, src] of html.matchAll(/<img\b[^>]*src="([^"]+)"[^>]*>/g)) {
    assert.ok(registry.some(asset => asset.url === src || asset.canonical_path === src), `Unregistered image: ${src}`);
  }
});


test('CSS chunks preserve complete nested rules and exact cascade, with a budget on HEAD too', async () => {
  const rule = '@media (min-width:48rem){.a{content:"};\\\"";background:url("data:image/svg+xml;utf8,<svg>{}</svg>")}/* } */}';
  const css = '/* boundary { } */' + Array.from({length:1500}, (_, i) => `.a${i}{color:red}` + rule).join('');
  const chunks = splitTildaStyles(css);
  assert.ok(chunks.length > 1);
  assert.equal(chunks.map(chunk => chunk.slice(7, -8)).join(''), css);
  assert.ok(chunks.every(chunk => chunk.length < 65000));
  assert.throws(() => splitTildaStyles('.a{content:"' + 'x'.repeat(65000) + '"}'), /exceeds/);
  assert.throws(() => splitTildaStyles('@media(x){.a{color:red}'), /Incomplete/);
  const manifest = JSON.parse(await read('tilda/manifest.json'));
  assert.ok((await read('tilda/head.html')).length < 65000);
  assert.deepEqual(manifest.t123_order.slice(0, manifest.style_files.length), manifest.style_files);
  const fixture = await read('tests/tilda-transfer-fixture.html');
  assert.ok(fixture.indexOf('data-tilda-styles') < fixture.indexOf('data-tilda-page-part'));
  for (const file of manifest.style_files) assert.ok(fixture.includes(await read(`tilda/${file}`)));
});
