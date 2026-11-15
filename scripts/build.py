"""Build the Arabic book website with Python's standard library."""
import json
import shutil
from html import escape
from pathlib import Path
from string import Template

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist'
LAYOUT = Template((ROOT / 'templates/page.html').read_text())
ICONS = {
    'bulb': '<path d="M9 18c0-3-4-4-4-9a7 7 0 0 1 14 0c0 5-4 6-4 9M9 18h6M9 21h6M12 18v-7m-3-2 3 2 3-2"/>',
    'signal': '<path d="M3 8a14 14 0 0 1 18 0M6 12a9 9 0 0 1 12 0m-9 4a4 4 0 0 1 6 0"/><circle cx="12" cy="20" r="1"/>',
    'medical': '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M9 5V3h6v2m-3 5v7m-3-3.5h6"/>',
    'wheel': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M12 3v7m0 4v7M3 12h7m4 0h7M6 6l4 4m4 4 4 4M6 18l4-4m4-4 4-4"/>',
    'circuit': '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4M10 10h4v4h-4z"/>',
}


def icon(name):
    return '<span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + '</svg></span>'


def page(path, title, content):
    target = OUT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    depth = len(Path(path).parts) - 1
    target.write_text(LAYOUT.substitute(title=escape('رحلة التكنولوجيا | الصف السادس الأساسي' if title == 'الرئيسية' else title), root='../' * depth, content=content))


def card(title, label, symbol, href=None):
    tag = 'a' if href else 'article'
    attrs = f' href="{escape(href)}"' if href else ''
    classes = 'card card-link available' if href else 'card'
    bottom = '<span>ابدأ الاستكشاف</span><span aria-hidden="true">←</span>' if href else '<span class="badge">قيد الإعداد</span>'
    return f'<{tag} class="{classes}"{attrs}><div class="card-top">{icon(symbol)}<span class="number">{escape(label)}</span></div><h3>{escape(title)}</h3><div class="card-bottom">{bottom}</div></{tag}>'


ART = '''<div class="illustration" aria-hidden="true"><svg viewBox="0 0 400 300" fill="none"><circle cx="200" cy="142" r="114" stroke="#b7cfc5" stroke-dasharray="4 9"/><circle cx="200" cy="142" r="80" stroke="#c5d8cc"/><g transform="rotate(-8 200 150)"><rect x="118" y="65" width="154" height="184" rx="12" fill="#172e43"/><path d="M136 65v184" stroke="#59717c" stroke-width="2"/><rect x="155" y="89" width="94" height="104" rx="42" fill="#e9c887"/><path d="M187 149c0-10-12-12-12-24a22 22 0 0 1 44 0c0 12-12 14-12 24m-20 0h20m-18 8h16m-12 8h8m-4-16v-20m-7-8 7 8 7-8" stroke="#172e43" stroke-width="4" stroke-linecap="round"/><path d="M158 214h87m-87 12h59" stroke="#f8f5ed" stroke-width="5" stroke-linecap="round"/></g><circle cx="82" cy="104" r="28" fill="#fffdf8"/><path d="M68 101a21 21 0 0 1 28 0m-22 7a12 12 0 0 1 16 0m-10 7h4" stroke="#18796f" stroke-width="3" stroke-linecap="round"/><circle cx="312" cy="207" r="32" fill="#18796f"/><circle cx="312" cy="207" r="18" stroke="#fffdf8" stroke-width="2"/><path d="M312 189v36m-18-18h36m-31-13 26 26m-26 0 26-26" stroke="#fffdf8" stroke-width="2"/><path d="M303 68v20m-10-10h20M74 218v14m-7-7h14" stroke="#b39860" stroke-width="3" stroke-linecap="round"/></svg><span class="art-label">فكرة صغيرة، واكتشاف جديد</span></div>'''


def characters(scene):
    poses = [('lin', 'welcome', 'لين ترحّب بك'), ('yazan', 'welcome', 'يزن يرحّب بك')] if scene == 'home' else [('lin', 'point', 'لين تشير نحو دروس الوحدة'), ('yazan', 'pulley', 'يزن يحمل نموذج بكرة')]
    prefix = 'assets/' if scene == 'home' else '../../assets/'
    figures = ''.join(f'<figure><character-guide character="{name}" pose="{pose}" assets="{prefix}characters/"><img src="{prefix}characters/{name}-{pose}.png" alt="{alt}" width="256" height="360"></character-guide><figcaption>{alt}</figcaption></figure>' for name, pose, alt in poses)
    return f'<div class="guides" aria-label="رفيقا الرحلة لين ويزن">{figures}</div>'


def build():
    OUT.mkdir(exist_ok=True)
    shutil.copytree(ROOT / 'assets', OUT / 'assets', dirs_exist_ok=True)
    book = json.loads((ROOT / 'units/book.json').read_text())
    cards = []
    for number, entry in enumerate(book, 1):
        unit = None
        if 'directory' in entry:
            unit = json.loads((ROOT / 'units' / entry['directory'] / 'unit.json').read_text())
        href = f'units/{unit["slug"]}/index.html' if unit else None
        cards.append(card(entry['title'], f'الوحدة {number:02}', entry['icon'], href))
        if unit:
            unit_path = f'units/{unit["slug"]}'
            lesson_cards = []
            for lesson_number, lesson in enumerate(unit['lessons'], 1):
                title = escape(lesson['title'])
                lesson_cards.append(card(lesson['title'], f'الدرس {lesson_number:02}', lesson['icon'], f'{lesson["slug"]}.html'))
                content = f'''<nav class="breadcrumb" aria-label="مسار الصفحة"><a href="../../index.html#book-map">خريطة الكتاب</a><span aria-hidden="true">/</span><a href="index.html">{escape(unit['title'])}</a><span aria-hidden="true">/</span><span aria-current="page">{title}</span></nav><section class="page-intro"><div class="eyebrow">الوحدة {number:02} · الدرس {lesson_number:02}</div><h1>{title}</h1></section><section class="lesson-panel">{icon(lesson['icon'])}<h2>هنا تبدأ رحلتنا مع «{title}»</h2><p>هذه الصفحة هي نقطة البداية للدرس. نجهّز الشرح والفيديو والأنشطة التفاعلية لمرحلة قادمة.</p><span class="badge">محتوى الدرس قيد الإعداد</span></section><a class="back-link" href="index.html">← العودة إلى وحدة {escape(unit['title'])}</a>'''
                page(f'{unit_path}/{lesson["slug"]}.html', lesson['title'], content)
            content = f'''<nav class="breadcrumb" aria-label="مسار الصفحة"><a href="../../index.html#book-map">خريطة الكتاب</a><span aria-hidden="true">/</span><span aria-current="page">{escape(unit['title'])}</span></nav><section class="unit-intro"><div class="page-intro"><div class="eyebrow">الوحدة {number:02}</div><h1>{escape(unit['title'])}</h1><p class="intro">خطوتك الأولى في رحلة التكنولوجيا. اختر درسًا لتفتح صفحته التمهيدية.</p></div>{characters("unit")}</section><section aria-labelledby="lessons-title"><div class="section-heading"><h2 id="lessons-title">دروس الوحدة</h2><p>درسان، وبداية جديدة للاكتشاف</p></div><div class="grid lessons">{''.join(lesson_cards)}</div></section><p style="margin-top:28px"><a class="back-link" href="../../index.html#book-map">← العودة إلى خريطة الكتاب</a></p>'''
            page(f'{unit_path}/index.html', unit['title'], content)
    content = f'''<section class="hero" aria-labelledby="site-title"><div><div class="eyebrow">تعلّم · استكشف · ابتكر</div><h1 id="site-title">رحلة التكنولوجيا<span>الصف السادس الأساسي</span></h1><p class="intro">لكل اختراع حكاية، ولكل فكرة بداية.<br>لنكتشف معًا عالم التكنولوجيا، وحدةً تلو الأخرى.</p><a class="button" href="#book-map">استكشف الوحدات <span aria-hidden="true">↓</span></a></div>{characters("home")}</section><section id="book-map" aria-labelledby="map-title"><div class="section-heading"><div><div class="eyebrow">مسارك في هذا الكتاب</div><h2 id="map-title">خريطة الكتاب</h2></div><p>ثلاث وحدات مرتّبة حسب المنهج</p></div><div class="grid">{''.join(cards)}</div></section>'''
    page('index.html', 'الرئيسية', content)
    print(f'Built {len(list(OUT.rglob("*.html")))} pages in {OUT}')


if __name__ == '__main__':
    build()
