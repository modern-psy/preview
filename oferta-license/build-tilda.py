"""Собрать пакет T123 для Тильды. Править исходные index.html, style.css и page.css, не файлы tilda/.

Запуск из корня репозитория: python3 apps/preview/oferta-license/build-tilda.py
Устроено так же, как apps/preview/oferta/build-tilda.py: стили закрыты обёрткой,
картинки берутся с S3, страница режется на блоки T123.
"""
from pathlib import Path
from bs4 import BeautifulSoup
import re, json, hashlib, zipfile

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'tilda'
OUT.mkdir(exist_ok=True)
WRAPPER = 'oferta-license-tilda'      # класс-обёртка: стили действуют только внутри неё
ID_PREFIX = 'oferta-license-'         # приставка к id, чтобы якоря не пересеклись с другими блоками

# Подписи со сканов PDF, загружены на S3. Если файл перезальют, поменять ссылку здесь.
ASSET_URLS = {
    'assets/signature-1.jpg': 'https://s3.twcstorage.ru/asp-media/signature_1_ad73e5616c.jpg',
    'assets/signature-2.jpg': 'https://s3.twcstorage.ru/asp-media/signature_2_106b38022c.jpg',
}

soup = BeautifulSoup((ROOT / 'index.html').read_text(), 'html.parser')
for image in soup.select('img'):
    src = re.sub(r'^\./', '', image['src'])
    assert src in ASSET_URLS, image
    image['src'] = ASSET_URLS[src]
for node in soup.select('[id]'):
    old = node['id']; node['id'] = ID_PREFIX + old
    for link in soup.select(f'a[href="#{old}"]'): link['href'] = '#' + node['id']
    for ref in soup.select(f'[aria-labelledby="{old}"]'): ref['aria-labelledby'] = node['id']

# Общие правила закрываем обёрткой, чтобы они не задели остальную страницу Тильды.
css = '\n'.join((ROOT / name).read_text() for name in ('style.css', 'page.css'))
css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
def selectors(value):
    parts=[]; start=0; depth=0
    for i,c in enumerate(value):
        if c in '([': depth+=1
        elif c in ')]': depth-=1
        elif c==',' and depth==0: parts.append(value[start:i].strip()); start=i+1
    return parts+[value[start:].strip()]
def scope(value):
    out=[]
    for selector in selectors(value):
        if selector.startswith('body:has('): continue
        selector=re.sub(r'^(:root|html|body)(?=[\s.:#\[]|$)', '.'+WRAPPER, selector)
        if not selector.startswith('.'+WRAPPER): selector='.'+WRAPPER+' '+selector
        out.append(selector)
    return ','.join(out)
def rules(text):
    result=[]; cursor=0
    while cursor<len(text):
        opening=text.find('{',cursor)
        if opening<0: break
        head=text[cursor:opening].strip(); depth=1; end=opening+1; quote=None
        while depth:
            ch=text[end]
            if quote:
                if ch==quote and text[end-1]!='\\': quote=None
            elif ch in '"\'': quote=ch
            elif ch=='{': depth+=1
            elif ch=='}': depth-=1
            end+=1
        body=text[opening+1:end-1]
        if head.startswith(('@media','@supports','@layer')): body=''.join(rules(body))
        elif not head.startswith('@'): head=scope(head)
        if head: result.append(head+'{'+re.sub(r'\s+',' ',body).strip()+'}\n')
        cursor=end
    return result
scoped=rules(css)
scoped.append(f'.{WRAPPER}[data-oferta-part],.{WRAPPER} .offer_page{{min-height:0;height:auto;}}\n')
# custom.css сайта ставит ссылкам color: inherit !important, а Тильда снимает подчёркивание
# у всех ссылок через #allrecords a. Поэтому цвет и подчёркивание ссылки тоже с !important.
scoped.append(f'.{WRAPPER}{{background:var(--bg-surface);}}.{WRAPPER} .text-link{{color:var(--text-accent)!important;text-decoration:underline!important;}}\n')

manifest=[]
def write(name,content,title):
    assert len(content.encode())<65000, (name,len(content.encode()))
    assert not re.search(r'(localhost|127\.0\.0\.1|src="(?:\./)?assets/)',content)
    (OUT/name).write_text(content)
    manifest.append({'file':name,'title':title,'bytes':len(content.encode()),'sha256':hashlib.sha256(content.encode()).hexdigest()})
    return content

fonts='\n'.join(str(n) for n in soup.head.select('link') if 'fonts.' in n.get('href',''))
styles=[]; batch=''
for rule in scoped:
    if len((batch+rule).encode())>55000:
        styles.append(batch); batch=''
    batch+=rule
if batch: styles.append(batch)
style_fragments=[]
for i,part in enumerate(styles,1):
    style_fragments.append(write(f'STYLE-{i:02}.html',f'<!-- Общие стили {i}/{len(styles)}. Вставить один раз перед содержимым. -->\n'+(fonts if i==1 else '')+'\n<style>\n'+part+'</style>\n','Общие стили'))

# Блок 1: оферта, договор, реквизиты и первая подпись. Блок 2: Приложение № 1 и подвал.
group=soup.select_one('.padding-section-small > .offer_group')
appendix=group.select_one('section.is-appendix')
first=''.join(str(n) for n in group.contents if n is not appendix)
sections=[('Оферта и договор',first),('Приложение № 1. Правила общения',str(appendix)+str(soup.select_one('footer')))]
bodies=[]
for i,(title,content) in enumerate(sections,1):
    padding='padding-top:var(--section-small);' if i==1 else ''
    if i==len(sections): padding+='padding-bottom:var(--section-small);'
    fragment=f'<!-- Секция {i:02}: {title} -->\n<div class="{WRAPPER}" data-oferta-part="{i}" style="{padding}"><div class="page-wrapper academy-page offer_page"><main class="main-wrapper"><section class="section_offer"><div class="padding-global"><div class="container-small"><div class="offer_group">{content}</div></div></div></section></main></div></div>\n'
    # Читаемая разметка: каждый абзац с новой строки, текст внутри строк не трогаем.
    fragment=re.sub(r'>\s*<(section|h[1-3]|p|table|thead|tbody|tr|td|th|div|img|footer|/section|/table|/thead|/tbody|/tr)',r'>\n<\1',fragment)
    bodies.append(write(f'{i:02}-BODY.html',fragment,title))

preview='<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Лицензионная оферта, проверка T123</title><style>body{margin:0}#allrecords a{color:#ff0000;text-decoration:none}#allrecords p{margin:0}</style></head><body><div id="allrecords">'+''.join('<div class="t-rec">'+f+'</div>' for f in style_fragments+bodies)+'</div></body></html>'
(OUT/'preview.html').write_text(preview)
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(OUT/'README.md').write_text(f'''# Лицензионная оферта для Тильды

1. Добавьте блоки T123 «HTML-код» и вставьте содержимое STYLE-файлов по порядку, один раз.
2. После них вставьте 01-BODY.html и 02-BODY.html по порядку, каждый в отдельный T123.
3. У всех этих блоков установите верхний и нижний отступы 0. Внутренние отступы уже заданы.
4. Title, description и адрес страницы настройте средствами Тильды. noindex и canonical в пакет не входят.

01-BODY: оферта, договор, реквизиты и подпись. 02-BODY: Приложение № 1 «Правила общения» с подписью и подвал.

Стили ограничены обёрткой {WRAPPER}. Шрифт Wix Madefor Text с Google Fonts, подписи с печатью на S3 (asp-media).
Локальных путей и JavaScript нет.

preview.html собран из тех же фрагментов, с проверочными глобальными стилями Тильды (красные ссылки без подчёркивания):
если ссылки в превью фиолетовые и подчёркнуты, защита от стилей Тильды работает.

Повторная сборка: python3 apps/preview/oferta-license/build-tilda.py из корня репозитория.
Править нужно исходные index.html, style.css и page.css, затем пересобирать.
''')

# Архив для передачи: папка oferta-license-tilda со всеми файлами пакета.
with zipfile.ZipFile(ROOT/'oferta-license-tilda.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(OUT.iterdir()):
        archive.write(path, f'oferta-license-tilda/{path.name}')
print(json.dumps([{'file':m['file'],'bytes':m['bytes']} for m in manifest],ensure_ascii=False))
