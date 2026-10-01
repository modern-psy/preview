"""Сборка блоков T123. Контент правим в index.html, стили и логику — рядом с ним."""
from pathlib import Path
from html.parser import HTMLParser
import re
import json

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'tilda'
OUT.mkdir(exist_ok=True)
source = (ROOT / 'index.html').read_text()
css = (ROOT / 'style.css').read_text()
js = (ROOT / 'script.js').read_text()

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
names = ['Первый экран и особенности программы', 'Кому подойдёт курс',
         'Когда отдельных техник недостаточно', 'До и после курса',
         'Результаты обучения', 'Программа курса', 'Преподаватели',
         'Удостоверение', 'Об Академии', 'Стоимость курса',
         'Форма заявки', 'Условия оплаты', 'Частые вопросы']
assert len(parser.sections) == len(names) == 13
files = []
def write(name, text, title):
    assert len(text) < 65000, (name, len(text))
    (OUT / name).write_text(text)
    files.append({'file': name, 'title': title, 'characters': len(text)})
    return text

# Подключения из исходного HTML сохраняем один раз на всю страницу.
links = re.findall(r'<link\b[^>]*>', source)
links = [link for link in links if './style.css' not in link]
cut = css.index('\n.trauma-page {')
styles_a = write('00-styles-base.html', '<!-- ОБЩИЕ СТИЛИ 1/2. Первый T123, один раз на странице. -->\n' + '\n'.join(links) + '\n<style>\n' + css[:cut] + '\n</style>\n', 'Общие стили 1/2')
styles_b = write('01-styles-page.html', '<!-- ОБЩИЕ СТИЛИ 2/2. Второй T123, один раз на странице. -->\n<style>\n' + css[cut:] + '\n/* Обёртки отдельных секций не должны получать высоту целого экрана. */\n.academy-page[data-trauma-block] { min-height: 0; }\n</style>\n', 'Общие стили 2/2')
blocks = []
for index, ((attrs, markup), title) in enumerate(zip(parser.sections, names), 1):
    slug = attrs['class'].split()[0].removeprefix('section_')
    anchor = ' id="main-content" tabindex="-1"' if index == 1 else ''
    text = f'<!-- СЕКЦИЯ {index:02d}: {title}. Вставить целиком в отдельный T123. -->\n<div class="main-wrapper academy-page trauma-page" data-trauma-block="{slug}"{anchor}>\n{markup}\n</div>\n'
    blocks.append(write(f'{index+1:02d}-{slug}.html', text, title))

# Tilda размещает T123 внутри #allrecords. Инициализация должна видеть все секции.
old_roots = ['const page = document.querySelector(".academy-page");', "const page = document.querySelector('[data-page=\"trauma-therapy\"], .trauma-page');"]
assert js.count(old_roots[0]) == 1 and js.count(old_roots[1]) == 2
for old in old_roots:
    js = js.replace(old, 'const page = document.querySelector("[data-trauma-block]")?.closest("#allrecords") || document.body;')
for selector in ['[data-cta-grid]', '[data-accordion]', '[data-academy-slider]', '[data-trauma-lead-form]']:
    js = js.replace(f'page.querySelectorAll("{selector}")', f'page.querySelectorAll("[data-trauma-block] {selector}")')
js = js.replace('!link ||', '!link ||\n      !link.closest("[data-trauma-block]") ||')
external = re.findall(r'<script\s+src="https://[^\"]+"\s+defer></script>', source)
external = [tag.replace(' defer', '') for tag in external]
# Если T123 выполняется до окончания парсинга страницы, ждём весь DOM.
runtime = '\n'.join(external) + '\n<script>\n(() => {\nconst initialize = () => {\n' + js + '\n};\nif (document.readyState === "loading") {\n  document.addEventListener("DOMContentLoaded", initialize, { once: true });\n} else {\n  initialize();\n}\n})();\n</script>\n'
scripts = write('15-scripts.html', '<!-- ОБЩИЕ СКРИПТЫ. Последний T123, после всех секций и нативной формы Tilda. -->\n' + runtime, 'Общие скрипты')
preview = '<!doctype html>\n<html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Терапия травмы — проверка блоков T123</title></head><body><div id="allrecords">\n'
for block in [styles_a, styles_b, *blocks, scripts]:
    preview += '<div class="t-rec"><div class="t123"><div class="t-container_100"><div class="t-width t-width_100">\n' + block + '</div></div></div></div>\n'
preview += '</div></body></html>\n'
(OUT / 'preview.html').write_text(preview)
(OUT / 'manifest.json').write_text(json.dumps(files, ensure_ascii=False, indent=2) + '\n')
# Секции сохраняются дословно; уникальные ID не теряются и не дублируются.
original_ids = re.findall(r'\bid="([^"]+)"', source)
export_ids = re.findall(r'\bid="([^"]+)"', ''.join(blocks))
assert sorted(original_ids) == sorted(export_ids)
assert len(export_ids) == len(set(export_ids))
print(f'Готово: {len(blocks)} секций, 2 блока стилей, 1 блок скриптов. ID сохранены, каждый T123 меньше 65 000 символов.')
