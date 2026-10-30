#!/usr/bin/env python3
"""Concours Maroc — images of the Android app used by the website funnel.

    python3 scripts/app-assets.py

Reads cordova/concours_maroc_play_store.zip (Google Play icon and phone
screenshots) and content/site.mjs (package name, domain), and writes:

  src/img/app/icone-application-192.webp   Google Play icon (banner, cards)
  src/img/app/{fr,ar}-NN-name.webp         phone screenshots, 540 px wide
  src/img/app/qr-google-play.svg           QR code to the Google Play listing
                                           (campaign "qr-code"), checked by
                                           decoding it back
  src/img/og/application-android.jpg       share image of application/

Needs Pillow, OpenCV (cv2: QR code) and Playwright for Python (share image).
The site build does not: these files are committed and copied as they are.
"""
import base64
import io
import pathlib
import re
import sys
import urllib.parse
import zipfile

import cv2
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
ZIP = ROOT / 'cordova/concours_maroc_play_store.zip'
OUT = ROOT / 'src/img/app'
OUT.mkdir(parents=True, exist_ok=True)
SHOTS = ['02-fiche-concours', '03-question-corrigee', '04-examen-blanc',
         '05-resultats', '06-entrainement', '07-calcul-note-bac']

site = (ROOT / 'content/site.mjs').read_text(encoding='utf-8')
app_id = re.search(r"androidApp:\s*\{[^}]*id:\s*'([^']+)'", site).group(1)
domain = re.search(r"customDomain:\s*'([^']+)'", site).group(1).removeprefix('www.')

z = zipfile.ZipFile(ZIP)
def member(suffix):
    return next(n for n in z.namelist() if n.endswith(suffix))

# ------------------------------------------------------------ icon
icon = Image.open(io.BytesIO(z.read(member('play-console/icone-play-store-512.png')))).convert('RGBA')
icon.resize((192, 192), Image.LANCZOS).save(OUT / 'icone-application-192.webp', 'WEBP', quality=88, method=6)

# ------------------------------------------------------------ screenshots
for lang in ('fr', 'ar'):
    for name in SHOTS:
        im = Image.open(io.BytesIO(z.read(member(f'captures-telephone/{lang}/{name}.jpg')))).convert('RGB')
        im.resize((540, 960), Image.LANCZOS).save(OUT / f'{lang}-{name}.webp', 'WEBP', quality=80, method=6)

# ------------------------------------------------------------ QR code
ref = urllib.parse.quote(f'utm_source={domain}&utm_medium=qr&utm_campaign=qr-code', safe='')
url = f'https://play.google.com/store/apps/details?id={app_id}&referrer={ref}'
params = cv2.QRCodeEncoder_Params()
params.correction_level = cv2.QRCodeEncoder_CORRECT_LEVEL_M
matrix = cv2.QRCodeEncoder.create(params).encode(url)          # quiet zone included
big = cv2.copyMakeBorder(cv2.resize(matrix, None, fx=8, fy=8, interpolation=cv2.INTER_NEAREST),
                         32, 32, 32, 32, cv2.BORDER_CONSTANT, value=255)
decoded, _, _ = cv2.QRCodeDetector().detectAndDecode(big)
if decoded != url:
    sys.exit(f'QR code check failed: {decoded!r}')
n = matrix.shape[0]
runs = []
for y in range(n):
    x = 0
    while x < n:
        if matrix[y, x] == 0:
            start = x
            while x < n and matrix[y, x] == 0:
                x += 1
            runs.append(f'M{start} {y}h{x - start}v1h-{x - start}z')
        else:
            x += 1
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n} {n}" shape-rendering="crispEdges">'
       f'<!-- {url} -->'
       f'<rect width="{n}" height="{n}" fill="#fff"/><path fill="#101a3d" d="{"".join(runs)}"/></svg>\n')
(OUT / 'qr-google-play.svg').write_text(svg, encoding='utf-8')

# ------------------------------------------------------------ share image
def data_uri(path, mime):
    return f'data:{mime};base64,' + base64.b64encode(pathlib.Path(path).read_bytes()).decode()

fonts = (
    '@font-face{font-family:"CM Sans";src:url(' + data_uri(ROOT / 'src/fonts/plus-jakarta-sans-latin-wght-normal.woff2', 'font/woff2') + ') format("woff2");font-weight:200 800}'
    '@font-face{font-family:"CM Sans";src:url(' + data_uri(ROOT / 'src/fonts/readex-pro-arabic-wght-normal.woff2', 'font/woff2') + ') format("woff2");font-weight:160 700;unicode-range:U+0600-06FF,U+0750-077F,U+FB50-FDFF,U+FE70-FEFC}'
)
logo = (ROOT / 'src/root/favicon.svg').read_text(encoding='utf-8').replace('<svg ', '<svg width="58" height="58" ', 1)
pattern = urllib.parse.quote("<svg xmlns='http://www.w3.org/2000/svg' width='72' height='72' viewBox='0 0 72 72'><g fill='none' stroke='#FFFFFF' stroke-opacity='.07' stroke-width='1.2'><path d='M22 22h28v28H22z'/><path d='M36 16.2 55.8 36 36 55.8 16.2 36z'/><path d='M36 16.2V0M55.8 36H72M36 55.8V72M16.2 36H0M22 22 0 0M50 22 72 0M50 50l22 22M22 50 0 72'/></g></svg>")
shot = data_uri(OUT / 'fr-04-examen-blanc.webp', 'image/webp')
app_icon = data_uri(OUT / 'icone-application-192.webp', 'image/webp')
page = f'''<!doctype html><html><head><meta charset="utf-8"><style>{fonts}
*{{box-sizing:border-box;margin:0}}
body{{width:1200px;height:630px;overflow:hidden;font-family:"CM Sans",sans-serif;color:#fff;
 background:radial-gradient(620px 420px at 92% 8%,rgba(58,73,214,.6),transparent 70%),radial-gradient(520px 360px at 0% 100%,rgba(245,165,36,.16),transparent 70%),url("data:image/svg+xml,{pattern}") 0 0/72px 72px,linear-gradient(160deg,#0b1229 0%,#101a3d 55%,#172456 100%)}}
.wrap{{position:absolute;left:0;top:0;bottom:0;width:780px;padding:56px 0 56px 72px;display:flex;flex-direction:column}}
.brand{{display:flex;align-items:center;gap:16px;font-weight:800;font-size:30px}} .brand b{{color:#f5a524}}
.eyebrow{{margin-top:40px;font-size:22px;font-weight:750;color:#ffc266;text-transform:uppercase;letter-spacing:3px}}
h1{{margin-top:12px;font-size:62px;line-height:1.06;font-weight:800;letter-spacing:-1.5px}}
.sub{{margin-top:18px;font-size:28px;line-height:1.35;color:#c9d2ea;max-width:660px}}
.ar{{margin-top:12px;font-size:28px;color:#aeb9d9;direction:rtl;text-align:left;unicode-bidi:plaintext}}
.chips{{margin-top:auto;display:flex;gap:12px;align-items:center}}
.chip{{padding:10px 20px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.16);font-size:22px;font-weight:700}}
.chip.gold{{background:#f5a524;border-color:#f5a524;color:#0b1229}}
.ico{{width:64px;height:64px;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,.35)}}
.shot{{position:absolute;right:70px;top:38px;width:312px;height:555px;border-radius:30px;box-shadow:0 30px 70px rgba(0,0,0,.55);border:3px solid rgba(255,255,255,.18);object-fit:cover}}
</style></head><body>
<img class="shot" src="{shot}">
<div class="wrap">
<div class="brand">{logo}<span>Concours <b>Maroc</b></span></div>
<div class="eyebrow">Application Android</div>
<h1>Tous les concours dans votre poche</h1>
<div class="sub">Fiches, QCM corrigés et examens blancs, même sans internet</div>
<div class="ar">تطبيق Concours Maroc على أندرويد</div>
<div class="chips"><img class="ico" src="{app_icon}"><span class="chip gold">Gratuite sur Google Play</span><span class="chip">FR · العربية</span></div>
</div></body></html>'''

from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch()
    tab = browser.new_page(viewport={'width': 1200, 'height': 630}, device_scale_factor=1)
    tab.set_content(page, wait_until='load')
    tab.wait_for_timeout(300)
    png = tab.screenshot()
    browser.close()
(ROOT / 'src/img/og').mkdir(parents=True, exist_ok=True)
Image.open(io.BytesIO(png)).convert('RGB').save(ROOT / 'src/img/og/application-android.jpg', 'JPEG', quality=86, optimize=True, progressive=True)

print(f'App images written: icon, {2 * len(SHOTS)} screenshots, QR code ({n}×{n} modules) → {url}, share image.')
