"""
Builds the VARI favicon set from the V of the logo (scripts/brand/vari-v-mask.png, cut from
public/brand/vari-logo-dark.png). Concept: the V's dashed stroke, the logo's signature,
in brand gold (#D3AF38) on the site's night colour (#0C0B0A).

Optical sizing: only the V's hairline is thickened at small sizes (~1 device pixel), measured
with a distance transform, so the thick strokes stay exactly as in the logo.

Outputs (copy to): icon.svg, favicon.ico, apple-icon.png → app/ ; icon-192.png, icon-512.png,
icon-maskable-512.png → public/icons/.
Needs: pip install numpy pillow scipy potracer   (run from this folder)
"""
import numpy as np, potrace, json, io
from PIL import Image
from scipy import ndimage

GOLD, NIGHT = (0xD3, 0xAF, 0x38), (0x0C, 0x0B, 0x0A)
V = np.asarray(Image.open('vari-v-mask.png')) > 127          # 348 x 462, the logo's V
H, W = V.shape
# Stroke thickness per pixel: distance to the edge, spread over the stroke.
dist = ndimage.distance_transform_edt(V)
thick = ndimage.grey_dilation(dist, size=(9, 9))        # local half-width
hair = V & (thick < 6)                                  # the hairline (thin right stroke)

def variant(hair_px):
    """The V with only the hairline thickened to `hair_px` (in source pixels)."""
    if hair_px <= 0: return V
    r = int(round(hair_px / 2))
    yy, xx = np.ogrid[-r:r+1, -r:r+1]
    grown = ndimage.binary_dilation(hair, structure=(xx*xx + yy*yy) <= r*r)
    return V | grown

def trace(mask, S=1, tol=1.0):
    big = np.asarray(Image.fromarray((mask*255).astype(np.uint8)).resize((mask.shape[1]*S, mask.shape[0]*S), Image.LANCZOS)) > 127
    out = []
    for c in potrace.Bitmap(~big).trace(turdsize=60, alphamax=0.75, opticurve=True, opttolerance=tol):
        f = lambda p: f"{p.x/S:.1f} {p.y/S:.1f}".replace('.0 ', ' ').replace('.0', '') if False else f"{round(p.x/S,1):g} {round(p.y/S,1):g}"
        out.append('M' + f(c.start_point))
        for s in c.segments:
            out.append(('L' + f(s.c) + 'L' + f(s.end_point)) if s.is_corner else ('C' + f(s.c1) + ' ' + f(s.c2) + ' ' + f(s.end_point)))
        out.append('Z')
    return ''.join(out)

# Layout in a 512 tile: V height 300 (58.6%), optically centred (the V's mass sits left/bottom).
T, VH = 512, 300
k = VH / H
ox, oy = (T - W * k) / 2 + 6, (T - VH) / 2 + 4
json.dump({'k': k, 'ox': ox, 'oy': oy}, open('layout.json', 'w'))

def svg(path, rx=112):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {T} {T}">'
            '<style>@media (prefers-color-scheme:dark){.t{fill:#151310;stroke:#D3AF38;stroke-opacity:.35}}</style>'
            f'<rect class="t" x="5" y="5" width="{T-10}" height="{T-10}" rx="{rx-5}" fill="#0C0B0A" stroke-width="9" stroke="none"/>'
            f'<path fill="#D3AF38" transform="translate({ox:.1f} {oy:.1f}) scale({k:.4f})" d="{path}"/></svg>')

# SVG favicon: browsers draw it at 16–32 device px, so the hairline is reinforced to ~3.6% of the V height.
icon_svg = svg(trace(variant(16)))
open('icon.svg', 'w').write(icon_svg)
print('icon.svg bytes', len(icon_svg))

def raster(size, hair_px, rx_ratio=112/512, pad_scale=1.0, bg_full=False):
    """Supersampled raster of the tile at `size` px with an optically sized hairline."""
    S = 8; N = size * S
    img = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    from PIL import ImageDraw
    d = ImageDraw.Draw(img)
    if bg_full: d.rectangle([0, 0, N, N], fill=NIGHT + (255,))
    else: d.rounded_rectangle([0, 0, N - 1, N - 1], radius=int(N * rx_ratio), fill=NIGHT + (255,))
    m = variant(hair_px)
    vh = int(round(N * VH / T * pad_scale)); vw = int(round(W * vh / H))
    mk = Image.fromarray((m * 255).astype(np.uint8)).resize((vw, vh), Image.LANCZOS)
    x = int(round((N - vw) / 2 + 6 / T * N)); y = int(round((N - vh) / 2 + 4 / T * N))
    gold = Image.new('RGBA', (vw, vh), GOLD + (255,))
    img.paste(gold, (x, y), mk)
    return img.resize((size, size), Image.LANCZOS)

# Hairline target ≈ 1 device pixel at every size (converted to source pixels).
hp = lambda size, px=1.0: px * H / (size * VH / T)
sizes = {16: hp(16, 1.1), 32: hp(32, 1.0), 48: hp(48, 1.0)}
icos = [raster(s, h, pad_scale={16: 1.28, 32: 1.12, 48: 1.0}[s]) for s, h in sizes.items()]
icos[2].save('favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)], append_images=icos[:2])
raster(180, hp(180, 1.6), bg_full=True).convert('RGB').save('apple-icon.png', optimize=True)     # iOS rounds corners itself
raster(192, hp(192, 1.6)).save('icon-192.png', optimize=True)
raster(512, 12, pad_scale=1.0).save('icon-512.png', optimize=True)
raster(512, 12, bg_full=True, pad_scale=0.78).convert('RGB').save('icon-maskable-512.png', optimize=True)  # safe zone for Android masks
# preview sheet: real sizes on light and dark tab bars
sheet = Image.new('RGB', (760, 300), (245, 243, 238)); dark = Image.new('RGB', (760, 150), (32, 33, 36)); sheet.paste(dark, (0, 150))
x = 20
for s in (16, 32, 48, 64, 128):
    im = raster(s, hp(s, 1.0) if s < 100 else 12)
    for yb in (40, 190):
        sheet.paste(im, (x, yb + (64 - min(s, 64)) // 2 if s <= 64 else yb - 30), im)
    x += s + 40
big = Image.open(io.BytesIO(b'')) if False else None
sheet.save('preview.png')
print('done')
