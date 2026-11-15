"""Check generated pages, destinations, and each round trip through a lesson."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1] / 'dist'


class Document(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path = path
        self.links = []
        self.ids = set()
        self.headings = []
        self.in_heading = False
        self.language = None
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'html':
            self.language = (attrs.get('lang'), attrs.get('dir'))
        if 'id' in attrs:
            self.ids.add(attrs['id'])
        if tag in ('a', 'link'):
            self.links.append(attrs['href'])
        if tag == 'h1':
            self.in_heading = True

    def handle_endtag(self, tag):
        if tag == 'h1':
            self.in_heading = False

    def handle_data(self, data):
        if self.in_heading:
            self.headings.append(data)

    def destination(self, href):
        parsed = urlsplit(href)
        return (self.path.parent / unquote(parsed.path)).resolve() if parsed.path else self.path.resolve()


docs = {p.resolve(): Document(p) for p in ROOT.rglob('*.html')}
assert len(docs) == 4, 'Expected home, one unit, and two lesson pages'
for path, doc in docs.items():
    assert doc.language == ('ar', 'rtl'), path
    assert doc.headings, path
    for href in doc.links:
        parsed = urlsplit(href)
        assert not parsed.scheme, f'Unexpected external dependency: {href}'
        target = doc.destination(href)
        assert target.is_relative_to(ROOT.resolve()), href
        assert target.is_file(), f'Broken destination: {href} from {path}'
        if parsed.fragment:
            assert parsed.fragment in docs[target].ids, f'Broken anchor: {href}'

home = docs[(ROOT / 'index.html').resolve()]
unit_path = (ROOT / 'units/thinking-technology/index.html').resolve()
unit = docs[unit_path]
assert '#book-map' in home.links
assert unit_path in [home.destination(h) for h in home.links]
assert '../../index.html#book-map' in unit.links
for slug, title in [('world-of-wheels', 'عالم من عجلات'), ('electronics-at-home', 'إلكترونيات في بيتي')]:
    path = (unit_path.parent / f'{slug}.html').resolve()
    assert path in [unit.destination(h) for h in unit.links]
    lesson = docs[path]
    assert title in ''.join(lesson.headings)
    assert 'index.html' in lesson.links
    assert lesson.destination('index.html') == unit_path
    print(f'PASS: الرئيسية ← الوحدة ← {title} ← الوحدة ← خريطة الكتاب')
assert (ROOT / 'index.html').read_text().count('قيد الإعداد') == 2
print('PASS: all page links, anchors, stylesheets, Arabic/RTL, and unavailable units')
