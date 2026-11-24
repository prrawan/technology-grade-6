"""Shared shallow-3D SVG materials; preserve educational geometry and interaction hooks.

Upper-left key light, matte teal plastic, brushed navy metal, gold rope/wood.
No transforms are added to animated groups, hit targets, masks or clip paths.
"""
import re
import xml.etree.ElementTree as ET

ET.register_namespace('', 'http://www.w3.org/2000/svg')
NS = '{http://www.w3.org/2000/svg}'

def shade(value, amount):
    value = value.lstrip('#')
    if len(value) == 3: value = ''.join(x * 2 for x in value)
    rgb = [int(value[i:i+2], 16) for i in (0, 2, 4)]
    rgb = [round(c + (255-c)*amount) if amount > 0 else round(c*(1+amount)) for c in rgb]
    return '#' + ''.join(f'{max(0,min(255,c)):02x}' for c in rgb)

def render_svg(text, key):
    """Use local gradient ids so multiple interactive SVGs can coexist on one page."""
    root = ET.fromstring(text)
    namespace = NS if root.tag.startswith(NS) else ''
    tag = lambda name: namespace + name
    defs = ET.Element(tag('defs'))
    root.insert(0, defs)
    cache = {}
    def material(color):
        if not re.fullmatch(r'#[\da-fA-F]{3}(?:[\da-fA-F]{3})?', color): return color
        if color.lower() in ('#fff','#ffffff','#fffdf6','#fffdf7','#f7f3e8'): return color
        if color not in cache:
            ident = f'{key}-m{len(cache)}'
            grad = ET.SubElement(defs,tag('linearGradient'),id=ident,x1='12%',y1='0%',x2='86%',y2='100%')
            for offset, tone in [('0%',shade(color,.42)),('32%',shade(color,.12)),('68%',color),('100%',shade(color,-.28))]:
                ET.SubElement(grad,tag('stop'),{'offset':offset,'stop-color':tone})
            cache[color] = f'url(#{ident})'
        return cache[color]
    excluded = set()
    for parent in root.iter():
        if parent.tag.split('}')[-1] in ('defs','mask','clipPath'):
            excluded.update(parent.iter())
    # Materialise explicit style declarations as well as presentation attributes.
    for node in list(root.iter()):
        local = node.tag.split('}')[-1]
        if node in excluded: continue
        if local in ('defs','stop','linearGradient','radialGradient','mask','clipPath'): continue
        if local == 'style' and node.text:
            node.text = re.sub(r'(fill|stroke):\s*(#[\da-fA-F]{3}(?:[\da-fA-F]{3})?)(?=[;}])',lambda m:m[1]+':'+material(m[2]),node.text)
        for attr in ('fill','stroke'):
            if attr in node.attrib: node.set(attr,material(node.get(attr)))
    # Shallow side faces behind solid hardware. Never duplicate image/hit/animated elements.
    for parent in list(root.iter()):
        if parent in excluded: continue
        for node in list(parent):
            local = node.tag.split('}')[-1]
            classes = node.get('class','')
            if 'touch-target' in classes or local not in ('circle','rect'): continue
            if node.get('fill','none') in ('none','transparent') or node.get('opacity') == '0': continue
            if local == 'circle' and float(node.get('r','0')) < 6: continue
            if local == 'rect' and (float(node.get('width','0')) > 220 or float(node.get('height','0')) > 300): continue
            if node.get('id') or node.get('mask') or node.get('clip-path'): continue
            side = ET.Element(node.tag)
            for attr in ('x','y','cx','cy','r','rx','ry','width','height'): 
                if node.get(attr) is not None: side.set(attr,node.get(attr))
            side.set('transform','translate(2 3)')
            side.set('fill','#18273d')
            side.set('opacity','.22')
            side.set('pointer-events','none')
            parent.insert(list(parent).index(node), side)
    return ET.tostring(root,encoding='unicode')

def render_inline(content, key):
    counter = 0
    def replace(match):
        nonlocal counter
        counter += 1
        return render_svg(match[0], f'{key}-{counter}')
    return re.sub(r'<svg\b.*?</svg>',replace,content,flags=re.S)
