"""Сборка блоков T123 для мини-курса «Знакомство с КПТ Оксфордская модель».
Контент правим в index.html, стили в style.css, логику в script.js; tilda/ генерируется."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'tilda'
OUT.mkdir(exist_ok=True)
SLUG = 'cbt-oxford-intro'
PAGE_CLASS = f'{SLUG}-page'
PART = f'data-{SLUG}-part'
LIMIT = 65000
source = (ROOT / 'index.html').read_text()
css = (ROOT / 'style.css').read_text()
js = (ROOT / 'script.js').read_text()

for forbidden in ('../../shared/', 'localhost', '127.0.0.1', 'src="assets/', 'src="./assets/'):
    assert forbidden not in source and forbidden not in css and forbidden not in js, forbidden


class Sections(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=False)
        self.offsets = [0]
        for line in text.splitlines(keepends=True):
            self.offsets.append(self.offsets[-1] + len(line))
        self.sections = []
        self.depth = 0

    def position(self):
        line, column = self.getpos()
        return self.offsets[line - 1] + column

    def handle_starttag(self, tag, attrs):
        if tag == 'section':
            if self.depth == 0:
                self.start = self.position()
                self.attrs = dict(attrs)
            self.depth += 1

    def handle_endtag(self, tag):
        if tag == 'section':
            self.depth -= 1
            if self.depth == 0:
                self.sections.append((self.attrs, source[self.start:self.position() + len('</section>')]))


parser = Sections(source)
parser.feed(source)
names = ['Первый экран', 'Кому подойдёт мини-курс', 'После мини-курса вы сможете',
         'Как устроен мини-курс', 'Программа', 'Ведущие мини-курса', 'Грант', 'Форма заявки', 'Об Академии']
assert len(parser.sections) == len(names) == 9, len(parser.sections)

files = []


def write(name, text, title, placement):
    assert len(text) < LIMIT, (name, len(text))
    (OUT / name).write_text(text)
    files.append({'file': name, 'title': title, 'placement': placement, 'characters': len(text),
                  'sha256': hashlib.sha256(text.encode()).hexdigest()})
    return text


def split_css(text, limit):
    """Режем CSS только между правилами верхнего уровня, не внутри @media."""
    chunks, current, depth, buffer = [], '', 0, ''
    for line in text.splitlines(keepends=True):
        buffer += line
        depth += line.count('{') - line.count('}')
        if depth == 0 and line.strip().endswith('}'):
            if len(current) + len(buffer) > limit:
                chunks.append(current)
                current = ''
            current += buffer
            buffer = ''
    assert depth == 0 and not buffer.strip(), 'CSS не закрыт'
    chunks.append(current)
    return chunks


# Подключения шрифтов и CDN-стилей из исходного HTML сохраняем один раз на страницу.
links = [link for link in re.findall(r'<link\b[^>]*>', source) if './style.css' not in link]
tilda_note = f'\n/* Обёртки отдельных секций не должны получать высоту целого экрана. */\n.academy-page[{PART}] {{ min-height: 0; }}\n'
css_chunks = split_css(css + tilda_note, LIMIT - 2500)
style_blocks = []
for index, chunk in enumerate(css_chunks):
    head = '\n'.join(links) + '\n' if index == 0 else ''
    text = (f'<!-- ОБЩИЕ СТИЛИ {index + 1}/{len(css_chunks)}. Ставить первыми, один раз на странице. -->\n'
            + head + '<style>\n' + chunk + '</style>\n')
    style_blocks.append(write(f'{index:02d}-styles.html', text, f'Общие стили {index + 1}/{len(css_chunks)}', 'body'))

blocks = []
offset = len(style_blocks)
for index, ((attrs, markup), title) in enumerate(zip(parser.sections, names), 1):
    slug = attrs['class'].split()[0].removeprefix('section_')
    anchor = ' id="main-content" tabindex="-1"' if index == 1 else ''
    text = (f'<!-- СЕКЦИЯ {index:02d}: {title}. Вставить целиком в отдельный T123, поля T123 сверху и снизу — 0. -->\n'
            f'<div class="main-wrapper academy-page {PAGE_CLASS}" {PART}="{slug}"{anchor}>\n{markup}\n</div>\n')
    blocks.append(write(f'{index + offset - 1:02d}-{slug}.html', text, title, 'body'))

# Скрипты: CDN-библиотеки без defer, затем вся логика, которая ждёт готовности DOM.
external = [tag.replace(' defer', '') for tag in re.findall(r'<script\s+src="https://[^"]+"\s+defer></script>', source)]
runtime = ('\n'.join(external) + '\n<script>\n(() => {\nconst initialize = () => {\n' + js +
           '\n};\nif (document.readyState === "loading") {\n  document.addEventListener("DOMContentLoaded", initialize, { once: true });\n} else {\n  initialize();\n}\n})();\n</script>\n')
scripts = write(f'{len(style_blocks) + len(blocks):02d}-scripts.html',
                '<!-- ОБЩИЕ СКРИПТЫ. Последний T123, после всех секций. -->\n' + runtime, 'Общие скрипты', 'body')

preview = ('<!doctype html>\n<html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
           '<meta name="robots" content="noindex,nofollow"><title>Знакомство с КПТ Оксфордская модель — проверка блоков T123</title></head>'
           '<body><div id="allrecords">\n')
for block in [*style_blocks, *blocks, scripts]:
    preview += '<div class="t-rec"><div class="t123"><div class="t-container_100"><div class="t-width t-width_100">\n' + block + '</div></div></div></div>\n'
preview += '</div></body></html>\n'
(OUT / 'preview.html').write_text(preview)
(OUT / 'manifest.json').write_text(json.dumps(files, ensure_ascii=False, indent=2) + '\n')

# Устаревшие файлы прошлой сборки удаляем по белому списку имён.
keep = {entry['file'] for entry in files} | {'preview.html', 'manifest.json', 'README.md'}
for stale in OUT.iterdir():
    if stale.name not in keep:
        stale.unlink()

# Секции сохраняются дословно; уникальные ID не теряются и не дублируются.
original_ids = re.findall(r'(?<![\w-])id="([^"]+)"', source)
export_ids = re.findall(r'(?<![\w-])id="([^"]+)"', ''.join(blocks))
assert sorted(original_ids) == sorted(export_ids), set(original_ids) ^ set(export_ids)
assert len(export_ids) == len(set(export_ids))
print(f'Готово: {len(blocks)} секций, {len(style_blocks)} блока стилей, 1 блок скриптов. '
      f'ID сохранены, каждый T123 меньше {LIMIT} символов.')
