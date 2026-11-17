"""Build the Arabic book website with Python's standard library."""
from illustrations import render_inline, render_svg
import json
import hashlib
import re
import shutil
from html import escape
from pathlib import Path
from string import Template

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist'
COURSE_CATALOG = []
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
    prefix = '../' * (len(Path(path).parts) - 1)
    styles, modules = [], []
    if path == 'index.html':
        styles = ['homepage.css']
    elif path == 'portfolio.html':
        styles = ['portfolio.css']
    elif path == 'units/thinking-technology/index.html':
        styles = ['unit-experiment.css', 'unit-one.css']
    elif path == 'units/thinking-technology/world-of-wheels.html':
        styles, modules = ['unit-experiment.css', 'wheels.css'], ['wheels.js']
    elif path == 'units/thinking-technology/electronics-at-home.html':
        styles, modules = ['wheels.css', 'electronics.css'], ['electronics.js']
    elif path == 'units/thinking-technology/challenge.html':
        styles, modules = ['wheels.css', 'unit-challenge.css'], ['unit-challenge.js']
    course_page = path in ('index.html', 'portfolio.html', 'challenges.html', 'about.html') or path.startswith('units/') and (path.endswith('/index.html') or path.endswith('/challenge.html'))
    extra = []
    if course_page:
        styles.append('course.css')
        modules.append('course-ui.js')
        serialized = json.dumps(COURSE_CATALOG, ensure_ascii=False).replace('<', '\\u003c')
        extra.append(f'<script type="application/json" id="course-catalog" data-root="{prefix}">{serialized}</script>')
        content += (ROOT / 'templates/certificate-dialog.html').read_text()
    styles.append('brand-3d.css')
    for name in styles:
        digest = hashlib.sha256((ROOT / 'assets' / name).read_bytes()).hexdigest()[:12]
        extra.append(f'<link rel="stylesheet" href="{prefix}assets/{name}?v={digest}">')
    for name in modules:
        digest = hashlib.sha256((ROOT / 'assets' / name).read_bytes()).hexdigest()[:12]
        extra.append(f'<script type="module" src="{prefix}assets/{name}?v={digest}"></script>')
    # Version every local image so Pages cannot mix old flat art with new materials.
    def version_image(match):
        relative = match[2]
        asset = ROOT / 'assets' / relative.split('assets/', 1)[1]
        built = OUT / 'assets' / relative.split('assets/', 1)[1]
        digest = hashlib.sha256((built if built.exists() else asset).read_bytes()).hexdigest()[:12]
        return match[1] + relative + '?v=' + digest + match[3]
    content = re.sub(r'(src=")([^"?]*assets/[^"?]+\.(?:png|svg))(")', version_image, content)
    content = render_inline(content, "art-" + re.sub(r"[^a-z0-9]", "-", path))
    target.write_text(LAYOUT.substitute(title=escape('رحلة التكنولوجيا | الصف السادس الأساسي' if title == 'الرئيسية' else title), root=prefix, content=content, brand_mark_version=hashlib.sha256((OUT / 'assets/brand-3d/book-lamp.svg').read_bytes()).hexdigest()[:12], experiment_version=hashlib.sha256((ROOT / 'assets/experiment.js').read_bytes()).hexdigest()[:12], extra_styles='\n'.join(extra)))


def brand_icon(name):
    return f'<span class="brand-icon brand-icon-{name}" aria-hidden="true"></span>'


def certificate_card(unit_id):
    content = (ROOT / 'templates/certificate-card.html').read_text().replace('$unit_id', unit_id)
    if unit_id:
        content = re.sub(r'<svg.*?</svg>', brand_icon('certificate'), content, flags=re.S)
    return content


def card(title, label, symbol, href=None, description=None):
    tag = 'a' if href else 'article'
    attrs = f' href="{escape(href)}"' if href else ''
    classes = 'card card-link available' if href else 'card'
    bottom = '<span>افتح الدرس</span><span aria-hidden="true">←</span>' if description else '<span>ابدأ من هنا</span><span aria-hidden="true">←</span>' if href else '<span class="badge">قيد الإعداد</span>'
    return f'<{tag} class="{classes}"{attrs}><div class="card-top">{icon(symbol)}<span class="number">{escape(label)}</span></div><h3>{escape(title)}</h3>{"<p>" + escape(description) + "</p>" if description else ""}<div class="card-bottom">{bottom}</div></{tag}>'



def station(entry, number, href):
    book_icon = brand_icon('book')
    trophy = brand_icon('trophy')
    lessons = f'<a class="station-start unit-map-option" href="{href}">{book_icon}<span>الدروس</span></a>' if href else f'<button class="unit-map-option" disabled>{book_icon}<span>الدروس <small>قريبًا</small></span></button>'
    challenge = f'<a class="unit-map-option" href="{escape(entry["challenge_url"])}">{trophy}<span>تحدّي الوحدة</span></a>' if entry.get('challenge_url') else f'<button class="unit-map-option" disabled>{trophy}<span>تحدّي الوحدة <small>قريبًا</small></span></button>'
    heading_icon = brand_icon({'wheel': 'gear', 'signal': 'signal', 'medical': 'medical'}[entry['icon']])
    status = '' if href else '<span class="badge">قيد الإعداد</span>'
    return f'<article class="unit-map-card{' featured' if href else ''}"><div class="unit-map-heading">{heading_icon}<h3>{escape(entry["title"])}</h3>{status}</div><div class="unit-map-actions">{lessons}{challenge}</div></article>'


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
    return f'<div class="lesson-audio-control"{transcript_attr}><button type="button" class="lesson-audio-button" data-audio="{audio_id}" data-label="{label}"{disabled}><img class="audio-icon" src="../../assets/brand-3d/headphones.svg" width="26" height="26" alt=""><span>{label}</span></button><small class="audio-note">{note}</small><audio id="{audio_id}" preload="none"{src}></audio></div>'


def characters(scene):
    poses = [('lin', 'welcome', 'لين ترحّب بك'), ('yazan', 'welcome', 'يزن يرحّب بك')] if scene == 'home' else [('lin', 'point', 'لين تشير نحو دروس الوحدة'), ('yazan', 'pulley', 'يزن يحمل نموذج بكرة')]
    prefix = 'assets/' if scene == 'home' else '../../assets/'
    figures = ''.join(f'<figure><character-guide character="{name}" pose="{pose}" assets="{prefix}characters/"><img src="{prefix}characters/{name}-{pose}.png" alt="{alt}" width="256" height="360"></character-guide><figcaption>{alt}</figcaption></figure>' for name, pose, alt in poses)
    return f'<div class="guides" aria-label="رفيقا الرحلة لين ويزن">{figures}</div>'


def build():
    OUT.mkdir(exist_ok=True)
    shutil.copytree(ROOT / 'assets', OUT / 'assets', dirs_exist_ok=True)
    for source in (ROOT / 'assets').rglob('*.svg'):
        relative = source.relative_to(ROOT / 'assets')
        (OUT / 'assets' / relative).write_text(render_svg(source.read_text(), 'asset-' + re.sub(r'[^a-z0-9]', '-', str(relative))))
    book = json.loads((ROOT / 'units/book.json').read_text())
    COURSE_CATALOG.clear()
    for entry in book:
        data = json.loads((ROOT / 'units' / entry['directory'] / 'unit.json').read_text()) if entry.get('directory') else None
        slug = data['slug'] if data else entry['slug']
        COURSE_CATALOG.append({
            'id': slug, 'title': entry['title'], 'href': f'units/{slug}/index.html',
            'lessons': [{'title': lesson['title'], 'href': f'units/{slug}/{lesson["slug"]}.html', 'key': f'technology-grade-6:{lesson["slug"]}-completed:v1'} for lesson in data['lessons']] if data else [],
            'challenge': {'href': entry.get('challenge_url'), 'key': f'technology-grade-6:{slug}-challenge-completed:v1'},
        })
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
                if lesson['slug'] == 'electronics-at-home' and number == 1:
                    content = (ROOT / 'templates/electronics.html').read_text()
                    for kind, label in [('explanation', 'استمع إلى الشرح'), ('lighting_comment', 'استمع إلى التعليق'), ('sensor_explanation', 'استمع إلى التفسير'), ('congratulations', 'استمع إلى التهنئة')]:
                        content = content.replace(f'$audio_{kind}', lesson_audio(lesson, kind, label))
                page(f'{unit_path}/{lesson["slug"]}.html', lesson['title'], content)
            content = f'''<nav class="breadcrumb" aria-label="مسار الصفحة"><a href="../../index.html#book-map">خريطة الكتاب</a><span aria-hidden="true">/</span><span aria-current="page">{escape(unit['title'])}</span></nav><section class="unit-intro"><div class="page-intro"><div class="eyebrow">الوحدة {number:02}</div><h1>{escape(unit['title'])}</h1><p class="intro">خطوتك الأولى في رحلة التكنولوجيا. اختر درسًا لتفتح صفحته التمهيدية.</p></div></section><section aria-labelledby="lessons-title"><div class="section-heading"><h2 id="lessons-title">دروس الوحدة</h2><p>درسان، وبداية جديدة للاكتشاف</p></div><div class="grid lessons">{''.join(lesson_cards)}</div></section><p style="margin-top:28px"><a class="back-link" href="../../index.html#book-map">← العودة إلى خريطة الكتاب</a></p>'''
            page(f'{unit_path}/index.html', unit['title'], (ROOT / 'templates/unit-one.html').read_text() + certificate_card(unit['slug']) if number == 1 else content + certificate_card(unit['slug']))
    for entry in book:
        if not entry.get('directory'):
            placeholder = f'<section class="course-hub"><h1>{escape(entry["title"])}</h1><p>دروس هذه الوحدة قيد الإعداد.</p><a class="back-link" href="../../index.html#book-map">← العودة إلى خريطة الوحدات</a></section>'
            page(f'units/{entry["slug"]}/index.html', entry['title'], placeholder + certificate_card(entry['slug']))
    page('units/thinking-technology/challenge.html', 'تحدّي وحدة نفكّر بالتكنولوجيا', (ROOT / 'templates/unit-challenge.html').read_text())
    for slug, title in [('portfolio', 'ملف إنجازي'), ('challenges', 'التحدّيات'), ('about', 'عن المشروع')]:
        page(f'{slug}.html', title, (ROOT / f'templates/{slug}.html').read_text())
    content = f'''{(ROOT / "templates/home.html").read_text()}<section id="book-map" aria-labelledby="map-title"><div class="section-heading"><div><div class="eyebrow">مسارك في هذا الكتاب</div><h2 id="map-title">خريطة الوحدات</h2></div><p>ثلاث وحدات مرتّبة حسب المنهج</p></div><div class="grid">{''.join(cards)}</div></section>'''
    page('index.html', 'الرئيسية', content + (ROOT / 'templates/course-hub.html').read_text())
    print(f'Built {len(list(OUT.rglob("*.html")))} pages in {OUT}')


if __name__ == '__main__':
    build()
