"""Build the three comparable pulley diagrams from shared 3D parts.
Front view with a shallow right-hand extrusion; rope routing matches lesson geometry.
"""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
MATERIALS='''<defs><linearGradient id="teal" x2="1" y2="1"><stop stop-color="#86cec1"/><stop offset=".4" stop-color="#208e8b"/><stop offset="1" stop-color="#084a58"/></linearGradient><linearGradient id="gold" x2=".9" y2="1"><stop stop-color="#ffe7a0"/><stop offset=".45" stop-color="#D6A248"/><stop offset="1" stop-color="#93652b"/></linearGradient><linearGradient id="metal" x2="1" y2="1"><stop stop-color="#9eafb3"/><stop offset=".4" stop-color="#43566b"/><stop offset="1" stop-color="#18273D"/></linearGradient><linearGradient id="wood" x2="1" y2="1"><stop stop-color="#efd19a"/><stop offset=".45" stop-color="#D6A248"/><stop offset="1" stop-color="#ac7733"/></linearGradient></defs>'''
def wheel(x,y):
 return f'''<circle cx="{x+3}" cy="{y+3}" r="35" fill="#164b54"/><circle cx="{x}" cy="{y}" r="35" fill="url(#teal)" stroke="#0b515e" stroke-width="2"/><circle cx="{x}" cy="{y}" r="29" fill="none" stroke="#9dd8c7" stroke-opacity=".6" stroke-width="2"/><circle cx="{x}" cy="{y}" r="10" fill="url(#gold)" stroke="#fff0c4" stroke-width="1"/><circle cx="{x}" cy="{y}" r="4" fill="#18273D"/>'''
def load(x,y):
 return f'''<path d="M{x} {y}l6-5h54l-6 5z" fill="#f4d494"/><path d="M{x+54} {y}l6-5v42l-6 5z" fill="#95642c"/><rect x="{x}" y="{y}" width="54" height="42" rx="2" fill="url(#wood)" stroke="#8d6427" stroke-width="2"/><path d="M{x+7} {y+6}h40v30h-40zM{x+7} {y+6}l40 30m-40 0 40-30" fill="none" stroke="#ffdf9c" stroke-width="3"/>'''
def rope(d):
 return f'<path d="{d}" fill="none" stroke="#7e5629" stroke-width="6" stroke-linecap="round"/><path d="{d}" fill="none" stroke="url(#gold)" stroke-width="4" stroke-linecap="round"/><path d="{d}" fill="none" stroke="#fff1be" stroke-width="1" stroke-dasharray="2 5"/>'
def render(kind):
 art='<ellipse cx="120" cy="265" rx="99" ry="6" fill="#126c7015"/><rect x="25" y="16" width="190" height="9" rx="3" fill="url(#metal)"/>'
 if kind=='fixed':
  art+='<path d="M120 23v18" stroke="url(#metal)" stroke-width="7"/>'+wheel(120,75)+rope('M85 200V75a35 35 0 0 1 70 0v140')+load(58,200)
  art+='<path d="M166 173v36m-7-9 7 9 7-9" stroke="#126C70" stroke-width="4" fill="none"/>'
 elif kind=='moving':
  art+=wheel(110,152)+rope('M75 22v130a35 35 0 0 0 70 0V35')+'<path d="M110 162v50" stroke="url(#metal)" stroke-width="5"/>'+load(83,212)
  art+='<path d="M156 86V45m-7 9 7-9 7 9" stroke="#126C70" stroke-width="4" fill="none"/>'
 else:
  art+='<path d="M155 23v10" stroke="url(#metal)" stroke-width="7"/>'+wheel(155,65)+wheel(85,160)+rope('M50 22v138a35 35 0 0 0 70 0V65a35 35 0 0 1 70 0v155')+'<path d="M85 170v43" stroke="url(#metal)" stroke-width="5"/>'+load(58,213)
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 275">'+MATERIALS+art+'</svg>'
if __name__=='__main__':
 for kind in ('fixed','moving','compound'):(ROOT/'assets/units'/f'{kind}-system.svg').write_text(render(kind))
