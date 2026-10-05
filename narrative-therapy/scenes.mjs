// Анимированные схемы для блока «Где можно применять нарративный подход». Одна схема на ситуацию:
// показывает, что меняет нарративная работа. Схемы декоративные (aria-hidden), смысл передаёт текст карточки.
// Размер холста 240×140 в единицах viewBox, схема масштабируется целиком.
// Анимация в page.css (раздел «Схемы ситуаций»): элемент получает класс движения sc-pop / sc-fade / sc-rise /
// sc-grow / sc-move / sc-depart / sc-apart / sc-spin и задержку --d. Один цикл 7 секунд, анимируются только transform и opacity.
// Без анимации (prefers-reduced-motion) каждая схема показывает итоговое состояние.

const attrs = (list) => Object.entries(list).filter(([, v]) => v !== undefined).map(([k, v]) => ` ${k}="${v}"`).join('');
// motion: тип движения, delay: задержка в мс, vars: дополнительные CSS-переменные (смещения).
const el = (tag, list, motion, delay = 0, vars = {}) => {
  const style = motion ? [`--d: ${delay}ms`, ...Object.entries(vars).map(([k, v]) => `--${k}: ${v}`)].join('; ') : undefined;
  return `<${tag}${attrs({...list, class: [list.class, motion && `sc-${motion}`].filter(Boolean).join(' ') || undefined, style})}/>`;
};
const person = (cx, cy, r = 12, motion, delay, vars) => el('circle', {class: 'sc-person', cx, cy, r}, motion, delay, vars);
const node = (cx, cy, r = 7, motion = 'pop', delay = 0) => el('circle', {class: 'sc-node', cx, cy, r}, motion, delay);
const dot = (cx, cy, r = 4, motion = 'pop', delay = 0) => el('circle', {class: 'sc-dot', cx, cy, r}, motion, delay);

const SCENES = {
  // Проблема начинает определять человека → экстернализация: проблема отходит от человека, между ними остаётся связь.
  separate: () => [
    person(90, 70, 16),
    el('path', {class: 'sc-problem', d: 'M90 38c18 0 32 12 32 30s-12 34-32 34-34-14-34-32 16-32 34-32z'}, 'depart', 0, {tx: '78px', ty: '0px'}),
    el('path', {class: 'sc-link is-dashed', d: 'M110 70H140'}, 'apart'),
    el('circle', {class: 'sc-dot', cx: 90, cy: 70, r: 3}, 'apart'),
  ],
  // Застрял в одной истории → от главной линии ответвляются альтернативные истории с событиями.
  branches: () => [
    el('path', {class: 'sc-line', d: 'M16 76H224'}),
    el('path', {class: 'sc-alt', d: 'M52 76C82 76 86 36 120 34'}, 'rise', 400, {fy: '8px'}),
    dot(120, 34, 5, 'pop', 900),
    el('path', {class: 'sc-alt', d: 'M100 76C130 76 134 112 168 114'}, 'rise', 1300, {fy: '-8px'}),
    dot(168, 114, 5, 'pop', 1800),
    el('path', {class: 'sc-alt', d: 'M150 76C176 76 180 42 212 40'}, 'rise', 2200, {fy: '8px'}),
    dot(212, 40, 5, 'pop', 2700),
    person(26, 76, 9),
  ],
  // Отношения и контекст → вокруг человека появляются семья, культура, нормы, значимые люди; связи сходятся к нему.
  context: () => {
    const points = [[120, 20], [168, 55], [150, 110], [90, 110], [72, 55]];
    return [
      el('circle', {class: 'sc-ring', cx: 120, cy: 70, r: 50}, 'spin'),
      ...points.map(([x, y], i) => el('path', {class: 'sc-link', d: `M${x} ${y}L120 70`}, 'fade', 500 + i * 450)),
      ...points.map(([x, y], i) => node(x, y, 8, 'pop', 300 + i * 450)),
      person(120, 70, 14),
    ];
  },
  // Опора для изменений → ценности, опыт и отношения складываются в ступени, человек поднимается по ним.
  support: () => [
    el('path', {class: 'sc-line', d: 'M28 122H212'}),
    el('rect', {class: 'sc-step', x: 48, y: 98, width: 40, height: 24, rx: 4}, 'grow', 300),
    el('rect', {class: 'sc-step', x: 100, y: 76, width: 40, height: 46, rx: 4}, 'grow', 800),
    el('rect', {class: 'sc-step', x: 152, y: 52, width: 40, height: 70, rx: 4}, 'grow', 1300),
    person(172, 40, 10, 'move', 1900, {fx: '-104px', fy: '46px'}),
  ],
  // Кризис или изменения → прежняя линия обрывается, через разрыв перекидывается мост, история продолжается дальше.
  crisis: () => [
    el('path', {class: 'sc-line', d: 'M16 88C46 88 66 80 92 80'}),
    el('path', {class: 'sc-crack', d: 'M100 64l7 9-6 7 7 9-6 7'}),
    dot(100, 80, 3, 'pop', 500),
    dot(110, 80, 3, 'pop', 750),
    dot(120, 80, 3, 'pop', 1000),
    el('path', {class: 'sc-alt', d: 'M128 80C158 80 176 48 222 40'}, 'rise', 1300, {fy: '6px'}),
    person(222, 40, 9, 'pop', 2100),
  ],
  // Индивидуальная и групповая работа → к человеку присоединяются другие, в центре появляется общая история.
  group: () => [
    el('circle', {class: 'sc-shared', cx: 120, cy: 70, r: 30}, 'pop', 2000),
    el('path', {class: 'sc-story', d: 'M108 62H132M108 70H132M108 78H124'}, 'fade', 2400),
    person(72, 70, 11),
    person(120, 22, 11, 'move', 400, {fx: '0px', fy: '-30px'}),
    person(168, 70, 11, 'move', 900, {fx: '30px', fy: '0px'}),
    person(120, 118, 11, 'move', 1400, {fx: '0px', fy: '30px'}),
  ],
};

export function renderScene(name, className = '') {
  if (!SCENES[name]) throw new Error(`Нет схемы ${name}`);
  return `<svg class="nt-scene${className ? ` ${className}` : ''}" viewBox="0 0 240 140" aria-hidden="true" focusable="false" data-scene>${SCENES[name]().join('')}</svg>`;
}
