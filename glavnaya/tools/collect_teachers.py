#!/usr/bin/env python3
"""
Кто что ведёт: собирает преподавателей со страниц курсов modern-psy.ru и из данных репозитория.

Запуск из apps/preview:
    python3 glavnaya/tools/collect_teachers.py [--cache ПАПКА] [--refresh]

Что делает (ничего на сайте и в CMS не меняет, только читает):
  1. Берёт список страниц курсов из снимка каталога glavnaya/data/catalog-snapshot.json (без вебинаров).
  2. Скачивает каждую страницу (или берёт из папки --cache) и ищет преподавателей:
     разметка для поиска JSON-LD Person → блок данных *teachers-data → блоки Тильды под заголовком
     «Преподаватели / Ведущий / Автор / Тренер».
  3. Добавляет роли, короткие био и фото на S3 из данных репозитория (лендинги, общий каталог профилей, сид CMS).
  4. Сверяет с полем teachers каталога: кого нет на странице или кто есть только в каталоге — помечает «проверить».

Результат:
  glavnaya/data/teachers-collected.json — человек → курсы, роль, био, фото и где лежит фото (s3 / tilda / нет);
  glavnaya/teachers-review.html — страница для проверки глазами (локально, в превью не пушим).
"""
import argparse, html, json, os, re, sys, time, urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent            # glavnaya/tools
GLAV = HERE.parent                                # glavnaya
PREVIEW = GLAV.parent                             # apps/preview
REPO = PREVIEW.parent.parent                      # asp-deploy
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'

S3 = 'https://s3.twcstorage.ru/asp-media/'
# Заголовки блоков с преподавателями на страницах курсов
TEACHER_HEAD = re.compile(r'преподавател|преподаватель|ведущ(ий|ая|ие) (курса|программы)|автор(ы)? (и преподавател|курса|программы)|тренер|лекции читают|обучать (будут|вас)|вас будут обучать|спикер', re.I)
# Блоки, которые похожи на преподавательские, но ими не являются
JUNK_HEAD = re.compile(r'более \d+ преподавател|стать преподавател|наши преподаватели проводят|преподаватель провод|как проходит|вопрос', re.I)
# Блоки после преподавателей, на которых сбор останавливается: отзывы, выпускники, рейтинги
STOP_HEAD = re.compile(r'выпускник|отзыв|истори[яи] студент|как обучение меняет|студентов рекомендуют|наши студенты', re.I)
# Иностранных экспертов на главной не показываем (решение Дарьи 12.10.2026)
FOREIGN = {'джоди бхачу-смит', 'флавио каннистра', 'томас линч', 'люк джордан'}
# Частые имена: по ним понимаем порядок «Фамилия Имя» без отчества
COMMON_FIRST = set('''александр александра алексей алена алёна алина алиса алла анастасия анатолий ангелина андрей анжела анна антон арина
артем артём борис валентина валерия василий вера вероника виктор виктория владимир владислав всеволод галина георгий даниил дана
дарья денис дина дмитрий евгений евгения екатерина елена елизавета жанна злата иван игорь илья ирина иона камилла карина
кирилл кристина кристине ксения лаура лариса лидия любовь людмила максим максимилиан маргарита марина мария марк михаил надежда
наталия наталья никита николай нина оксана олег олеся ольга павел полина регина роман светлана серафима сергей софия станислав
тамара татьяна ульяна федор фёдор элени элина эльвира эмилия юлия юрий яна ярослава вета'''.split())
FIRST_NAMES = set(COMMON_FIRST)
PATRONYMIC = re.compile(r'(вич|вна|ична|чна)$')
NAME_RE = re.compile(r'^([А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?)\s+([А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?)(?:\s+([А-ЯЁ][а-яё]+))?$')
NOT_NAMES = {'академия', 'современной', 'психологии', 'клиника', 'записаться', 'программа', 'курс', 'диплом', 'удостоверение',
             'преподаватели', 'преподаватель', 'ведущий', 'ведущая', 'автор', 'авторы', 'тренер', 'модуль', 'практика', 'терапия'}


# ---------- имена ----------
def norm_word(w):
    return w.lower().replace('ё', 'е')


def split_name(raw):
    """Имя Фамилия без отчества. Понимает порядок «Фамилия Имя Отчество» (так пишет JSON-LD на части страниц)."""
    raw = re.sub(r'\s+', ' ', html.unescape(raw or '')).strip(' ,.')
    words = [w for w in raw.split(' ') if w]
    if len(words) >= 3 and PATRONYMIC.search(norm_word(words[2])):
        return words[1], words[0]                          # Фамилия Имя Отчество
    if len(words) >= 3 and PATRONYMIC.search(norm_word(words[1])):
        return words[0], words[2]                          # Имя Отчество Фамилия
    if len(words) == 2 and norm_word(words[0]) not in FIRST_NAMES and norm_word(words[1]) in FIRST_NAMES:
        return words[1], words[0]                          # Фамилия Имя без отчества
    if len(words) >= 2:
        return words[0], words[-1]
    return (words[0], '') if words else ('', '')


def key_of(raw):
    first, last = split_name(raw)
    return frozenset({norm_word(first), norm_word(last)}) if first and last else None


def display(raw):
    first, last = split_name(raw)
    return f'{first} {last}'.strip()


# ---------- транслит для поиска фото по имени файла на S3 ----------
TR = {'а': ['a'], 'б': ['b'], 'в': ['v'], 'г': ['g'], 'д': ['d'], 'е': ['e'], 'ё': ['e', 'yo'], 'ж': ['zh'], 'з': ['z'],
      'и': ['i'], 'й': ['y', 'i', 'j'], 'к': ['k'], 'л': ['l'], 'м': ['m'], 'н': ['n'], 'о': ['o'], 'п': ['p'], 'р': ['r'],
      'с': ['s'], 'т': ['t'], 'у': ['u'], 'ф': ['f'], 'х': ['h', 'kh'], 'ц': ['c', 'ts'], 'ч': ['ch'], 'ш': ['sh'],
      'щ': ['sch', 'shch'], 'ъ': [''], 'ы': ['y'], 'ь': [''], 'э': ['e'], 'ю': ['yu', 'iu'], 'я': ['ya', 'ia'], '-': ['_', '-', '']}


def translits(word, limit=12):
    out = ['']
    for ch in norm_word(word):
        opts = TR.get(ch, [ch])
        out = [o + v for o in out for v in opts][:limit]
    return set(out)


# ---------- HTML ----------
def strip_tags(s):
    s = re.sub(r'<br\s*/?>', '\n', s, flags=re.I)
    s = re.sub(r'<[^>]+>', ' ', s)
    return re.sub(r'[ \t\xa0]+', ' ', html.unescape(s)).strip()


def clean_html(s):
    """Убираем комментарии, стили и обычные скрипты: в них тоже встречаются слова «преподаватель»."""
    s = re.sub(r'<!--.*?-->', '', s, flags=re.S)
    s = re.sub(r'<style\b.*?</style>', '', s, flags=re.S | re.I)
    s = re.sub(r'<script\b(?![^>]*(application/ld\+json|teachers-data))[^>]*>.*?</script>', '', s, flags=re.S | re.I)
    return s


def best_img(tag):
    """Настоящая картинка: data-original → data-src → src. Уменьшенные превью Тильды пропускаем."""
    for attr in ('data-original', 'data-src', 'data-lazy-src', 'src'):
        m = re.search(attr + r'''\s*=\s*(["'])(.*?)\1''', tag)
        if m and m.group(2) and not re.search(r'/resize/20x|thb\.tildacdn\.com.*?/-/(empty|resizeb)/', m.group(2)):
            url = m.group(2)
            if url.startswith('//'):
                url = 'https:' + url
            if re.search(r'\.(svg|gif)(\?|$)', url, re.I):
                return None
            return url
    return None


def persons_ld(s):
    out = []

    def walk(o):
        if isinstance(o, dict):
            t = o.get('@type')
            if t == 'Person' or (isinstance(t, list) and 'Person' in t):
                img = o.get('image')
                if isinstance(img, dict):
                    img = img.get('url')
                if isinstance(img, list):
                    img = img[0] if img else None
                out.append({'name': o.get('name', ''), 'role': o.get('jobTitle') or '', 'bio': o.get('description') or '', 'photo': img})
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)
    for m in re.finditer(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', s, re.S | re.I):
        try:
            walk(json.loads(m.group(1)))
        except Exception:
            pass
    return out


def teachers_data(s):
    out = []
    for m in re.finditer(r'<script[^>]*id=["\'][^"\']*teachers-data[^"\']*["\'][^>]*>(.*?)</script>', s, re.S | re.I):
        try:
            d = json.loads(m.group(1))
        except Exception:
            continue
        items = d if isinstance(d, list) else next((v for v in d.values() if isinstance(v, list)), [])
        for it in items:
            if isinstance(it, dict) and it.get('name'):
                out.append({'name': it['name'], 'role': it.get('role') or it.get('tag') or '', 'bio': it.get('description') or it.get('bio') or '',
                            'photo': it.get('photo') or it.get('image')})
    return out


def recs(s):
    """Блоки Тильды по порядку: id, html."""
    parts = re.split(r'(?=<div[^>]*\bid=["\']rec\d+)', s)
    return [p for p in parts if re.match(r'<div[^>]*\bid=["\']rec\d+', p)]


def block_people(rec, first_names):
    """Имена, роли и фото внутри блока: текстовые элементы по порядку и картинки рядом с ними."""
    tokens = []   # (pos, kind, value)
    for m in re.finditer(r'<img\b[^>]*>|<div[^>]*\bdata-original=["\'][^"\']+["\'][^>]*>', rec, re.I):
        url = best_img(m.group(0))
        if url:
            tokens.append((m.start(), 'img', url))
    text_html = re.sub(r'<img\b[^>]*>', ' ', rec)
    for m in re.finditer(r'>([^<>]{2,400})<', text_html):
        t = re.sub(r'\s+', ' ', html.unescape(m.group(1))).strip()
        if t and not re.fullmatch(r'[\W\d_]+', t):
            tokens.append((m.start(), 'text', t))
    tokens.sort()
    people = []
    name_count = sum(1 for _, k, t in tokens if k == 'text' and NAME_RE.match(t) and len(t) <= 42)
    texts = [(i, t) for i, t in enumerate(tokens) if t[1] == 'text']
    for idx, (pos, kind, t) in enumerate(tokens):
        if kind != 'text':
            continue
        m = NAME_RE.match(t)
        if not m or len(t) > 42:
            continue
        words = [w for w in m.groups() if w]
        if any(norm_word(w) in NOT_NAMES for w in words):
            continue
        if norm_word(words[0]) not in first_names and norm_word(words[1]) not in first_names:
            continue
        role = ''
        for j in range(idx + 1, min(idx + 6, len(tokens))):
            if tokens[j][1] == 'text' and not NAME_RE.match(tokens[j][2]):
                role = tokens[j][2]
                break
        imgs = [(abs(p - pos), u) for p, k, u in tokens if k == 'img']
        photo = min(imgs)[1] if imgs else None
        # фото по соседству надёжно, только когда в блоке один человек; иначе это догадка
        people.append({'name': t, 'role': role, 'bio': '', 'photo': photo, 'guess': name_count > 1})
    return people


def page_people(s, first_names):
    """Преподаватели страницы: сначала структурированные данные, потом блоки под нужным заголовком."""
    s = clean_html(s)
    found, how = [], []
    ld = persons_ld(s)
    if ld:
        found += ld
        how.append('json-ld')
    td = teachers_data(s)
    if td:
        found += td
        how.append('teachers-data')
    blocks = recs(s)
    for i, rec in enumerate(blocks):
        head = strip_tags(rec)[:300]
        if not TEACHER_HEAD.search(head) or JUNK_HEAD.search(head) or STOP_HEAD.search(head[:120]):
            continue
        taken = 0
        for rec2 in blocks[i:i + 14]:
            head2 = strip_tags(rec2)[:300]
            if rec2 is not rec and (JUNK_HEAD.search(head2) or STOP_HEAD.search(head2)):
                break
            ppl = block_people(rec2, first_names)
            if not ppl and rec2 is not rec and taken:
                break
            if ppl:
                taken += 1
                found += ppl
        if taken:
            how.append('блоки')
    return found, how


def fetch(url, cache, refresh):
    slug = url.rstrip('/').split('/')[-1] or 'index'
    f = cache / f'{slug}.html'
    # ответы меньше 1 КБ — это ошибки сервера (502 и т. п.), их перекачиваем
    if f.exists() and f.stat().st_size > 1000 and not refresh:
        return f.read_text(errors='ignore')
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                data = r.read().decode('utf-8', 'ignore')
            if len(data) > 1000:
                break
        except Exception:
            if attempt == 2:
                raise
        time.sleep(3)
    f.write_text(data)
    time.sleep(0.5)
    return data


# ---------- данные репозитория ----------
def repo_people():
    """Все записи «имя + роль/био/фото» из данных лендингов, общего каталога профилей и сида CMS."""
    rows = []

    def add(name, role='', bio='', photo=None, src=''):
        if name and key_of(name):
            rows.append({'name': name, 'role': as_text(role), 'bio': as_text(bio), 'photo': photo, 'src': src})

    def walk(o, src):
        if isinstance(o, dict):
            name = o.get('name')
            if isinstance(name, str) and NAME_RE.match(re.sub(r'\s+', ' ', name.strip())) or (isinstance(name, str) and key_of(name) and len(name.split()) in (2, 3)):
                photo = o.get('photo') or o.get('image') or o.get('src')
                if isinstance(photo, dict):
                    photo = photo.get('url') or photo.get('src')
                if isinstance(photo, str) and not photo.startswith('http'):
                    photo = None
                add(name, o.get('role') or o.get('tag') or o.get('jobTitle') or '', o.get('description') or o.get('bio') or o.get('short_bio') or '', photo, src)
            for v in o.values():
                walk(v, src)
        elif isinstance(o, list):
            for v in o:
                walk(v, src)

    paths = []
    paths += list((PREVIEW / 'web-academy' / 'shared' / 'academy').glob('teachers*.json'))
    paths += list((PREVIEW / 'web-academy' / 'projects').glob('*/data/*.json'))
    paths += list(PREVIEW.glob('*/data/*.json'))
    paths += [REPO / 'apps' / 'cms' / 'src' / 'seed' / 'teachers.json']
    for p in paths:
        if 'catalog-snapshot' in p.name or 'glavnaya' in str(p) and p.name == 'teachers-collected.json':
            continue
        try:
            walk(json.loads(p.read_text()), str(p.relative_to(REPO)))
        except Exception:
            pass
    # Блоки данных и карточки в HTML-файлах лендингов и пакетов Тильды: <img src=S3 alt="Имя Фамилия">
    html_files = list((PREVIEW / 'web-academy' / 'projects').glob('*/teachers/*.html'))
    html_files += list(PREVIEW.glob('*/tilda/*teacher*.html')) + list((REPO / 'apps' / 'tilda').glob('*/*teacher*.html'))
    html_files += list(PREVIEW.glob('*/index.html'))
    for p in html_files:
        try:
            s = p.read_text(errors='ignore')
        except Exception:
            continue
        src = str(p.relative_to(REPO))
        for m in re.finditer(r'<script[^>]*teachers-data[^>]*>(.*?)</script>', s, re.S):
            try:
                walk(json.loads(m.group(1)), src)
            except Exception:
                pass
        for m in re.finditer(r'<img\b[^>]*>', s):
            tag = m.group(0)
            alt = re.search(r'alt=["\']([^"\']+)["\']', tag)
            url = best_img(tag)
            if alt and url and (S3 in url or 'tildacdn' in url):
                name = re.split(r'[,—–(]', html.unescape(alt.group(1)))[0].strip()
                if NAME_RE.match(name):
                    add(name, '', '', url, src)
    return rows


def s3_files():
    """Все имена файлов asp-media, которые встречаются в репозитории: для поиска фото по имени файла."""
    names = set()
    for base in (PREVIEW, REPO / 'apps' / 'tilda'):
        for p in base.rglob('*'):
            if p.suffix in ('.json', '.html', '.css', '.mjs', '.js') and p.is_file() and p.stat().st_size < 3_000_000:
                try:
                    for m in re.finditer(r'asp-media/([A-Za-z0-9_.-]+\.(?:webp|jpg|jpeg|png))', p.read_text(errors='ignore')):
                        names.add(m.group(1))
                except Exception:
                    pass
    return names


def s3_by_filename(first, last, files, need_first=False):
    if len(last) < 4:
        return None
    lv = translits(last)
    fv = translits(first)
    hits = []
    for f in files:
        low = f.lower()
        first_hit = any(v in low for v in fv if len(v) >= 3)
        role_hit = re.search(r'(teacher|speaker|expert|face|cut)', low)
        if any(v and v in low for v in lv) and (first_hit or (role_hit and not need_first)):
            if not re.search(r'review|cover|hero|bg|og', low):
                hits.append(f)
    if not hits:
        return None
    # предпочитаем «имя_фамилия», затем teacher_/speaker_, обрезки лица и фигуры — в последнюю очередь
    hits.sort(key=lambda f: (('face' in f or 'cut' in f), 'teacher' not in f and not any(v in f.lower() for v in fv), len(f)))
    return S3 + hits[0]


def as_text(v):
    """Роль и био бывают строкой, списком абзацев или объектом — приводим к одной строке."""
    if isinstance(v, list):
        return ' '.join(as_text(x) for x in v).strip()
    if isinstance(v, dict):
        return as_text(v.get('text') or v.get('value') or '')
    return strip_tags(str(v)) if v else ''


def host(url):
    if not url:
        return 'нет'
    if 'twcstorage' in url:
        return 's3'
    if 'tildacdn' in url:
        return 'tilda'
    return 'другое'


# ---------- сборка ----------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cache', default=os.path.join(__import__('tempfile').gettempdir(), 'asp-teacher-pages'))
    ap.add_argument('--refresh', action='store_true', help='скачать страницы заново')
    args = ap.parse_args()
    cache = Path(args.cache)
    cache.mkdir(parents=True, exist_ok=True)

    snap = json.loads((GLAV / 'data' / 'catalog-snapshot.json').read_text())
    courses, seen = [], set()
    for c in snap['cards']:
        url = (c.get('url') or '').split('?')[0].split('#')[0]
        if 'modern-psy.ru/' not in url or c.get('section') == 'Вебинары' or url in seen:
            continue
        seen.add(url)
        # у части карточек слаг служебный (course-marketing-data), поэтому ключ курса — адрес страницы
        courses.append({'slug': url.rstrip('/').split('/')[-1], 'title': c.get('title'), 'url': url, 'section': c.get('section'),
                        'catalog_teachers': [t if isinstance(t, str) else t.get('name', '') for t in (c.get('teachers') or [])]})

    repo = repo_people()
    first_names = {norm_word(split_name(r['name'])[0]) for r in repo} | COMMON_FIRST
    FIRST_NAMES.update(first_names)
    # Студенты из отзывов главной: их имена встречаются на страницах курсов в блоках историй
    students = set()
    try:
        for r in json.loads((GLAV / 'data' / 'trust.json').read_text()).get('reviews', []):
            k = key_of(r.get('name', ''))
            if k:
                students.add(k)
    except Exception:
        pass
    for c in courses:
        for t in c['catalog_teachers']:
            first_names.add(norm_word(split_name(t)[0]))
    files = s3_files()

    people = {}   # key → запись

    def person(raw):
        k = key_of(raw)
        if not k or k in students or ' '.join(sorted(k)) in {' '.join(sorted(key_of(f) or [])) for f in FOREIGN}:
            return None
        if k not in people:
            people[k] = {'name': display(raw), 'variants': set(), 'courses': {}, 'roles': [], 'bios': [], 'photos': [], 'flags': set()}
        p = people[k]
        p['variants'].add(re.sub(r'\s+', ' ', raw.strip()))
        if 'ё' in raw and 'ё' not in p['name']:
            p['name'] = display(raw)
        return p

    report = []
    for c in courses:
        try:
            s = fetch(c['url'], cache, args.refresh)
        except Exception as e:
            report.append((c['slug'], f'ошибка загрузки: {e}', 0))
            continue
        found, how = page_people(s, first_names)
        names_here = set()
        for f in found:
            p = person(f['name'])
            if not p:
                continue
            k = key_of(f['name'])
            names_here.add(k)
            p['courses'].setdefault(c['slug'], {'title': c['title'], 'url': c['url'], 'section': c['section'], 'how': set()})['how'].update(how or ['?'])
            if f.get('role'):
                p['roles'].append(as_text(f['role']))
            if f.get('bio'):
                p['bios'].append(as_text(f['bio']))
            if f.get('photo'):
                p['photos'].append((f['photo'], c['slug'] + (' (догадка)' if f.get('guess') else '')))
        # сверка с каталогом
        for t in c['catalog_teachers']:
            k = key_of(t)
            if k and k not in names_here:
                p = person(t)
                if not p:
                    continue
                p['courses'].setdefault(c['slug'], {'title': c['title'], 'url': c['url'], 'section': c['section'], 'how': set()})['how'].add('только каталог')
                p['flags'].add('в каталоге, но не найден на странице ' + c['slug'])
        cat_keys = {key_of(t) for t in c['catalog_teachers'] if key_of(t)}
        if cat_keys:
            for k in names_here - cat_keys:
                if k in people:
                    people[k]['flags'].add('на странице ' + c['slug'] + ', но нет в каталоге')
        report.append((c['slug'], '+'.join(how) or 'не нашли', len(names_here)))

    # данные репозитория: роли, био, фото
    for r in repo:
        k = key_of(r['name'])
        if k in people:
            p = people[k]
            if r['role']:
                p['roles'].append(r['role'])
            if r['bio']:
                p['bios'].append(r['bio'])
            if r['photo']:
                p['photos'].append((r['photo'], r['src']))

    out = []
    for k, p in people.items():
        first, last = split_name(p['name'])
        sure = [(u, w) for u, w in p['photos'] if 'догадка' not in w]
        guess = [(u, w) for u, w in p['photos'] if 'догадка' in w]
        s3 = next((u for u, _ in sure if 'twcstorage' in u), None)
        s3_how = 'данные репозитория' if s3 else None
        if not s3:
            same_surname = sum(1 for kk in people if norm_word(last) in kk) > 1
            s3 = s3_by_filename(first, last, files, need_first=same_surname)
            if s3:
                s3_how = 'по имени файла, проверить'
        tilda = next((u for u, _ in sure if 'tildacdn' in u), None)
        if not s3 and not tilda and guess:
            tilda = next((u for u, _ in guess if 'tildacdn' in u), None)
            s3 = next((u for u, _ in guess if 'twcstorage' in u), None)
            if s3 or tilda:
                p['flags'].add('фото угадано по соседству в блоке, проверить')
                s3_how = s3_how or ('по соседству, проверить' if s3 else None)
        photo = s3 or tilda
        roles = [r for r in p['roles'] if len(r) <= 80]
        role = max(set(roles), key=roles.count) if roles else ''
        bios = sorted({b.strip() for b in p['bios'] if 30 <= len(b.strip()) <= 400}, key=len)
        out.append({
            'name': p['name'],
            'courses': [{'slug': s, **{kk: (sorted(v) if isinstance(v, set) else v) for kk, v in d.items()}} for s, d in sorted(p['courses'].items())],
            'role': role,
            'bio': bios[0] if bios else '',
            'photo': photo,
            'photo_source': host(photo),
            's3_photo': s3, 's3_how': s3_how,
            'tilda_photo': tilda,
            'flags': sorted(p['flags']),
            'variants': sorted(p['variants']),
        })
    out.sort(key=lambda x: ({'s3': 0, 'tilda': 1}.get(x['photo_source'], 2), split_name(x['name'])[1]))
    data = {'_comment': 'Собрано glavnaya/tools/collect_teachers.py со страниц курсов modern-psy.ru и данных репозитория. Не править руками: перезапустить сборщик.',
            'collected': time.strftime('%Y-%m-%d'), 'pages': [{'slug': s, 'how': h, 'people': n} for s, h, n in report], 'teachers': out}
    (GLAV / 'data' / 'teachers-collected.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    (GLAV / 'teachers-review.html').write_text(review_html(data))
    by = {}
    for t in out:
        by[t['photo_source']] = by.get(t['photo_source'], 0) + 1
    print(f"преподавателей: {len(out)}; фото на S3: {by.get('s3', 0)}, на Тильде: {by.get('tilda', 0)}, без фото: {by.get('нет', 0)}")
    for s, h, n in report:
        if n == 0:
            print(f'  на странице {s} никого не нашли ({h})')


def review_html(data):
    groups = [('s3', 'Фото на S3: готово'), ('tilda', 'Фото на Тильде: нужны свежие фото'), ('нет', 'Без фото')]
    esc = lambda s: html.escape(s or '')
    parts = []
    for code, title in groups:
        rows = [t for t in data['teachers'] if t['photo_source'] == code]
        if not rows:
            continue
        cards = []
        for t in rows:
            img = f'<img src="{esc(t["photo"])}" alt="" loading="lazy">' if t['photo'] else '<span class="nophoto">нет фото</span>'
            courses = ''.join(f'<li><a href="{esc(c["url"])}" target="_blank" rel="noopener">{esc(c["title"])}</a>'
                              + (' <i>только в каталоге</i>' if 'только каталог' in (c.get('how') or []) else '') + '</li>' for c in t['courses'])
            flags = ''.join(f'<li>{esc(f)}</li>' for f in t['flags'])
            if t.get('s3_how') and 'проверить' in t['s3_how']:
                flags += '<li>фото на S3 найдено по имени файла, проверить</li>'
            cards.append(f'''<article class="card"><div class="photo">{img}</div><div class="info">
<h3>{esc(t["name"])}</h3><p class="role">{esc(t["role"]) or "<em>роли нет</em>"}</p>
<p class="bio">{esc(t["bio"])}</p><ul class="courses">{courses}</ul>{f'<ul class="flags">{flags}</ul>' if flags else ''}</div></article>''')
        parts.append(f'<section><h2>{esc(title)} <span>{len(rows)}</span></h2><div class="grid">{"".join(cards)}</div></section>')
    empty = [p for p in data['pages'] if p['people'] == 0]
    empty_html = ''.join(f'<li>{esc(p["slug"])} ({esc(p["how"])})</li>' for p in empty)
    return f'''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Преподаватели: кто что ведёт</title>
<style>
body{{margin:0;padding:2rem 1rem;background:#f5f5f5;color:#1d1d33;font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}}
main{{max-width:72rem;margin:0 auto}} h1{{font-size:1.75rem;margin:0 0 .5rem}} .lead{{color:#585873;margin:0 0 2rem}}
h2{{font-size:1.25rem;margin:2rem 0 1rem}} h2 span{{color:#585873;font-weight:400}}
.grid{{display:grid;gap:.75rem;grid-template-columns:repeat(auto-fill,minmax(20rem,1fr))}}
.card{{display:grid;grid-template-columns:6rem 1fr;gap:1rem;padding:1rem;border-radius:1rem;background:#fff}}
.photo img,.nophoto{{display:grid;place-items:center;width:6rem;height:7.5rem;border-radius:.75rem;object-fit:cover;background:#ebe8fb;color:#585873;font-size:.75rem}}
h3{{margin:0;font-size:1rem}} .role{{margin:.125rem 0 0;color:#585873}} .bio{{margin:.375rem 0 0;font-size:.8125rem;color:#585873}}
.courses,.flags{{margin:.5rem 0 0;padding-left:1rem;font-size:.8125rem}} .courses i{{color:#9a9ab0;font-style:normal}}
.flags{{color:#8a5a00}} a{{color:#4c3888}}
</style></head><body><main><h1>Преподаватели: кто что ведёт</h1>
<p class="lead">Собрано {esc(data["collected"])} со страниц курсов modern-psy.ru и данных репозитория. Курсы со страницы и из каталога, фото по источнику. Жёлтым отмечено, что стоит проверить.</p>
{"".join(parts)}
{f'<section><h2>Страницы, где никого не нашли</h2><ul>{empty_html}</ul></section>' if empty else ''}
</main></body></html>
'''


if __name__ == '__main__':
    main()
