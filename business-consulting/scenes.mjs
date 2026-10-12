// Анимированные SVG-схемы блока «Как вы будете учиться» — по одной на вкладку (12.10.2026, по просьбе Дарьи).
// Поле 360 × 240. Цвета, тайминг и движение — в page.css (раздел «learning-scene»): здесь только геометрия и подписи.
// Порядок появления задаёт класс is-at-N (N = 0…8): чем больше N, тем позже элемент появляется в цикле.
// Подписи на схемах можно править прямо здесь; длинные подписи не влезут в плашки.
import {escapeHtml} from '../web-academy/shared/academy/html-render.mjs';

const svg = (name, inner) => `<svg class="learning-scene is-${name}" viewBox="0 0 360 240" aria-hidden="true" focusable="false">${inner}</svg>`;
const label = (x, y, text, cls = '', anchor = 'start') => `<text class="learning-scene_label${cls ? ` ${cls}` : ''}" x="${x}" y="${y}" text-anchor="${anchor}">${escapeHtml(text)}</text>`;
// Галочка в тёмном кружке.
const check = (cx, cy) => `<circle class="learning-scene_check-dot" cx="${cx}" cy="${cy}" r="9"/><path class="learning-scene_check" d="M${cx - 4} ${cy} l3 3 l5 -6"/>`;
// Человек: голова и плечи в круге-аватаре.
const person = (cx, cy, r = 18) => `<circle class="learning-scene_avatar" cx="${cx}" cy="${cy}" r="${r}"/><circle class="learning-scene_head" cx="${cx}" cy="${cy - r * 0.22}" r="${r * 0.3}"/><path class="learning-scene_body" d="M${cx - r * 0.55} ${cy + r * 0.62} a${r * 0.55} ${r * 0.45} 0 0 1 ${r * 1.1} 0"/>`;

/* 1. «На занятии»: лекция в окне видеосвязи — строки слайда прорисовываются, говорящий подсвечен;
   из слайда выходят три практических результата занятия и встают плашками с галочками. */
const lecture = svg('lecture', `
  <rect class="learning-scene_window" x="16" y="24" width="184" height="192" rx="12"/>
  <circle class="learning-scene_dot" cx="32" cy="40" r="3"/><circle class="learning-scene_dot" cx="42" cy="40" r="3"/><circle class="learning-scene_dot" cx="52" cy="40" r="3"/>
  <rect class="learning-scene_slide" x="28" y="54" width="160" height="100" rx="8"/>
  <path class="learning-scene_bar is-title is-at-0" pathLength="1" d="M42 72 H104"/>
  <path class="learning-scene_bar is-at-1" pathLength="1" d="M42 92 H168"/>
  <path class="learning-scene_bar is-at-1 is-late" pathLength="1" d="M42 106 H150"/>
  <path class="learning-scene_bar is-at-2" pathLength="1" d="M42 120 H160"/>
  <path class="learning-scene_bar is-at-2 is-late" pathLength="1" d="M42 134 H124"/>
  <rect class="learning-scene_tile" x="28" y="162" width="50" height="42" rx="6"/>${person(53, 183, 13)}
  <rect class="learning-scene_tile" x="83" y="162" width="50" height="42" rx="6"/>${person(108, 183, 13)}
  <rect class="learning-scene_tile" x="138" y="162" width="50" height="42" rx="6"/>${person(163, 183, 13)}
  <rect class="learning-scene_speaking" x="28" y="162" width="50" height="42" rx="6"/>
  <path class="learning-scene_link is-at-3" pathLength="1" d="M188 104 C204 104 204 72 220 72"/>
  <path class="learning-scene_link is-at-4" pathLength="1" d="M188 104 C204 104 204 120 220 120"/>
  <path class="learning-scene_link is-at-5" pathLength="1" d="M188 104 C204 104 204 168 220 168"/>
  <g class="learning-scene_pop is-at-3 is-late"><rect class="learning-scene_chip" x="220" y="54" width="124" height="36" rx="18"/>${check(240, 72)}${label(256, 76, 'Встреча с HR')}</g>
  <g class="learning-scene_pop is-at-4 is-late"><rect class="learning-scene_chip" x="220" y="102" width="124" height="36" rx="18"/>${check(240, 120)}${label(256, 124, 'Структура КП')}</g>
  <g class="learning-scene_pop is-at-5 is-late"><rect class="learning-scene_chip" x="220" y="150" width="124" height="36" rx="18"/>${check(240, 168)}${label(256, 172, 'Сценарий')}</g>
`);

/* 2. «В мини-группе»: в центре карточка кейса, вокруг четыре участника. Связи прорисовываются по очереди,
   участники «говорят» (появляются облачка), в конце под кейсом встаёт тёмная плашка «Решение». */
const PEOPLE = [[56, 64], [304, 64], [56, 176], [304, 176]];
const BUBBLES = [[80, 30], [238, 30], [80, 206], [238, 206]];
const bubble = ([x, y], n) => `<g class="learning-scene_pop is-at-${n + 1}"><rect class="learning-scene_bubble" x="${x}" y="${y - 12}" width="42" height="22" rx="11"/><circle class="learning-scene_dot is-dark" cx="${x + 13}" cy="${y - 1}" r="2.2"/><circle class="learning-scene_dot is-dark" cx="${x + 21}" cy="${y - 1}" r="2.2"/><circle class="learning-scene_dot is-dark" cx="${x + 29}" cy="${y - 1}" r="2.2"/></g>`;
const group = svg('group', `
  ${PEOPLE.map(([x, y], i) => `<path class="learning-scene_link is-dashed is-at-${i}" pathLength="1" d="M${x < 180 ? x + 20 : x - 20} ${y} L${x < 180 ? 128 : 232} ${y < 120 ? 100 : 140}"/>`).join('')}
  <rect class="learning-scene_card" x="128" y="76" width="104" height="88" rx="10"/>
  ${label(144, 100, 'Кейс', 'is-strong')}
  <path class="learning-scene_bar is-static" d="M144 118 H216"/>
  <path class="learning-scene_bar is-static" d="M144 132 H204"/>
  <path class="learning-scene_bar is-static" d="M144 146 H196"/>
  ${PEOPLE.map(([x, y]) => person(x, y)).join('')}
  ${BUBBLES.map(bubble).join('')}
  <g class="learning-scene_pop is-at-6"><rect class="learning-scene_badge" x="134" y="182" width="92" height="30" rx="15"/>${label(180, 202, 'Решение', 'is-on-dark', 'middle')}</g>
`);

/* 3. «Между занятиями»: онлайн-доска. Три колонки «Задача → Инструмент → Результат»; стикеры появляются
   по очереди, курсор переносит их, стрелки связывают. В конце внизу встаёт плашка «Итоговый проект». */
const NOTES = [
  {x: 52, y: 60, tone: 'task', at: 0}, {x: 148, y: 60, tone: 'tool', at: 1}, {x: 244, y: 60, tone: 'result', at: 2},
  {x: 52, y: 118, tone: 'task', at: 3}, {x: 148, y: 118, tone: 'tool', at: 4}, {x: 244, y: 118, tone: 'result', at: 5},
];
const note = ({x, y, tone, at}) => `<g class="learning-scene_pop is-at-${at}"><rect class="learning-scene_note is-${tone}" x="${x}" y="${y}" width="72" height="44" rx="6"/><path class="learning-scene_bar is-static is-thin" d="M${x + 10} ${y + 16} H${x + 56}"/><path class="learning-scene_bar is-static is-thin" d="M${x + 10} ${y + 28} H${x + 44}"/></g>`;
const arrow = (x, y, at) => `<path class="learning-scene_link is-arrow is-at-${at}" pathLength="1" d="M${x} ${y} H${x + 16} m-5 -4 l5 4 l-5 4"/>`;
const board = svg('board', `
  <rect class="learning-scene_window" x="16" y="16" width="328" height="208" rx="12"/>
  <rect class="learning-scene_tool" x="26" y="58" width="14" height="14" rx="4"/><rect class="learning-scene_tool" x="26" y="80" width="14" height="14" rx="4"/><rect class="learning-scene_tool" x="26" y="102" width="14" height="14" rx="4"/>
  ${label(52, 46, 'Задача', 'is-muted')}${label(148, 46, 'Инструмент', 'is-muted')}${label(244, 46, 'Результат', 'is-muted')}
  ${NOTES.map(note).join('')}
  ${arrow(126, 82, 1)}${arrow(222, 82, 2)}${arrow(126, 140, 4)}${arrow(222, 140, 5)}
  <g class="learning-scene_pop is-at-7"><rect class="learning-scene_badge" x="200" y="178" width="132" height="30" rx="15"/>${label(266, 198, 'Итоговый проект', 'is-on-dark', 'middle')}</g>
  <g class="learning-scene_cursor"><path class="learning-scene_pointer" d="M0 0 L0 16 L4.5 12 L7.5 19 L10.5 17.8 L7.5 11 L13 11 Z"/></g>
`);

export const LEARNING_SCENES = [lecture, group, board];
