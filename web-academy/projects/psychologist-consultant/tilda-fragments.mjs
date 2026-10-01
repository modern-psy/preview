// Keep each T123 independently parseable; never split an open HTML element or JS module.
export const T123_LIMIT = 65000;
const TARGET = 60000;

export function splitTildaBody(body) {
  const main = body.match(/^<main\b([^>]*)>([\s\S]*)<\/main>$/);
  if (!main) throw new Error('Tilda body must contain one complete main.');
  const source = main[2];
  const sections = [];
  let depth = 0, start = 0, end = 0;
  for (const match of source.matchAll(/<\/?section\b[^>]*>/g)) {
    if (match[0].startsWith('</')) {
      if (--depth < 0) throw new Error('Unbalanced Tilda section.');
      if (depth === 0) {
        end = match.index + match[0].length;
        sections.push(source.slice(start, end));
      }
    } else if (depth++ === 0) {
      if (source.slice(end, match.index).trim()) throw new Error('Content outside Tilda sections.');
      start = match.index;
    }
  }
  if (depth || !sections.length || source.slice(end).trim()) throw new Error('Incomplete Tilda sections.');
  const attributes = main[1].replace(/\s+id="[^"]*"/, '');
  const wrap = (content, index) => `<div${attributes} data-tilda-page-part="${index + 1}"${index === 0 ? ' id="main-content"' : ''}>${content}</div>`;
  const chunks = [];
  let current = '';
  for (const section of sections) {
    if (wrap(section, chunks.length).length >= T123_LIMIT) throw new Error('A complete section exceeds the T123 limit.');
    if (current && wrap(current + section, chunks.length).length > TARGET) {
      chunks.push(wrap(current, chunks.length));
      current = '';
    }
    current += section;
  }
  if (current) chunks.push(wrap(current, chunks.length));
  return chunks;
}

export function splitTildaScripts(modules, dependencies = '') {
  const chunks = [];
  let current = dependencies;
  for (const module of modules) {
    const script = `<script>\n${module}\n</script>`;
    if (script.length >= T123_LIMIT) throw new Error('A complete script module exceeds the T123 limit.');
    if (current && (current + script).length > TARGET) {
      chunks.push(current);
      current = '';
    }
    current += script + '\n';
  }
  if (current) chunks.push(current);
  return chunks;
}

export const fragmentName = (kind, index) => `${kind}${index ? `-${String(index + 1).padStart(2, '0')}` : ''}.html`;

// Split only between complete top-level CSS rules. Preserve strings, comments,
// data URLs, nested @media/@supports and the original cascade byte for byte.
export function splitTildaStyles(css) {
  const rules = [];
  let start = 0, depth = 0, parentheses = 0, quote = '', comment = false;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i], next = css[i + 1];
    if (comment) { if (ch === '*' && next === '/') { comment = false; i++; } continue; }
    if (quote) { if (ch === '\\') i++; else if (ch === quote) quote = ''; continue; }
    if (ch === '/' && next === '*') { comment = true; i++; continue; }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === '\\') { i++; continue; }
    if (ch === '(') parentheses++;
    if (ch === ')') parentheses--;
    if (parentheses) continue;
    if (ch === '{') depth++;
    if (ch === '}' && --depth < 0) throw new Error('Unbalanced CSS block.');
    if (!depth && (ch === '}' || ch === ';')) {
      rules.push(css.slice(start, i + 1)); start = i + 1;
    }
  }
  if (depth || parentheses || quote || comment) throw new Error('Incomplete CSS rule.');
  if (start < css.length) rules.push(css.slice(start));
  const wrap = value => `<style>${value}</style>`;
  const chunks = [];
  let current = '';
  for (const rule of rules) {
    if (wrap(rule).length >= T123_LIMIT) throw new Error('A complete CSS rule exceeds the Tilda limit.');
    if (current && wrap(current + rule).length > TARGET) { chunks.push(wrap(current)); current = ''; }
    current += rule;
  }
  if (current) chunks.push(wrap(current));
  return chunks;
}
