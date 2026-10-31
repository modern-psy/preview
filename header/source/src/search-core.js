// Движок поиска по курсам Академии: всё считается в браузере по ответу каталога CMS.
// Понимает сокращения в обеих раскладках, опечатки, неправильную раскладку клавиатуры,
// окончания слов, поисковые слова курса (tg), темы и запросы клиентов (tp) и преподавателей (tch).
// Можно править словарь STOP, веса полей W и бонусы порядка в теме TOPIC_BONUS.
// Проверка на живых запросах: node .impeccable/mocks/decision/header/search/test.mjs
(function (root) {
  // Слова, которые есть почти в каждом запросе и ничего не уточняют.
  var STOP = ['обучение', 'обучения', 'обучении', 'курс', 'курсы', 'курса', 'курсов', 'по', 'для', 'в', 'и', 'на', 'с', 'у', 'о',
    'асп', 'академия', 'академии', 'современной', 'психологии', 'онлайн', 'программа', 'школа', 'хочу', 'как', 'работа', 'работе',
    'терапия', 'терапии', 'психотерапия', 'психотерапии', 'психология', 'психолога', 'психологов', 'практике', 'клиент', 'клиенты',
    'клиентом', 'клиентами', 'работать', 'лечение', 'лечить'];
  // Веса полей: название важнее всего, описание слабее всего.
  var W = { t: 3, tg: 2.6, tch: 2.4, tp: 2.2, sec: 1.2, sub: 1.2, ds: 0.6 };
  // Бонус за место курса в теме: первый курс темы выше второго.
  var TOPIC_BONUS = [1.5, 1.0, 0.6, 0.3];

  var EN = "qwertyuiop[]asdfghjkl;'zxcvbnm,.`";
  var RU = 'йцукенгшщзхъфывапролджэячсмитьбюё';
  function swapLayout(s) {
    var out = '', i, c, k;
    for (i = 0; i < s.length; i++) {
      c = s[i];
      k = EN.indexOf(c);
      if (k >= 0) { out += RU[k]; continue; }
      k = RU.indexOf(c);
      out += k >= 0 ? EN[k] : c;
    }
    return out;
  }

  function norm(s) {
    return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[«»"'“”„()\[\]{}.,:;!?·•\/\\|]+/g, ' ')
      .replace(/[ \s]+/g, ' ').trim();
  }
  // Грубое отсечение окончаний: «ветеранов» → «ветеран», «детская» → «детск».
  var ENDS = ['иями', 'ями', 'ами', 'ого', 'его', 'ому', 'ему', 'ыми', 'ими', 'ией', 'ая', 'яя', 'ое', 'ее', 'ые', 'ие', 'ый', 'ий', 'ой',
    'ую', 'юю', 'ов', 'ев', 'ей', 'ам', 'ям', 'ах', 'ях', 'ом', 'ем', 'ию', 'ия', 'ии', 'ье', 'ья', 'а', 'я', 'ы', 'и', 'у', 'ю', 'е', 'о', 'ь'];
  function stem(w) {
    if (w.length < 5 || /[a-z0-9]/.test(w)) return w;
    for (var i = 0; i < ENDS.length; i++) {
      var e = ENDS[i];
      if (w.length - e.length >= 4 && w.slice(-e.length) === e) return w.slice(0, -e.length);
    }
    return w;
  }
  // Расстояние Дамерау–Левенштейна с ранним выходом: сколько правок отделяет слово от слова.
  function dist(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (j = 0; j <= b.length; j++) { d[0][j] = j; }
    for (i = 1; i <= a.length; i++) {
      var rowMin = max + 1;
      for (j = 1; j <= b.length; j++) {
        var cost = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        if (d[i][j] < rowMin) rowMin = d[i][j];
      }
      if (rowMin > max) return max + 1;
    }
    return d[a.length][b.length];
  }

  function words(s) {
    var n = norm(s), list = n.split(' '), extra = [];
    // «схема-терапия» ищется и как «схематерапия», и как два слова.
    list.forEach(function (w) { if (w.indexOf('-') > 0) { extra.push(w.replace(/-/g, '')); extra = extra.concat(w.split('-')); } });
    return list.concat(extra).filter(Boolean);
  }
  function toField(ws) { return ws.map(function (w) { return { w: w, s: stem(w) }; }); }
  function phrases(s) { return String(s || '').split(',').map(function (p) { return p.trim(); }).filter(Boolean); }

  function build(cards) {
    return cards.map(function (c) {
      var f = {};
      ['t', 'tg', 'tch', 'sec', 'sub', 'ds'].forEach(function (k) { f[k] = toField(words(c[k] || '')); });
      var groups = (c.tp || []).map(function (g) { return { pos: g[1], terms: phrases(g[0]), field: toField(words(g[0])) }; });
      f.tp = [].concat.apply([], groups.map(function (g) { return g.field; }));
      return { c: c, f: f, groups: groups, tags: phrases(c.tg), teachers: phrases(c.tch) };
    });
  }

  // Насколько слово запроса совпадает с полем: v — сила (1 точно, 0.9 начало слова, 0.85 по основе, 0.6 опечатка),
  // q — надёжность: 3 точно, 2 основа или начало длинного слова, 1 начало короткого слова или опечатка.
  // Короткие слова вроде «окр» в темах и описании ищем только целиком, иначе они цепляют «окружение».
  function matchToken(tok, field, exactShort, curated) {
    // В поисковых словах (curated) начало короткого слова надёжно: «пар» → «пары».
    var best = 0, how = '', q = 0, i, fw, ts = stem(tok), short = tok.length <= 3;
    for (i = 0; i < field.length; i++) {
      fw = field[i];
      if (fw.w === tok) return { v: 1, how: 'exact', q: 3 };
      if (short && exactShort) continue;
      if (tok.length >= 2 && fw.w.indexOf(tok) === 0 && (short ? 0.5 : 0.9) > best) { best = short ? 0.5 : 0.9; how = 'prefix'; q = short && !curated ? 1 : 2; }
      else if (ts.length >= 4 && fw.s === ts && 0.85 > best) { best = 0.85; how = 'stem'; q = 2; }
      else if (tok.length >= 4 && best < 0.6) {
        var max = tok.length >= 7 ? 2 : 1;
        var target = fw.w.length > tok.length + 1 ? fw.w.slice(0, tok.length) : fw.w;
        if (fw.w.length >= 4 && dist(tok, target, max) <= max) { best = 0.6; how = 'typo:' + fw.w; q = 1; }
      }
    }
    return { v: best, how: how, q: q };
  }

  function scoreQuery(index, q) {
    var toks = words(q);
    if (!toks.length) return [];
    var keyToks = toks.filter(function (t) { return STOP.indexOf(t) < 0; });
    var strict = keyToks.length ? keyToks : toks;
    var qn = norm(q);
    var res = [];
    var maxQ = {};
    index.forEach(function (it) {
      var reasons = [];
      strict.forEach(function (tok) {
        var bestTok = 0, bestHow = '', bestField = '', bestQ = 0;
        Object.keys(W).forEach(function (k) {
          var m = matchToken(tok, it.f[k], k === 'ds' || k === 'tp' || k === 'tch', k === 'tg');
          var v = m.v * W[k];
          if (v > bestTok) { bestTok = v; bestHow = m.how; bestField = k; bestQ = m.q; }
        });
        if (bestTok) { reasons.push({ tok: tok, how: bestHow, field: bestField, v: bestTok, q: bestQ }); maxQ[tok] = Math.max(maxQ[tok] || 0, bestQ); }
      });
      res.push({ it: it, reasons: reasons });
    });
    // Опечатки и начала коротких слов считаем, только если точного совпадения по этому слову нет нигде:
    // «родбт» есть у курсов РО ДБТ, значит «родители» в другом курсе не опечатка, а шум.
    var out = [];
    res.forEach(function (r) {
      var it = r.it;
      var reasons = r.reasons.filter(function (z) { return !(z.q < 2 && maxQ[z.tok] >= 2); });
      var total = reasons.reduce(function (a, z) { return a + z.v; }, 0);
      var matchedAll = strict.every(function (tok) { return reasons.some(function (z) { return z.tok === tok; }); });
      // Фраза целиком среди поисковых слов: «дефицит внимания», «стать психологом».
      it.tags.forEach(function (p) { var pn = norm(p); if (pn.indexOf(' ') > 0 && qn.indexOf(pn) >= 0) { total += 2; reasons.push({ tok: pn, how: 'phrase', field: 'tg' }); } });
      // Тема: чем выше курс в списке темы, тем больше бонус.
      var topicBonus = 0;
      it.groups.forEach(function (g) {
        var hit = g.terms.some(function (p) { var pn = norm(p); return pn.indexOf(' ') > 0 && qn.indexOf(pn) >= 0; }) ||
          strict.some(function (tok) { var m = matchToken(tok, g.field, true); return m.how === 'exact' || m.how === 'stem'; });
        if (hit) topicBonus = Math.max(topicBonus, TOPIC_BONUS[g.pos] || 0.1);
      });
      if (!total) return;
      total += topicBonus;
      var c = it.c;
      if (c.st === 'Идёт набор' || c.st === 'Последний шанс') total += 0.4;
      // Флагман чуть выше, но порядок курсов внутри темы важнее.
      if (c.f && !topicBonus) total += 0.3;
      out.push({ c: c, score: total, all: matchedAll, reasons: reasons, it: it, tn: norm(c.t) });
    });
    res = out;
    var full = res.filter(function (r) { return r.all; });
    var list = full.length ? full : res;
    list.sort(function (a, b) { return b.score - a.score; });
    // Отбрасываем хвост: всё, что слабее трети лучшего результата, только мешает.
    if (list.length) { var cut = list[0].score * 0.35; list = list.filter(function (r) { return r.score >= cut; }).slice(0, 8); }
    list.partial = !full.length && res.length > 0;
    list.missed = list.partial ? strict.filter(function (tok) { return !list.some(function (r) { return r.reasons.some(function (z) { return z.tok === tok; }); }); }) : [];
    return list;
  }

  // Ищем как есть и в другой раскладке, берём вариант, который нашёл больше и лучше.
  function search(index, q) {
    var a = scoreQuery(index, q);
    var alt = swapLayout(norm(q));
    var b = alt !== norm(q) ? scoreQuery(index, alt) : [];
    var top = function (l) { return l.length ? l[0].score * (l.partial ? 0.5 : 1) : 0; };
    if (top(b) > top(a) * 1.3) { b.layout = alt; return b; }
    return a;
  }

  // Короткое объяснение, почему курс нашёлся, если это не видно из названия.
  function explain(r) {
    var i, z;
    var pick = function (list, tok) {
      var st = stem(tok);
      return list.filter(function (x) { var xn = norm(x); return xn.indexOf(tok) >= 0 || xn.indexOf(st) >= 0; })[0];
    };
    for (i = 0; i < r.reasons.length; i++) {
      z = r.reasons[i];
      if (z.how.indexOf('typo:') === 0) return 'похоже на «' + z.how.slice(5) + '»';
    }
    for (i = 0; i < r.reasons.length; i++) {
      z = r.reasons[i];
      if (r.tn.indexOf(stem(z.tok)) >= 0) continue;
      if (z.field === 'tch') return 'преподаёт ' + (pick(r.it.teachers, z.tok) || '');
      if (z.field === 'tp') {
        var terms = [].concat.apply([], r.it.groups.map(function (g) { return g.terms; }));
        return 'по теме «' + (pick(terms, z.tok) || z.tok) + '»';
      }
      if (z.field === 'tg' || z.how === 'phrase') return 'по слову «' + (pick(r.it.tags, z.tok) || z.tok) + '»';
    }
    return '';
  }

  // Ответ API /api/public/catalog → записи для build(): карточка, её поисковые слова,
  // преподаватели и темы, в которых она стоит (с местом в теме). Сама карточка — в поле card.
  function fromCatalog(data) {
    var topics = (data && data.topics) || [];
    return ((data && data.cards) || []).map(function (c) {
      var tp = [];
      topics.forEach(function (t) {
        var i = (t.courses || []).indexOf(c.slug);
        if (i >= 0) tp.push([(t.terms || []).join(', '), i]);
      });
      return {
        s: c.slug, t: c.title, sub: c.subtitle || '', sec: c.section, u: c.url, st: c.status, f: !!c.flagship,
        tg: (c.searchWords || []).join(', '), tch: (c.teachers || []).join(', '), tp: tp,
        ds: String(c.description || '').slice(0, 400), card: c,
      };
    });
  }

  root.AspSearch = { build: build, search: search, explain: explain, fromCatalog: fromCatalog, norm: norm, swapLayout: swapLayout };
})(typeof window !== 'undefined' ? window : globalThis);
