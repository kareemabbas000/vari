# Builds public/brand/vari-logo-{light,dark}.png from the original VARI logo file.
# Usage: python3 scripts/logo-variants.py <original-logo.(png|avif)> public/brand
import sys
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert('RGBA')).astype(np.float32) / 255
rgb, a = im[..., :3], im[..., 3]
H, W = a.shape

def dilate(m, r):
    o = m.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dx * dx + dy * dy <= r * r:
                o |= np.roll(np.roll(m, dy, 0), dx, 1)
    return o

# 1. Remove compression ghosts: keep alpha only near the solid letterforms.
solid = a > 0.45
keep = dilate(solid, 2)
a = np.where(keep, a, 0)

# 2. Which letterforms are gold? Decide on solid pixels, then grow into their edges.
goldness = (rgb[..., 0] - rgb[..., 2])
gold_solid = solid & (goldness > 0.35)
gold_zone = dilate(gold_solid, 3)
gold_rgb = np.median(rgb[gold_solid & (a > 0.95)], axis=0)
print('gold', '#%02X%02X%02X' % tuple(int(round(c * 255)) for c in gold_rgb))

# 3. Upscale the alpha 4x (Lanczos) and tighten edges for a crisp, vector-like contour.
S = 4
A = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).resize((W * S, H * S), Image.LANCZOS)).astype(np.float32) / 255
t = np.clip((A - 0.2) / 0.6, 0, 1)
A = t * t * (3 - 2 * t)
G = np.asarray(Image.fromarray(gold_zone.astype(np.uint8) * 255).resize((W * S, H * S), Image.NEAREST)) > 127

# 4. Crop to content with a small margin.
ys, xs = np.where(A > 0.02)
pad = 6 * S
y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad, H * S)
x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad, W * S)
A, G = A[y0:y1, x0:x1], G[y0:y1, x0:x1]

def build(neutral):
    rgbo = np.zeros(A.shape + (4,), np.float32)
    rgbo[..., :3] = np.where(G[..., None], gold_rgb, np.array(neutral, np.float32))
    rgbo[..., 3] = A
    return Image.fromarray((rgbo * 255 + 0.5).astype(np.uint8), 'RGBA')

build([1, 1, 1]).save(f'{out}/vari-logo-light.png', optimize=True)   # white VA + Studio, gold RI
build([0, 0, 0]).save(f'{out}/vari-logo-dark.png', optimize=True)    # original black + gold, cleaned
print('size', A.shape[1], A.shape[0])
