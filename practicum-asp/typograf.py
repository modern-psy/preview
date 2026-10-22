"""Типограф для статичного текста лендинга Практикума.

Что делает: ставит неразрывный пробел (&nbsp;) после коротких предлогов
и союзов, перед частицами бы/же/ли и между числом и словом. Меняет только
текст между тегами: атрибуты (alt, href), скрипты, стили и svg не трогает.
Можно запускать повторно: уже поставленные &nbsp; не дублируются.

Запуск:  python3 typograf.py index.html
Если рядом лежит kit/assets/logo-practicum.svg, вставляет его вместо {{LOGO}}.
"""
import pathlib
import re
import sys

SHORT = 'а|в|и|к|о|с|у|я|во|до|за|из|на|не|ни|но|об|от|по|со|без|для|над|под|при|про'
RE_SHORT = re.compile(r'(?<![\w\-])(' + SHORT + r') (?=\S)', re.IGNORECASE)
RE_PARTICLE = re.compile(r' (бы|же|ли)(?![\w\-])', re.IGNORECASE)
RE_NUMBER = re.compile(r'(\d+\+?) (?=[А-Яа-яЁёA-Za-z])')
SKIP = ('script', 'style', 'svg', 'code', 'pre', 'title')


def fix_text(text):
    for _ in range(2):  # два прохода: «в и в» подряд
        text = RE_SHORT.sub(r'\1&nbsp;', text)
    text = RE_PARTICLE.sub(r'&nbsp;\1', text)
    text = RE_NUMBER.sub(r'\1&nbsp;', text)
    return text


def typograf(html):
    # Комментарии целиком считаем тегом: внутри них бывают куски разметки
    parts = re.split(r'(<!--.*?-->|<[^>]+>)', html, flags=re.DOTALL)
    skip_depth = 0
    out = []
    for part in parts:
        if part.startswith('<'):
            name = None if part.startswith('<!--') else re.match(r'</?\s*([a-zA-Z0-9-]+)', part)
            tag = name.group(1).lower() if name else ''
            if tag in SKIP and not part.endswith('/>'):
                skip_depth += -1 if part.startswith('</') else 1
            out.append(part)
        else:
            out.append(part if skip_depth > 0 else fix_text(part))
    return ''.join(out)


def main():
    target = pathlib.Path(sys.argv[1])
    html = target.read_text(encoding='utf-8')
    logo = target.parent / 'kit' / 'assets' / 'logo-practicum.svg'
    if '{{LOGO}}' in html and logo.exists():
        svg = re.sub(r'<\?xml[^>]*>', '', logo.read_text(encoding='utf-8')).strip()
        svg = svg.replace('fill="#0A0A0A"', 'fill="currentColor"')
        svg = svg.replace('<svg ', '<svg aria-hidden="true" focusable="false" ', 1)
        svg = re.sub(r'\s+', ' ', svg)
        html = html.replace('{{LOGO}}', svg)
    target.write_text(typograf(html), encoding='utf-8')
    print('готово:', target)


if __name__ == '__main__':
    main()
