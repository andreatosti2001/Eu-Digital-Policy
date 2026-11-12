"""Derive the opening's three assets from the author's original drawing (assets/serpent-original.png).

Colour segmentation and connectivity only: nothing is traced, redrawn or recoloured except the two
things the opening needs and HP-01 already did on the icon: the beads are painted over with the body's
own ink (they are drawn by the page as shapes), and the Night variant lifts that ink to --ink-2 and adds
a --paper-dim contour about 1 screen px wide (1.5 source px; 0.85 gave 2.6:1 on a 1x screen, HP-02).  Run:  python3 -I derive.py <original.png> <outdir>
"""
import json, math, sys
from collections import deque
import numpy as np
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
GOLD = np.array([217, 169, 60], float)      # the disc and the ground
INK = np.array([20, 17, 27], float)         # #14111B = --ink-0 of Night
BEAD = np.array([240, 224, 174], float)     # #F0E0AE, the bead cream (page paints beads with the same value)
INK2 = np.array([0x26, 0x20, 0x32], float)  # --ink-2, Night
DIM = np.array([0xB8, 0xAC, 0x98], float)   # --paper-dim, Night
X0, Y0, N = 460, 40, 1000                   # the disc's square inside the 1920x1080 artboard

im = Image.open(SRC).convert('RGBA').crop((X0, Y0, X0 + N, Y0 + N))
a = np.array(im).astype(float)
rgb, al = a[..., :3], a[..., 3] / 255.0

def dist(c): return np.sqrt(((rgb - c) ** 2).sum(-1))

# --- the ground: gold pixels connected to the disc's rim or to the hole (not the gold dashes inside the body)
gold = (dist(GOLD) < 40) & (al > 0.5)
def flood(seed, mask):
    out = np.zeros(mask.shape, bool); out[seed] = True; q = deque([seed])
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            yy, xx = y + dy, x + dx
            if 0 <= yy < N and 0 <= xx < N and mask[yy, xx] and not out[yy, xx]:
                out[yy, xx] = True; q.append((yy, xx))
    return out
outer = flood((60, N // 2), gold)                       # between the rim and the serpent
# hole: the gold region around the ring's centre; find it from the largest gold component not outer
rest = gold & ~outer
ys, xs = np.where(rest)
cy0, cx0 = int(np.median(ys)), int(np.median(xs))
hole = None
for sy, sx in ((cy0, cx0), (N // 2 + 20, N // 2), (N // 2, N // 2 - 20)):
    if rest[sy, sx]: hole = flood((sy, sx), rest); break
assert hole is not None, 'no hole found'
ground = outer | hole
hy, hx = np.where(hole)
hole_centre = [round(float(hx.mean()), 2), round(float(hy.mean()), 2)]
hole_radius = round(math.sqrt(hole.sum() / math.pi), 2)

# --- silhouette alpha, with the 1-px antialiased edge unmixed against the gold ground
solid = ~ground & (al > 0.5)
for _ in range(1):   # an edge pixel = non-ground pixel touching ground
    pass
near = np.zeros_like(ground)
for dy in (-2, -1, 0, 1, 2):
    for dx in (-2, -1, 0, 1, 2):
        near |= np.roll(np.roll(ground, dy, 0), dx, 1)
edge = solid & near & (dist(GOLD) > 4)
core = solid & ~edge
# nearest solid colour for each edge pixel, by repeated propagation
F = np.where(core[..., None], rgb, 0.0); have = core.copy()
for _ in range(4):
    nF = F.copy(); nh = have.copy()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
        sF = np.roll(np.roll(F, dy, 0), dx, 1); sh = np.roll(np.roll(have, dy, 0), dx, 1)
        take = ~nh & sh
        nF[take] = sF[take]; nh |= take
    F, have = nF, nh
d = F - GOLD
den = (d ** 2).sum(-1) + 1e-9
alpha_e = np.clip(((rgb - GOLD) * d).sum(-1) / den, 0, 1)
alpha = np.zeros((N, N)); alpha[core] = 1.0
alpha[edge] = alpha_e[edge]
colour = rgb.copy(); colour[edge] = F[edge]
alpha[~solid & ~edge] = 0
# a gold dash that is NOT ground (inside the body) keeps alpha 1 because it is `core`

# --- beads: cream components of the body (not the head), measured as ellipses
beadmask = (dist(BEAD) < 22) & core
lab = np.zeros((N, N), int); k = 0; comps = []
for y, x in zip(*np.where(beadmask)):
    if lab[y, x]: continue
    k += 1; q = deque([(y, x)]); lab[y, x] = k; pts = []
    while q:
        cy, cx = q.popleft(); pts.append((cy, cx))
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                yy, xx = cy + dy, cx + dx
                if 0 <= yy < N and 0 <= xx < N and beadmask[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = k; q.append((yy, xx))
    comps.append(np.array(pts))
big = [c for c in comps if len(c) >= 150]
print('cream components', len(comps), 'of area >=150:', len(big), 'areas', sorted(len(c) for c in big)[:3], '..', sorted(len(c) for c in big)[-3:])
beads = []
for c in big:
    cy, cx = c[:, 0].mean(), c[:, 1].mean()
    cov = np.cov(np.stack([c[:, 1] - cx, c[:, 0] - cy]))
    w, v = np.linalg.eigh(cov)                    # ascending
    ra, rb = 2 * math.sqrt(w[1]), 2 * math.sqrt(w[0])
    ang = math.degrees(math.atan2(v[1, 1], v[0, 1]))
    if ang > 90: ang -= 180
    if ang <= -90: ang += 180
    beads.append([round(cx, 2), round(cy, 2), round(ra, 2), round(rb, 2), round(ang, 1)])
beads.sort(key=lambda b: math.atan2(b[1] - hole_centre[1], b[0] - hole_centre[0]))

# --- paint the beads over with the ink (the page draws them as shapes)
paint = np.zeros((N, N), bool)
for c in big: paint[c[:, 0], c[:, 1]] = True
grow = paint.copy()
for _ in range(2):
    g2 = grow.copy()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        g2 |= np.roll(np.roll(grow, dy, 0), dx, 1)
    grow = g2
grow &= solid & ~ground
colour[grow] = INK
# stray cream-ish antialias pixels between a bead and the ink were inside `grow`

def save(arr_rgb, arr_a, path, size=None):
    out = np.dstack([np.clip(arr_rgb, 0, 255), np.clip(arr_a, 0, 1) * 255]).round().astype(np.uint8)
    img = Image.fromarray(out, 'RGBA')
    if size: img = img.resize((size, size), Image.LANCZOS)
    img.save(path, optimize=True); print('wrote', path, img.size)

# --- the mark: the disc as drawn (for the opening's first frames), transparent outside the disc
save(rgb, al, f'{OUT}/serpent-mark.png')
# --- Day: the body only
day_rgb, day_a = colour, alpha
save(day_rgb, day_a, f'{OUT}/serpent-body-day.png')

# --- Night: the body lifted to --ink-2 with a --paper-dim contour about 1 screen px wide (1.5 source px; 0.85 gave 2.6:1 on a 1x screen, HP-02), computed at 4x and saved at 1x
K = 4
big_a = np.array(Image.fromarray((alpha * 255).astype(np.uint8)).resize((N * K, N * K), Image.LANCZOS)).astype(float) / 255
big_c = np.array(Image.fromarray(colour.round().astype(np.uint8)).resize((N * K, N * K), Image.LANCZOS)).astype(float)
inkish = (np.sqrt(((big_c - INK) ** 2).sum(-1)) < 30)
lifted = np.where(inkish[..., None], INK2, big_c)
lifted[inkish] = INK2
# contour: a band of width w source px, just outside the silhouette edge, drawn in --paper-dim
w = 1.5 * K
sil = (big_a > 0.5)
dil = sil.copy()
r = int(math.ceil(w))
yy, xx = np.mgrid[-r:r + 1, -r:r + 1]; disk = (yy ** 2 + xx ** 2) <= w * w
# separable-ish dilation by a disk using shifts
for dy, dx in zip(*np.where(disk)):
    dil |= np.roll(np.roll(sil, dy - r, 0), dx - r, 1)
band = dil & ~sil
n_a = np.where(sil, big_a, 0.0)
n_a[band] = 1.0
n_c = lifted.copy(); n_c[band] = DIM
img = np.dstack([np.clip(n_c, 0, 255), n_a * 255]).round().astype(np.uint8)
Image.fromarray(img, 'RGBA').resize((N, N), Image.LANCZOS).save(f'{OUT}/serpent-body-night.png', optimize=True)
print('wrote', f'{OUT}/serpent-body-night.png')

geom = {
    '$description': ("Geometry of the 22 cream beads of the author's original serpent drawing (assets/serpent-original.png, 1920x1080), in the "
                     "coordinate space of the 1000 x 1000 square that holds its gold disc (offset 460, 40): centre x, centre y, radius along the "
                     "long axis, radius along the short axis, angle in degrees. Measured from the connected cream components of the drawing "
                     "(second moments), by assets/derive-serpent.py. Artwork, not a record of law."),
    'size': N, 'source_crop': [X0, Y0, N, N],
    'hole_centre': hole_centre, 'hole_radius': hole_radius, 'beads': beads,
}
json.dump(geom, open(f'{OUT}/serpent-beads.json', 'w'), indent=1)
print('hole', hole_centre, hole_radius, 'beads', len(beads))
