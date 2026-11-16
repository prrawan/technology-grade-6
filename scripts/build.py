"""Build the Arabic book website with Python's standard library."""
import json
import hashlib
import re
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
    target.write_text(LAYOUT.substitute(title=escape('رحلة التكنولوجيا | الصف السادس الأساسي' if title == 'الرئيسية' else title), root='../' * depth, content=content, experiment_version=hashlib.sha256((ROOT / 'assets/experiment.js').read_bytes()).hexdigest()[:12], extra_styles='<link rel="stylesheet" href="assets/homepage.css">' if path == 'index.html' else '<link rel="stylesheet" href="../../assets/unit-experiment.css"><link rel="stylesheet" href="../../assets/unit-one.css">' if path == 'units/thinking-technology/index.html' else '<link rel="stylesheet" href="../../assets/unit-experiment.css"><link rel="stylesheet" href="../../assets/wheels.css?v=' + hashlib.sha256((ROOT / 'assets/wheels.css').read_bytes()).hexdigest()[:12] + '"><script type="module" src="../../assets/wheels.js?v=' + hashlib.sha256((ROOT / 'assets/wheels.js').read_bytes()).hexdigest()[:12] + '"></script>' if path == 'units/thinking-technology/world-of-wheels.html' else ''))


def card(title, label, symbol, href=None, description=None):
    tag = 'a' if href else 'article'
    attrs = f' href="{escape(href)}"' if href else ''
    classes = 'card card-link available' if href else 'card'
    bottom = '<span>افتح الدرس</span><span aria-hidden="true">←</span>' if description else '<span>ابدأ من هنا</span><span aria-hidden="true">←</span>' if href else '<span class="badge">قيد الإعداد</span>'
    return f'<{tag} class="{classes}"{attrs}><div class="card-top">{icon(symbol)}<span class="number">{escape(label)}</span></div><h3>{escape(title)}</h3>{"<p>" + escape(description) + "</p>" if description else ""}<div class="card-bottom">{bottom}</div></{tag}>'



def station(entry, number, href):
    title = escape(entry['title'])
    start = f'<a class="station-start" href="{href}"><svg aria-hidden="true" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 4q5-3 10 0 5-3 10 0v16q-5-3-10 0-5-3-10 0zM12 4v16"/></svg> الدروس</a>' if href else '<span class="station-start pending"><svg aria-hidden="true" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 4q5-3 10 0 5-3 10 0v16q-5-3-10 0-5-3-10 0zM12 4v16"/></svg> الدروس <small>قريبًا</small></span>'
    activity = '<a href="units/thinking-technology/world-of-wheels.html#pulley-experiment" aria-label="نشاط تفاعلي: جرّب البكرة"><span aria-hidden="true">🧩</span> نشاط تفاعلي</a>' if href else '<span><span aria-hidden="true">🧩</span> نشاط تفاعلي <small>قريبًا</small></span>'
    status = '' if href else '<span class="badge">قيد الإعداد</span>'
    return f'<article class="station{' station-ready' if href else ''}"><div class="station-heading">{icon(entry["icon"])}<div><small>الوحدة {number:02}</small><h3>{title}</h3>{status}</div></div>{start}<div class="station-options">{activity}<span><span aria-hidden="true">🏆</span> تحدّي الوحدة <small>قريبًا</small></span></div></article>'


def unit_experiment():
    source = (ROOT / 'templates/experiment.html').read_text()
    start = source.index('<h1')
    end = source.index('</h1>', start) + 5
    source = source[:start] + '<h2 id="pulley-title">جرّب البَكرة مع لين ويزن</h2>' + source[end:]
    return source.replace('aria-labelledby="site-title"', 'id="pulley-experiment" aria-labelledby="pulley-title"').replace('assets/', '../../assets/').replace('href="units/thinking-technology/world-of-wheels.html"', 'href="world-of-wheels.html"').replace('href="#book-map"', 'href="../../index.html#book-map"')


def lesson_audio(lesson, kind, label):
    audio_id = f'lesson-audio-{kind}'
    source = lesson.get('audio', {}).get(kind)
    if not source:
        planned = lesson.get('audio_paths', {}).get(kind)
        if planned:
            candidate = Path(planned)
            if candidate.is_absolute() or '..' in candidate.parts:
                raise ValueError(f'Invalid planned audio path: {planned}')
            if (ROOT / candidate).is_file():
                source = planned
    if source:
        audio_path = Path(source)
        if audio_path.is_absolute() or '..' in audio_path.parts or not (ROOT / audio_path).is_file():
            raise ValueError(f'Missing or invalid lesson audio file: {source}')
    src = f' src="../../{escape(source, quote=True)}"' if source else ''
    disabled = '' if source else ' disabled'
    note = 'اضغط للاستماع.' if source else 'الصوت قريبًا'
    transcript = lesson.get('audio_transcripts', {}).get(kind, '')
    transcript_attr = f' data-transcript="{escape(transcript, quote=True)}"' if transcript else ''
    return f'<div class="lesson-audio-control"{transcript_attr}><button type="button" class="lesson-audio-button" data-audio="{audio_id}" data-label="{label}"{disabled}><svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 14v-3a8 8 0 0 1 16 0v3M4 12H2v7h4v-7zm16 0h2v7h-4v-7z"/></svg><span>{label}</span></button><small class="audio-note">{note}</small><audio id="{audio_id}" preload="none"{src}></audio></div>'


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
        cards.append(station(entry, number, href))
        if unit:
            unit_path = f'units/{unit["slug"]}'
            lesson_cards = []
            for lesson_number, lesson in enumerate(unit['lessons'], 1):
                title = escape(lesson['title'])
                lesson_cards.append(card(lesson['title'], f'الدرس {lesson_number:02}', lesson['icon'], f'{lesson["slug"]}.html', "جرّب كيف تساعدنا البكرات في رفع الأشياء" if lesson_number == 1 else "اكتشف كيف تغيّر المقاومة شدة الإضاءة"))
                content = f'''<nav class="breadcrumb" aria-label="مسار الصفحة"><a href="../../index.html#book-map">خريطة الكتاب</a><span aria-hidden="true">/</span><a href="index.html">{escape(unit['title'])}</a><span aria-hidden="true">/</span><span aria-current="page">{title}</span></nav><section class="page-intro"><div class="eyebrow">الوحدة {number:02} · الدرس {lesson_number:02}</div><h1>{title}</h1></section><section class="lesson-panel">{icon(lesson['icon'])}<h2>هنا تبدأ رحلتنا مع «{title}»</h2><p>هذه الصفحة هي نقطة البداية للدرس. نجهّز الشرح والفيديو والأنشطة التفاعلية لمرحلة قادمة.</p><span class="badge">محتوى الدرس قيد الإعداد</span></section><a class="back-link" href="index.html">← العودة إلى وحدة {escape(unit['title'])}</a>'''
                if lesson['slug'] == 'world-of-wheels' and number == 1:
                    scene = unit_experiment().split('<svg viewBox=', 1)[1].split('</svg>', 1)[0]
                    scene = '<svg viewBox=' + scene + '</svg>'
                    ids = re.findall(r'id="([^"]+)"', scene)
                    for identity in ids:
                        scene = scene.replace(f'id="{identity}"', f'id="hero-{identity}"').replace(f'url(#{identity})', f'url(#hero-{identity})')
                    activity = unit_experiment().replace('href="world-of-wheels.html"', 'href="#apply"').replace('تابع درس عالم من عجلات', 'تابع إلى طبّق')
                    content = (ROOT / 'templates/world-of-wheels.html').read_text().replace('$scene', scene).replace('$experiment', activity).replace('$intro_audio', lesson_audio(lesson, 'intro', 'استمع إلى مقدّمة الدرس')).replace('$explanation_audio', lesson_audio(lesson, 'explanation', 'استمع إلى الشرح')).replace('$pulley_commentary', '<div id="pulley-audio-commentary" hidden><div data-commentary="up" hidden>' + lesson_audio(lesson, 'pulley_up', 'استمع إلى التعليق') + '</div><div data-commentary="down" hidden>' + lesson_audio(lesson, 'pulley_down', 'استمع إلى التعليق') + '</div></div>').replace('$congratulations_audio', lesson_audio(lesson, 'congratulations', 'استمع إلى التهنئة'))
                page(f'{unit_path}/{lesson["slug"]}.html', lesson['title'], content)
            content = f'''<nav class="breadcrumb" aria-label="مسار الصفحة"><a href="../../index.html#book-map">خريطة الكتاب</a><span aria-hidden="true">/</span><span aria-current="page">{escape(unit['title'])}</span></nav><section class="unit-intro"><div class="page-intro"><div class="eyebrow">الوحدة {number:02}</div><h1>{escape(unit['title'])}</h1><p class="intro">خطوتك الأولى في رحلة التكنولوجيا. اختر درسًا لتفتح صفحته التمهيدية.</p></div></section><section aria-labelledby="lessons-title"><div class="section-heading"><h2 id="lessons-title">دروس الوحدة</h2><p>درسان، وبداية جديدة للاكتشاف</p></div><div class="grid lessons">{''.join(lesson_cards)}</div></section><p style="margin-top:28px"><a class="back-link" href="../../index.html#book-map">← العودة إلى خريطة الكتاب</a></p>'''
            page(f'{unit_path}/index.html', unit['title'], (ROOT / 'templates/unit-one.html').read_text() if number == 1 else content)
    content = f'''{(ROOT / "templates/home.html").read_text()}<section id="book-map" aria-labelledby="map-title"><div class="section-heading"><div><div class="eyebrow">مسارك في هذا الكتاب</div><h2 id="map-title">خريطة الوحدات</h2></div><p>ثلاث وحدات مرتّبة حسب المنهج</p></div><div class="grid">{''.join(cards)}</div></section>'''
    page('index.html', 'الرئيسية', content)
    print(f'Built {len(list(OUT.rglob("*.html")))} pages in {OUT}')


if __name__ == '__main__':
    build()
