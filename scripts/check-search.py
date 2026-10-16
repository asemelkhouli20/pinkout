"""Validate crawlable HTML, local resources, and search metadata without dependencies."""
from html.parser import HTMLParser
from pathlib import Path
from collections import Counter
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.anchors, self.assets, self.images, self.metas = [], [], [], [], []
        self.headings = Counter()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        self.headings[tag] += 1
        if tag == 'meta':
            self.metas.append(attrs)
        if tag == 'a':
            self.anchors.append(attrs.get('href', ''))
        if tag == 'img':
            self.images.append(attrs)
        if tag in ('img', 'script', 'link'):
            url = attrs.get('src', attrs.get('href', ''))
            if url and not url.startswith(('http', '#', 'data:')):
                self.assets.append(url.split('?')[0])
        for candidate in attrs.get('srcset', '').split(','):
            if candidate.strip():
                self.assets.append(candidate.strip().split()[0])


html = (ROOT / 'index.html').read_text()
page = Page()
page.feed(html)
assert len(page.ids) == len(set(page.ids)), 'Duplicate IDs'
assert page.headings['h1'] == 1, 'Expected one main heading'
for path in page.assets:
    assert (ROOT / path.lstrip('/')).is_file(), f'Missing resource: {path}'
for anchor in page.anchors:
    if anchor.startswith('#') and len(anchor) > 1:
        assert anchor[1:] in page.ids, f'Broken anchor: {anchor}'
for image in page.images:
    assert 'alt' in image, f'Image without alt: {image}'
    if image.get('src'):
        assert 'width' in image and 'height' in image, f'Missing dimensions: {image}'
schema = json.loads(re.search(
    r'<script id="search-structured-data"[^>]*>(.*?)</script>', html, re.S)[1])
faq = next(entity for entity in schema['@graph'] if entity['@type'] == 'FAQPage')
for index, question in enumerate(faq['mainEntity'], 1):
    for kind, expected in [('q', question['name']), ('a', question['acceptedAnswer']['text'])]:
        visible = re.search(
            rf'<(?:span|p) data-i18n="faq.{kind}{index}">(.*?)</(?:span|p)>', html, re.S)
        assert visible and ' '.join(visible[1].split()) == ' '.join(expected.split()), \
            f'Structured FAQ differs from visible copy: {kind}{index}'
assert len(faq['mainEntity']) == len(re.findall(r'data-i18n="faq\.q\d+"', html))
for key in ['description', 'robots', 'twitter:card', 'twitter:image', 'og:url', 'og:locale']:
    assert any(meta.get('name', meta.get('property')) == key and meta.get('content')
               for meta in page.metas), f'Missing metadata: {key}'
assert html.index('</body>') > html.rindex('</script>'), 'Script outside body'
ET.parse(ROOT / 'sitemap.xml')
assert 'Sitemap: https://pinkoutsa.com/sitemap.xml' in (ROOT / 'robots.txt').read_text()
print(f'PASS: {len(page.ids)} unique IDs, {len(page.assets)} resource references, all anchors, '
      f'image alt/dimensions, metadata, {len(faq["mainEntity"])} visible FAQ pairs, JSON-LD and sitemap.')
