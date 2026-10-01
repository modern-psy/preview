import fs from 'node:fs/promises';
import {escapeHtml} from '../../shared/academy/html-render.mjs';

// Resolve project destinations after section renderers, keeping native links in
// both the authoring page and Tilda. Shared components retain their CSS API.
const root = new URL('./', import.meta.url);
const actions = JSON.parse(await fs.readFile(new URL('data/actions.json', root), 'utf8'));
const source = new URL('index.html', root);
const html = await fs.readFile(source, 'utf8');
const next = html.replace(/<(button|a)\b([^>]*\bdata-action="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/g,
  (original, tag, attributes, id, content) => {
    const action = actions.find(item => item.id === id);
    if (!action) throw new Error(`Unknown page action: ${id}`);
    if (action.destination === null) return original;
    if (!/^(#[a-z][a-z0-9-]*|https:\/\/[^\s]+)$/i.test(action.destination)) throw new Error(`Invalid destination: ${id}`);
    if (tag === 'a') return original.replace(/href="[^"]*"/, `href="${escapeHtml(action.destination)}"`);
    const clean = attributes.replace(/\s(?:type|aria-disabled|href)="[^"]*"/g, '');
    return `<a${clean} href="${escapeHtml(action.destination)}">${content}</a>`;
  });
if (next !== html) await fs.writeFile(source, next);
