"""Собрать локальный пакет T123. Править исходные index.html и style.css, не файлы tilda/."""
from pathlib import Path
from copy import deepcopy
from bs4 import BeautifulSoup
import re, json, hashlib
ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'tilda'
OUT.mkdir(exist_ok=True)
soup = BeautifulSoup((ROOT / 'index.html').read_text(), 'html.parser')
urls = [
'https://static.tildacdn.com/tild3063-3830-4339-a336-633338353137/1.jpg',
'https://static.tildacdn.com/tild3530-3337-4431-b632-353763623263/2.jpg',
'https://static.tildacdn.com/tild3430-3635-4365-a130-393066353834/3.jpg',
'https://static.tildacdn.com/tild6165-3030-4130-b334-613839633738/4.jpg']
for image in soup.select('img'):
    match = re.fullmatch(r'(?:\./)?assets/signature-(\d).jpg', image['src'])
    assert match, image
    image['src'] = urls[int(match[1])-1]
for node in soup.select('[id]'):
    old = node['id']; node['id'] = 'oferta-' + old
    for link in soup.select(f'a[href="#{old}"]'): link['href'] = '#' + node['id']

# Изолируем общие правила: они действуют только внутри экспортных обёрток оферты.
css = re.sub(r'/\*.*?\*/', '', (ROOT / 'style.css').read_text(), flags=re.S)
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
        selector=re.sub(r'^(:root|html|body)(?=[\s.:#\[]|$)', '.oferta-tilda', selector)
        if not selector.startswith('.oferta-tilda'): selector='.oferta-tilda '+selector
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
            elif ch in '\"\'': quote=ch
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
scoped.append('.oferta-tilda[data-oferta-part],.oferta-tilda .offer_page{min-height:0;height:auto;}\n')
# Тильда снимает подчёркивание у всех ссылок через #allrecords a, поэтому подчёркивание тоже с !important.
scoped.append('.oferta-tilda{background:var(--bg-surface);}.oferta-tilda .text-link{color:var(--text-accent)!important;text-decoration:underline!important;}\n')
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

groups=soup.select_one('.padding-section-small').find_all(recursive=False)
second=list(groups[1].find_all(recursive=False))
heading=groups[1].select_one('.offer_appendix-heading')
first=''.join(str(n) for n in groups[0].contents)+''.join(str(n) for n in second[:second.index(heading)])
sections=[('Оферта и реквизиты',first)]
table=groups[1].select_one('.offer_table.is-programs')
rows=table.select('tbody > tr')
# Приложение № 1 делится по целым строкам, чтобы каждый блок помещался в T123.
for chunk_index in range(0,len(rows),24):
    copy=deepcopy(table)
    copy.tbody.clear()
    for row in rows[chunk_index:chunk_index+24]: copy.tbody.append(deepcopy(row))
    content=(str(heading) if chunk_index==0 else '')+'<div class="offer_table-scroll">'+str(copy)+'</div>'
    if chunk_index+24>=len(rows):
        content+=str(second[-1])+''.join(str(n) for n in groups[2].find_all(recursive=False)[:2])
    sections.append(('Приложение № 1'+(' — продолжение' if chunk_index else ''),content))
for section in groups[2].find_all('section',recursive=False):
    sections.append((section.select_one('.offer_appendix-heading').get_text(' ',strip=True).split('к\xa0')[0].strip(),str(section)))
sections[-1] = (sections[-1][0], sections[-1][1] + str(soup.select_one('footer')))
bodies=[]
for i,(title,content) in enumerate(sections,1):
    padding='padding-top:var(--section-small);' if i==1 else ''
    if i==len(sections): padding+='padding-bottom:var(--section-small);'
    fragment=f'<!-- Секция {i:02}: {title} -->\n<div class="oferta-tilda" data-oferta-part="{i}" style="{padding}"><div class="page-wrapper academy-page offer_page"><main class="main-wrapper"><section class="section_offer"><div class="padding-global"><div class="container-small"><div class="offer_group">{content}</div></div></div></section></main></div></div>\n'
    # Читаемая разметка без разделения фраз и текста внутри строк.
    fragment=re.sub(r'>\s*<(section|h[1-3]|p|table|thead|tbody|tr|td|th|div|img|/section|/table|/thead|/tbody|/tr)',r'>\n<\1',fragment)
    bodies.append(write(f'{i:02}-BODY.html',fragment,title))
preview='<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Оферта — проверка T123</title><style>body{margin:0}#allrecords a{color:#ff0000;text-decoration:none}#allrecords p{margin:0}</style></head><body><div id="allrecords">'+''.join('<div class="t-rec">'+f+'</div>' for f in style_fragments+bodies)+'</div></body></html>'
(OUT/'preview.html').write_text(preview)
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(OUT/'README.md').write_text('''# Оферта для Тильды

1. Добавьте блоки T123 «HTML-код» и вставьте содержимое STYLE-файлов по порядку, один раз.
2. После них вставьте 01-BODY.html и остальные BODY-файлы по порядку — каждый в отдельный T123.
3. У всех этих блоков установите верхний и нижний отступы 0. Внутренние отступы уже заданы.
4. Title, description и адрес страницы настройте средствами Тильды. В пакет не включены локальные noindex и canonical.

Приложение № 1 разбито на три последовательных блока по целым программам из-за лимита T123. Остальные приложения — каждое отдельным блоком. Текст единый, строки не дублируются.

Стили ограничены обёрткой oferta-tilda. Шрифт Wix Madefor Text — Google Fonts; сканы подписей — исходные постоянные Tilda CDN URL. Локальных путей и JavaScript нет.

preview.html собран из тех же фрагментов, с проверочными глобальными стилями Тильды. После вставки проверьте опубликованную страницу на телефоне и десктопе.

Повторная сборка: python3 apps/preview/oferta/build-tilda.py из корня репозитория. Править нужно исходные index.html и style.css, затем пересобирать.
''')
print(json.dumps([{'file':m['file'],'bytes':m['bytes']} for m in manifest],ensure_ascii=False))
