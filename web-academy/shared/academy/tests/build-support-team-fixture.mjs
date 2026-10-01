import fs from 'node:fs/promises';
import {renderSupportTeam} from '../support-team-render.mjs';
import {renderTeamCard} from '../team-card-render.mjs';
import {renderMetaPill} from '../meta-pill-render.mjs';
const project = new URL('../../../projects/psychologist-consultant/', import.meta.url);
const data = JSON.parse(await fs.readFile(new URL('data/support-team.json', project), 'utf8'));
// Media uses the supplied CDN; the real local icon resolves through the base URL.
const card = {...data.specialists[0], title: 'Самостоятельная карточка без тега'};
const theme = (await fs.readFile(new URL('styles.css', project), 'utf8')).match(/\.psychologist-consultant-page \{[\s\S]*?\n\}/)[0].replace('.psychologist-consultant-page', '.academy-page');
const markup = `${renderSupportTeam(data)}<section class="fixture_card" aria-label="Карточка отдельно">${renderTeamCard(card)}${renderMetaPill(data.specialists[1].tag)}</section>${renderSupportTeam(data, {id: 'second-team'})}`;
const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><base href="../../../projects/psychologist-consultant/"><title>Команда — независимые компоненты</title><link rel="icon" href="data:,"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Wix+Madefor+Text:wght@400;444;500&display=swap">${['components','card-spacing','section-spacing','body-text','team-card','support-team','section-heading'].map(name => `<link rel="stylesheet" href="../../shared/academy/${name}.css?v=team-2">`).join('')}<style>body{margin:0}${theme}.fixture_card{max-width:24rem;padding:1rem;margin:2rem auto}</style></head><body><main class="academy-page">${markup}</main></body></html>`;
await fs.writeFile(new URL('support-team-fixture.html', import.meta.url), html);
await fs.writeFile(new URL('support-team-large-text-fixture.html', import.meta.url), html.replace('</head>', '<style>html{font-size:200%}</style></head>'));
