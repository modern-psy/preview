#!/usr/bin/env node
/**
 * Проверка страницы в движках Safari, Chrome и Firefox после выкладки
 * в превью или публикации в Тильде. Правила — rules/engineering/safari.md.
 *
 * Запуск из apps/preview/web-academy/:
 *   node scripts/check-browsers.mjs <адрес> [--engines=webkit,chromium,firefox] [--out=browser-check]
 *
 * Что делает: открывает страницу на 1440 px и на телефоне 375 px (эмуляция
 * iPhone), отдельно — в Safari с настройкой «меньше движения»; прокручивает
 * до конца и печатает отчёт. Красное (✗) — исправить, жёлтое (!) — разобрать.
 * Код выхода 1, если есть красное.
 *
 * Ничего не меняет ни на сайте, ни в репозитории. Скриншоты — в папку --out.
 */
import { createRequire } from "node:module";
import { mkdir, readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith("--"));
const opt = (name, def) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1] ?? def;
if (!url) {
  console.log("Нужен адрес: node scripts/check-browsers.mjs https://modern-psy.ru/<страница>");
  process.exit(2);
}
const engines = opt("engines", "webkit,chromium,firefox").split(",");
const outDir = opt("out", "browser-check");

// ---------- 1. Найти Playwright: в проекте или в кэше npx ----------
async function loadPlaywright() {
  try { return (await import("playwright")).default; } catch {}
  const cache = join(homedir(), ".npm", "_npx");
  for (const dir of await readdir(cache).catch(() => [])) {
    try { return createRequire(join(cache, dir, "node_modules") + "/")("playwright"); } catch {}
  }
  console.log("Playwright не найден. Установите один раз:\n  npx -y playwright@1.63.0 install webkit chromium firefox");
  process.exit(2);
}
const pw = await loadPlaywright();

// ---------- 2. Что проверяем в каждом прогоне ----------
const host = new URL(url).hostname;
const ownHosts = [host, "static.tildacdn.com", "optim.tildacdn.com", "s3.twcstorage.ru", "modern-psy.ru", "modern-psy-preview-5a99.twc1.net"];
const isOwn = (u) => { try { return ownHosts.includes(new URL(u).hostname); } catch { return false; } };
// Firefox пишет ошибки чужих скриптов как ошибки страницы: берём адрес файла из текста
const fileOf = (text) => text.match(/file: "([^"]+)"/)?.[1] || text.match(/https?:\/\/[^\s"')]+/)?.[0] || "";

// Приёмы, опасные для Safari (раздел 3 правил). Ищем в HTML и CSS страницы.
const risky = [
  [/<feTurbulence|<feDisplacementMap/g, "живой SVG-фильтр (feTurbulence/feDisplacementMap)"],
  [/filter\s*[:=]\s*["']?url\(#/g, "SVG-фильтр через filter: url(#…)"],
  [/backdrop-filter\s*:/g, "backdrop-filter"],
  [/will-change\s*:[^;}"]*\b(left|top|width|height|margin|padding)\b/g, "will-change на свойствах раскладки"],
  [/background-attachment\s*:\s*fixed/g, "background-attachment: fixed (на iPhone не работает)"],
  [/\b100vh\b/g, "100vh вместо 100dvh"],
];

const runs = [];
for (const e of engines) {
  runs.push({ engine: e, name: `${e} 1440`, ctx: { viewport: { width: 1440, height: 900 } } });
  if (e === "firefox") continue; // Firefox не умеет эмулировать телефон
  runs.push({ engine: e, name: `${e} iPhone 375`, ctx: { ...pw.devices["iPhone 13 mini"], viewport: { width: 375, height: 812 } } });
}
if (engines.includes("webkit")) {
  runs.push({ engine: "webkit", name: "webkit iPhone 375, меньше движения", ctx: { ...pw.devices["iPhone 13 mini"], viewport: { width: 375, height: 812 }, reducedMotion: "reduce" } });
}

await mkdir(outDir, { recursive: true });
let red = 0;
const frameStats = {};
const mark = (bad, warn = false) => (bad ? (warn ? "!" : "✗") : "✓");

for (const run of runs) {
  const browser = await pw[run.engine].launch();
  const context = await browser.newContext(run.ctx);
  const page = await context.newPage();
  const errors = [];
  const failed = [];
  page.on("pageerror", (err) => { const f = fileOf(err.message); errors.push({ own: !f || isOwn(f), text: err.message.slice(0, 200) }); });
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const loc = m.location()?.url || fileOf(m.text());
    errors.push({ own: !loc || isOwn(loc), text: m.text().slice(0, 200) });
  });
  page.on("requestfailed", (r) => {
    const reason = r.failure()?.errorText || "";
    // Прерванные запросы видео и счётчиков — обычное дело, не ошибка
    if (/ABORTED|NS_BINDING_ABORTED|NS_ERROR_PARSED_DATA_CACHED|cancelled/i.test(reason)) return;
    failed.push({ own: isOwn(r.url()), text: `${r.url().slice(0, 120)}  ${reason}` });
  });

  console.log(`\n=== ${run.name}`);
  try {
    await page.goto(url, { waitUntil: "load", timeout: 90000 });
  } catch (err) {
    console.log(`✗ страница не открылась: ${err.message.split("\n")[0]}`);
    red++; await browser.close(); continue;
  }
  await page.waitForTimeout(1500);

  // Прокрутка до конца с замером кадров: долгий кадр (> 50 мс) — рывок
  const frames = await page.evaluate(async () => {
    const times = [];
    let last = performance.now();
    let running = true;
    const tick = (t) => { times.push(t - last); last = t; if (running) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    const step = Math.round(innerHeight * 0.6);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    await new Promise((r) => setTimeout(r, 800));
    running = false;
    const sorted = [...times].sort((a, b) => a - b);
    return { count: times.length, long: times.filter((t) => t > 50).length, p95: Math.round(sorted[Math.floor(sorted.length * 0.95)] || 0) };
  });
  frameStats[run.name] = frames;

  // Видео: прокручиваем к каждому и смотрим, играет ли или видна ли обложка
  const videos = await page.evaluate(async () => {
    const list = [];
    for (const v of document.querySelectorAll("video")) {
      v.scrollIntoView({ block: "center" });
      await new Promise((r) => setTimeout(r, 2500));
      list.push({ src: (v.currentSrc || v.src || "").split("/").pop().slice(0, 60), poster: !!v.poster, playing: !v.paused && v.readyState >= 2, frame: v.readyState >= 2, autoplay: v.muted || v.autoplay });
    }
    return list;
  });

  const state = await page.evaluate(() => ({
    hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    width: document.documentElement.scrollWidth,
    broken: [...document.images].filter((i) => i.complete && i.src && !i.naturalWidth).map((i) => i.src.slice(0, 120)),
  }));

  const ownErr = errors.filter((e) => e.own);
  const ownFail = failed.filter((f) => f.own);
  const certFail = failed.filter((f) => /CERT|certificate/i.test(f.text));
  console.log(`${mark(ownErr.length)} ошибки страницы: ${ownErr.length}${ownErr.length ? "\n    " + ownErr.slice(0, 5).map((e) => e.text).join("\n    ") : ""}`);
  console.log(`${mark(errors.length - ownErr.length, true)} чужие ошибки (виджеты, счётчики): ${errors.length - ownErr.length}`);
  console.log(`${mark(ownFail.length)} не загрузились наши файлы: ${ownFail.length}${ownFail.length ? "\n    " + ownFail.map((f) => f.text).join("\n    ") : ""}`);
  if (certFail.length) console.log(`! не приняли сертификат (с VPN и из-за рубежа не загрузится):\n    ${certFail.map((f) => f.text).join("\n    ")}`);
  console.log(`${mark(state.hScroll)} горизонтальный скролл: ${state.hScroll ? `есть, ширина ${state.width}` : "нет"}`);
  console.log(`${mark(state.broken.length)} битые картинки: ${state.broken.length}${state.broken.length ? "\n    " + state.broken.join("\n    ") : ""}`);
  for (const v of videos) {
    const stuck = v.autoplay && !v.playing && !v.poster;
    const reduce = run.name.includes("меньше движения");
    const note = v.playing ? "играет" : v.poster ? "стоит, видна обложка" : v.frame ? "стоит, виден кадр" : "пусто: нет ни кадра, ни обложки";
    console.log(`${stuck && !reduce ? "✗" : !v.poster ? "!" : "✓"} видео ${v.src}: ${note}${v.poster ? "" : ", нет poster"}`);
    if (stuck && !reduce) red++;
  }
  console.log(`  кадры при прокрутке: ${frames.count}, долгих (> 50 мс): ${frames.long}, 95-й перцентиль: ${frames.p95} мс`);
  red += ownErr.length + ownFail.length + (state.hScroll ? 1 : 0) + state.broken.length;

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: join(outDir, `${run.name.replace(/[^a-z0-9]+/gi, "-")}.png`), fullPage: false });
  await browser.close();
}

// ---------- 3. Опасные для Safari приёмы в коде страницы ----------
{
  const browser = await pw.chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "load", timeout: 90000 }).catch(() => {});
  // На Тильде смотрим только наши блоки T123 (их разметку и стили внутри),
  // чтобы не считать стили самой Тильды и шапки сайта.
  const { code, scope } = await page.evaluate(() => {
    const blocks = [...document.querySelectorAll(".t123")];
    if (blocks.length) return { code: blocks.map((b) => b.outerHTML).join("\n"), scope: `блоки T123: ${blocks.length}` };
    let css = "";
    for (const s of document.styleSheets) { try { css += [...s.cssRules].map((r) => r.cssText).join("\n"); } catch {} }
    return { code: document.documentElement.outerHTML + "\n" + css, scope: "вся страница" };
  });
  const willChange = (code.match(/will-change\s*:/g) || []).length;
  const infinite = (code.match(/\binfinite\b/g) || []).length;
  console.log(`\n=== Опасные для Safari приёмы (rules/engineering/safari.md, раздел 3) · ${scope}`);
  let any = false;
  for (const [re, label] of risky) {
    const n = (code.match(re) || []).length;
    if (n) { any = true; console.log(`! ${label}: ${n}`); }
  }
  if (willChange > 8) { any = true; console.log(`! will-change встречается ${willChange} раз: каждый держит слой в памяти`); }
  if (infinite) { any = true; console.log(`! бесконечных анимаций: ${infinite} — проверить, что они стоят вне экрана`); }
  if (!any) console.log("✓ не найдено");
  await browser.close();
}

// ---------- 4. Сравнение плавности Safari и остальных ----------
const desktop = Object.entries(frameStats).filter(([n]) => n.endsWith("1440"));
const wk = frameStats["webkit 1440"];
const others = desktop.filter(([n]) => !n.startsWith("webkit"));
if (wk && others.length) {
  const best = Math.min(...others.map(([, s]) => s.long));
  const bestP95 = Math.min(...others.map(([, s]) => s.p95));
  console.log(`\n=== Плавность: долгих кадров в Safari ${wk.long}, в лучшем из остальных ${best}; 95-й перцентиль кадра ${wk.p95} мс против ${bestP95} мс`);
  if (wk.long > best + 5 || wk.p95 >= bestP95 * 1.4) console.log("! Safari заметно медленнее — проверить анимации в настоящем Safari (правила, раздел 1.2) и разобрать опасные приёмы выше");
  console.log("  Это грубый сигнал без настоящего железа. Производительность iPhone — только на iPhone или в инспекторе Safari.");
}

console.log(`\n${red ? `✗ Есть что исправить: ${red}` : "✓ Красного нет"} · скриншоты: ${outDir}/`);
process.exit(red ? 1 : 0);
