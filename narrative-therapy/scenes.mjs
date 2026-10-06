// Анимированные схемы для блока «Где можно применять нарративный подход». Одна схема на ситуацию:
// показывает, что меняет нарративная работа. Схемы декоративные (aria-hidden), смысл передаёт текст карточки.
// Размер холста 240×140 в единицах viewBox, схема масштабируется целиком.
// Анимация в page.css (раздел «Схемы ситуаций»): элемент получает класс движения sc-pop / sc-fade / sc-rise /
// sc-grow / sc-move / sc-depart / sc-apart / sc-spin и задержку --d. Один цикл 7 секунд, анимируются transform и opacity;
// у веток схемы branches ещё stroke-dashoffset — линия рисуется (свой таймлайн, туда и обратно).
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
  // Застрял в одной истории → от главной линии одна за другой прорастают альтернативные истории: ветка рисуется
  // от центра (точки ответвления) к краю, на её конце появляется событие-точка. Затем всё в обратном порядке:
  // точка исчезает, ветка втягивается обратно к центру. Свой таймлайн sc-branch-N / sc-bdot-N (см. page.css).
  branches: () => [
    el('path', {class: 'sc-line', d: 'M16 76H224'}),
    el('path', {class: 'sc-alt sc-branch-1', d: 'M52 76C82 76 86 36 120 34', pathLength: 1}),
    el('circle', {class: 'sc-dot sc-bdot-1', cx: 120, cy: 34, r: 5}),
    el('path', {class: 'sc-alt sc-branch-2', d: 'M100 76C130 76 134 112 168 114', pathLength: 1}),
    el('circle', {class: 'sc-dot sc-bdot-2', cx: 168, cy: 114, r: 5}),
    el('path', {class: 'sc-alt sc-branch-3', d: 'M150 76C176 76 180 42 212 40', pathLength: 1}),
    el('circle', {class: 'sc-dot sc-bdot-3', cx: 212, cy: 40, r: 5}),
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
  // Кризис или изменения → человек идёт по прежней (серой) линии, она обрывается разломом; поверх разлома
  // встаёт пунктир-мост, и дальше рисуется новая (фиолетовая) линия. Тёмный круг — сам клиент: он идёт по всему
  // пути, пока путь рисуется. В конце картинка гаснет целиком и цикл начинается заново.
  // Свой таймлайн sc-crisis-* (см. page.css); путь клиента посчитан по геометрии этих кривых.
  crisis: () => [
    el('path', {class: 'sc-line sc-crisis-old', d: 'M16 88C46 88 66 80 92 80', pathLength: 1}),
    el('path', {class: 'sc-crack sc-crisis-crack', d: 'M100 64l7 9-6 7 7 9-6 7'}),
    el('circle', {class: 'sc-dot sc-crisis-dot-1', cx: 100, cy: 80, r: 3}),
    el('circle', {class: 'sc-dot sc-crisis-dot-2', cx: 110, cy: 80, r: 3}),
    el('circle', {class: 'sc-dot sc-crisis-dot-3', cx: 120, cy: 80, r: 3}),
    el('path', {class: 'sc-alt sc-crisis-new', d: 'M128 80C158 80 176 48 222 40', pathLength: 1}),
    el('circle', {class: 'sc-person sc-crisis-client', cx: 16, cy: 88, r: 9}),
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
