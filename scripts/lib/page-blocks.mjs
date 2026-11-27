// Общие блоки старой страницы превью, которые на Astro заменяются компонентами.
// Читает настройки из сборочных скриптов страницы (price-sync.mjs, request-form-sync.mjs, sync-blocks.mjs)
// и находит в index.html места между метками:
//   <!-- price:start … --> … <!-- price:end -->               → <PriceBlock> (цена из CMS)
//   <!-- price-ld:start … --> … <!-- price-ld:end -->         → <PriceLd> (микроразметка курса)
//   <!-- request-form…:start … --> … <!-- request-form…:end --> → <LeadForm> (форма заявки)
// Используется scripts/legacy-to-astro.mjs. Руками запускать не нужно.
import fs from 'node:fs';
import path from 'node:path';

// Вырезает литерал { … } или [ … ] после «const NAME =», не путаясь в строках и комментариях
export function literalAfter(code, name) {
  const at = code.search(new RegExp(`const\\s+${name}\\s*=\\s*[\\[{]`));
  if (at === -1) return null;
  const start = code.slice(at).search(/[\[{]/) + at;
  let depth = 0, i = start, quote = null;
  while (i < code.length) {
    const c = code[i], n = code[i + 1];
    if (quote) {
      if (c === '\\') { i += 2; continue; }
      if (c === quote) quote = null;
    } else if (c === '/' && n === '/') { i = code.indexOf('\n', i); if (i === -1) break; continue; }
    else if (c === '/' && n === '*') { i = code.indexOf('*/', i) + 2; continue; }
    else if (c === "'" || c === '"' || c === '`') quote = c;
    else if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') { depth--; if (depth === 0) return code.slice(start, i + 1); }
    i++;
  }
  return null;
}

// Литерал из нашего же репозитория — вычисляем как выражение JavaScript
const evaluate = (lit) => new Function(`return (${lit});`)();

// Настройки блока цены: slug, параметры генератора, «Что входит», преподаватели для микроразметки
export function readPrice(dir) {
  const file = path.join(dir, 'price-sync.mjs');
  if (!fs.existsSync(file)) return null;
  const code = fs.readFileSync(file, 'utf8');
  const slug = (code.match(/const\s+SLUG\s*=\s*['"]([^'"]+)['"]/) || [])[1];
  if (!slug) return null;
  const call = (code.match(/T\.assemble\(\{([\s\S]*?)\}\)/) || [])[1] || '';
  const options = {};
  for (const m of call.matchAll(/\b(system|terms|layout|background|anchor|top|bottom|noDiscount|installment)\s*:\s*('[^']*'|"[^"]*"|true|false)/g)) {
    options[m[1]] = evaluate(m[2]);
  }
  if (/includes:\s*\[\.\.\.INCLUDES\]/.test(call)) options.includes = evaluate(literalAfter(code, 'INCLUDES'));
  const ldCall = (code.match(/T\.assembleLd\(\{([\s\S]*?)\}\)/) || [])[1] || '';
  const instructors = /INSTRUCTORS/.test(ldCall) ? evaluate(literalAfter(code, 'INSTRUCTORS')) : null;
  return { slug, options, instructors };
}

// Формы заявки: для каждого вызова renderRequestForm(ИМЯ, {…}) — какой литерал, какой id,
// между какими метками стоит и нужно ли заголовку брать дату из CMS
export function readForms(dir) {
  const forms = [];
  for (const name of ['request-form-sync.mjs', 'sync-blocks.mjs']) {
    const file = path.join(dir, name);
    if (!fs.existsSync(file)) continue;
    const code = fs.readFileSync(file, 'utf8');
    for (const m of code.matchAll(/renderRequestForm\((\w+),\s*(\{[^}]*\})\)/g)) {
      const rest = code.slice(m.index);
      const marker = (rest.match(/<!-- (request-form[\w-]*):start/) || [])[1] || 'request-form';
      const opts = evaluate(m[2]);
      forms.push({
        marker,
        id: opts.id,
        options: Object.fromEntries(Object.entries(opts).filter(([k]) => k !== 'id')),
        form: evaluate(literalAfter(code, m[1])),
        cmsHeading: /data-cms="enrollment-start"/.test(rest.slice(0, 400)),
      });
    }
  }
  return forms;
}

// Тип заявки для контракта (docs/lead-contract.md) по режиму формы
export const intentOf = (mode) => ({ course: 'course', waitlist: 'waitlist', access: 'access', webinar: 'webinar' }[mode] || 'course');

// Заменяет блоки между метками на теги компонентов. data — куда сложить настройки для src/data/pages/<адрес>.json
export function replaceBlocks(html, dir, data) {
  let out = html;
  const used = new Set();
  const price = readPrice(dir);
  if (price) {
    const priceRe = /<!-- price:start[^>]*-->[\s\S]*?<!-- price:end -->/;
    if (priceRe.test(out)) {
      data.price = { course: price.slug, options: price.options };
      out = out.replace(priceRe, `<PriceBlock course={page.price.course} {...page.price.options} />`);
      used.add('PriceBlock');
    }
    const ldRe = /<!-- price-ld:start[^>]*-->[\s\S]*?<!-- price-ld:end -->/;
    if (ldRe.test(out)) {
      data.price = data.price || { course: price.slug, options: price.options };
      if (price.instructors) data.price.instructors = price.instructors;
      out = out.replace(ldRe, price.instructors
        ? `<PriceLd course={page.price.course} instructors={page.price.instructors} />`
        : `<PriceLd course={page.price.course} />`);
      used.add('PriceLd');
    }
  }
  // Метки, которые ставит scripts/tilda-to-source.mjs для страниц, снятых с сайта
  out = out.replace(/<!-- price-auto:(\{[\s\S]*?\}) -->/, (all, json) => {
    const cfg = JSON.parse(json);
    for (const k of Object.keys(cfg.options)) if (cfg.options[k] === undefined || cfg.options[k] === null) delete cfg.options[k];
    data.price = { course: cfg.course, options: cfg.options };
    used.add('PriceBlock');
    return '<PriceBlock course={page.price.course} {...page.price.options} />';
  });
  out = out.replace(/<!-- price-auto-ld:([\w-]+) -->/, (all, slug) => {
    data.price = data.price || { course: slug, options: {} };
    used.add('PriceLd');
    return '<PriceLd course={page.price.course} />';
  });
  const forms = readForms(dir);
  if (forms.length && !data.forms) data.forms = {};
  for (const f of forms) {
    const re = new RegExp(`<!-- ${f.marker}:start[^>]*-->[\\s\\S]*?<!-- ${f.marker}:end -->`);
    if (!re.test(out)) continue;
    const key = f.id.replace(/-form$/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    data.forms[key] = {
      id: f.id,
      form: f.form,
      options: f.options,
      cmsHeading: f.cmsHeading,
      lead: { intent: intentOf(f.form.mode), course: price ? price.slug : '', placement: key },
    };
    out = out.replace(re, `<LeadForm id={page.forms.${key}.id} form={page.forms.${key}.form} options={page.forms.${key}.options} lead={page.forms.${key}.lead} cmsHeading={page.forms.${key}.cmsHeading} />`);
    used.add('LeadForm');
  }
  return { html: out, used };
}
