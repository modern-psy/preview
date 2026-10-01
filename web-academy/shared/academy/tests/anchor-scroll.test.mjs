import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../anchor-scroll.js', import.meta.url), 'utf8');
const styles = fs.readFileSync(new URL('../anchor-scroll.css', import.meta.url), 'utf8');

test('shared anchor targets clear the Tilda header on mobile and larger screens', () => {
  assert.match(styles, /--anchor-scroll-offset:\s*50px/);
  assert.match(styles, /@media \(min-width: 48rem\)[\s\S]*--anchor-scroll-offset:\s*100px/);
  assert.match(styles, /scroll-margin-top:\s*var\(--anchor-scroll-offset\)/);
});

// Deterministic browser API harness: checks motion between frames, not just source patterns.
function harness({ reduced = false, distance = 2000, margin = 32 } = {}) {
  let now = 0;
  let nextFrame = 0;
  const frames = new Map();
  class Events {
    listeners = new Map();
    addEventListener(name, fn) {
      if (!this.listeners.has(name)) this.listeners.set(name, new Set());
      this.listeners.get(name).add(fn);
    }
    removeEventListener(name, fn) { this.listeners.get(name)?.delete(fn); }
    emit(name, event = {}) { [...this.listeners.get(name) || []].forEach(fn => fn(event)); }
    count(name) { return this.listeners.get(name)?.size || 0; }
  }
  class Element extends Events {
    attrs = new Map();
    isConnected = true;
    tabIndex = -1;
    target = '';
    getAttribute(name) { return this.attrs.get(name) ?? null; }
    setAttribute(name, value) { this.attrs.set(name, value); }
    hasAttribute(name) { return this.attrs.has(name); }
    removeAttribute(name) { this.attrs.delete(name); }
    getClientRects() { return this.hidden ? [] : [{}]; }
    getBoundingClientRect() { return { top: distance - win.scrollY }; }
    focus(options) { this.focusOptions = options; doc.activeElement = this; }
    matches() { return this.ignored || false; }
    closest(selector) { return selector.startsWith('a[') ? this : this.root; }
  }
  const doc = new Events();
  doc.documentElement = { scrollHeight: 10000 };
  const root = new Element();
  const target = new Element();
  const second = new Element();
  const ids = new Map([['section', target], ['раздел', second]]);
  doc.getElementById = id => ids.get(id);
  const win = new Events();
  const media = new Events();
  media.matches = reduced;
  win.matchMedia = () => media;
  win.scrollY = 0;
  win.scrollX = 4;
  win.innerHeight = 800;
  win.location = { hash: '' };
  const history = [];
  win.history = {
    state: { retained: true },
    pushState(state, title, hash) { history.push({ method: 'push', state, hash }); win.location.hash = hash; },
    replaceState(state, title, hash) { history.push({ method: 'replace', state, hash }); win.location.hash = hash; },
  };
  win.getComputedStyle = () => ({ scrollMarginTop: `${margin}px` });
  const scrolls = [];
  win.scrollTo = options => { win.scrollY = options.top; scrolls.push(options); };
  win.requestAnimationFrame = fn => { frames.set(++nextFrame, fn); return nextFrame; };
  win.cancelAnimationFrame = id => frames.delete(id);
  const context = vm.createContext({ window: win, document: doc, Element, HTMLElement: Element, performance: { now: () => now } });
  const init = () => vm.runInContext(source, context);
  const link = new Element();
  link.root = root;
  link.setAttribute('href', '#section');
  const click = (overrides = {}, sourceLink = link) => {
    const event = { button: 0, target: sourceLink, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...overrides };
    doc.emit('click', event);
    return event;
  };
  const tick = elapsed => {
    now += elapsed;
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach(fn => fn(now));
  };
  init();
  return { win, doc, media, root, target, second, link, frames, scrolls, history, init, click, tick, Element };
}

test('cubic ease-out progresses before landing at the offset; URL and focus follow the destination', () => {
  const h = harness();
  assert.ok(h.click().defaultPrevented);
  assert.equal(h.scrolls.length, 0);
  h.tick(140);
  assert.ok(h.win.scrollY > 0 && h.win.scrollY < 1968);
  h.tick(900);
  assert.equal(h.win.scrollY, 1968);
  assert.equal(h.doc.activeElement, h.target);
  assert.equal(h.target.focusOptions.preventScroll, true);
  assert.ok(h.scrolls.every(s => s.behavior === 'instant' && s.left === 4));
  assert.equal(h.history[0].state, h.win.history.state);
  h.click();
  assert.equal(h.history.at(-1).method, 'replace');
  h.target.emit('blur');
  assert.equal(h.target.hasAttribute('tabindex'), false);
});

test('short and long trips respect 480ms and 900ms limits, with a clamped document bottom', () => {
  for (const [distance, duration, expected] of [[100, 480, 68], [20000, 900, 9200]]) {
    const h = harness({ distance });
    h.click(); h.tick(duration / 2);
    assert.ok(h.win.scrollY > 0 && h.win.scrollY < expected);
    h.tick(duration / 2);
    assert.equal(h.win.scrollY, expected);
    assert.equal(h.frames.size, 0);
  }
});

test('reduced motion jumps immediately, including preference changes during animation', () => {
  const h = harness({ reduced: true });
  h.click();
  assert.equal(h.win.scrollY, 1968);
  assert.equal(h.frames.size, 0);
  const active = harness();
  active.click(); active.tick(120);
  active.media.matches = true;
  active.media.emit('change');
  assert.equal(active.win.scrollY, 1968);
  assert.equal(active.frames.size, 0);
});

test('user interruption and history navigation cancel motion without stealing focus', () => {
  for (const name of ['wheel', 'touchstart', 'pointerdown', 'keydown', 'popstate', 'hashchange']) {
    const h = harness();
    h.click(); h.tick(140);
    const stoppedY = h.win.scrollY;
    h.win.emit(name); h.tick(900);
    assert.equal(h.win.scrollY, stoppedY, name);
    assert.equal(h.doc.activeElement, undefined, name);
    assert.equal(h.frames.size, 0, name);
    assert.equal(h.win.count(name), 0, name);
  }
});

test('popup, missing, external, hidden and modified links retain native behavior', () => {
  for (const prepare of [
    h => h.link.setAttribute('href', '#'),
    h => h.link.setAttribute('href', '#missing'),
    h => h.link.setAttribute('href', '#%broken'),
    h => h.link.setAttribute('data-tilda-popup-link', ''),
    h => { h.link.ignored = true; },
    h => { h.link.target = '_blank'; },
    h => { h.link.root = null; },
    h => { h.target.hidden = true; },
  ]) {
    const h = harness(); prepare(h);
    assert.equal(h.click().defaultPrevented, false);
    assert.equal(h.history.length, 0);
  }
  for (const overrides of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { defaultPrevented: true }]) {
    const h = harness(); h.click(overrides);
    assert.equal(h.history.length, 0);
  }
});

test('encoded IDs and links inserted in another container work; new navigation cancels the old frame', () => {
  const h = harness();
  h.click(); h.tick(120);
  const link = new h.Element();
  link.root = new h.Element();
  link.setAttribute('href', '#%D1%80%D0%B0%D0%B7%D0%B4%D0%B5%D0%BB');
  h.click({}, link);
  assert.equal(h.frames.size, 1);
  h.tick(900);
  assert.equal(h.doc.activeElement, h.second);
});

test('reinit, teardown and removed targets release handlers, frames and temporary tabindex', () => {
  const h = harness();
  h.click(); h.tick(100); h.init();
  assert.equal(h.frames.size, 0);
  assert.equal(h.doc.count('click'), 1);
  assert.equal(h.media.count('change'), 1);
  h.click(); h.target.isConnected = false; h.tick(200);
  assert.equal(h.frames.size, 0);
  h.target.isConnected = true;
  h.click(); h.tick(900);
  h.win.__academyAnchorScrollCleanup();
  assert.equal(h.doc.count('click'), 0);
  assert.equal(h.media.count('change'), 0);
  assert.equal(h.target.hasAttribute('tabindex'), false);
});

test('authored tabindex is preserved', () => {
  const h = harness({ reduced: true });
  h.target.setAttribute('tabindex', '0');
  h.click(); h.win.__academyAnchorScrollCleanup();
  assert.equal(h.target.getAttribute('tabindex'), '0');
});

test('both consumers include the shared component in current standalone delivery', () => {
  const read = relative => fs.readFileSync(new URL(relative, import.meta.url), 'utf8');
  for (const slug of ['trauma-therapy', 'psychologist-consultant']) {
    const project = `../../../projects/${slug}/`;
    const html = read(`${project}index.html`);
    assert.match(html, /<main\b[^>]*data-academy-anchor-scroll/);
    assert.match(html, /src="\.\.\/\.\.\/shared\/academy\/anchor-scroll\.js/);
    const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
    const actionsFile = `${project}data/actions.json`;
    const actions = fs.existsSync(new URL(actionsFile, import.meta.url)) ? JSON.parse(read(actionsFile)) : [];
    const tildaTargets = new Set(actions
      .filter(action => action.tilda_managed === true).map(action => action.destination));
    for (const [tag, id] of html.matchAll(/<a\b[^>]*href="#([^"]+)"[^>]*>/g)) {
      if (/data-tilda-popup-link/.test(tag)) continue;
      if (tildaTargets.has(`#${id}`)) continue;
      assert.ok(ids.has(decodeURIComponent(id)), `${slug}: missing #${id}`);
    }
    const delivered = slug === 'trauma-therapy'
      ? read(`${project}tilda/footer.html`)
      : Buffer.from(read(`${project}tilda/preview.html`).match(/atob\('([^']+)'\)/)[1], 'base64').toString('utf8');
    assert.ok(delivered.includes(source.trim()), `${slug}: shared runtime is inlined`);
    assert.doesNotMatch(delivered, /__traumaAnchorScrollCleanup/);
    const styled = read(`${project}tilda/${slug === 'trauma-therapy' ? 'head.html' : 'preview.html'}`);
    assert.ok(styled.includes(read('../anchor-scroll.css').trim()));
  }
});
