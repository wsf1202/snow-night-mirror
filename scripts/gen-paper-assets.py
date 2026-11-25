#!/usr/bin/env python3
"""Generate paper-craft / 纸艺立体 Christmas prop sprites (layered paper + soft shadows)."""

from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "paper"
PIXEL = ROOT / "public" / "pixel"
FRAME = OUT / "frame"

# Palette from paper-craft style reference
CREAM = (245, 239, 228, 255)
CREAM_DEEP = (228, 218, 200, 255)
KRAFT = (210, 186, 150, 255)
RED = (178, 45, 45, 255)
RED_DEEP = (140, 32, 36, 255)
RED_SOFT = (196, 72, 68, 255)
FOREST = (46, 77, 54, 255)
FOREST_DEEP = (32, 58, 40, 255)
SAGE = (120, 148, 118, 255)
SAGE_SOFT = (158, 178, 148, 255)
INK = (42, 48, 40, 255)
SHADOW = (48, 42, 36, 70)


def ensure_dirs() -> None:
    FRAME.mkdir(parents=True, exist_ok=True)


def blank(w: int, h: int) -> Image.Image:
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def paper_grain(img: Image.Image, strength: float = 0.1) -> Image.Image:
    w, h = img.size
    noise = Image.effect_noise((w, h), 22).convert("L")
    noise = ImageEnhance.Contrast(noise).enhance(1.25)
    rgba = img.copy()
    px = rgba.load()
    npx = noise.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8:
                continue
            n = npx[x, y] / 255.0
            delta = int((n - 0.5) * 255 * strength)
            px[x, y] = (
                max(0, min(255, r + delta)),
                max(0, min(255, g + delta - 1)),
                max(0, min(255, b + delta - 2)),
                a,
            )
    return rgba


def drop_shadow(fg: Image.Image, offset=(4, 6), blur=5, opacity=90) -> Image.Image:
    """Composite fg onto a larger canvas with soft paper shadow."""
    pad = blur * 2 + max(abs(offset[0]), abs(offset[1])) + 4
    w, h = fg.size
    canvas = blank(w + pad * 2, h + pad * 2)
    # shadow mask from alpha
    alpha = fg.split()[-1]
    shadow = Image.new("RGBA", fg.size, (48, 42, 36, opacity))
    shadow.putalpha(alpha)
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
    canvas.alpha_composite(shadow, (pad + offset[0], pad + offset[1]))
    canvas.alpha_composite(fg, (pad, pad))
    return canvas


def soft_ellipse(draw: ImageDraw.ImageDraw, box, fill, outline=None, width=1):
    draw.ellipse(box, fill=fill, outline=outline, width=width)


def scallop_layer(draw, cx, y, half_w, h, color, scallops=7):
    """Horizontal paper strip with scalloped bottom edge."""
    pts = [(cx - half_w, y)]
    step = (half_w * 2) / scallops
    for i in range(scallops + 1):
        x = cx - half_w + i * step
        dip = h if i % 2 == 0 else h * 0.72
        pts.append((x, y + dip))
    pts.append((cx + half_w, y))
    draw.polygon(pts, fill=color)
    # subtle top edge highlight (fold)
    draw.line([(cx - half_w + 2, y + 2), (cx + half_w - 2, y + 2)], fill=(*color[:3], 90), width=2)


def draw_tree(size=(240, 340)) -> Image.Image:
    img = blank(*size)
    d = ImageDraw.Draw(img)
    cx = size[0] // 2
    # kraft trunk (paper strip)
    d.rounded_rectangle([cx - 12, size[1] - 48, cx + 12, size[1] - 10], radius=3, fill=KRAFT)
    layers = [
        (0.92, FOREST_DEEP, 8),
        (0.78, FOREST, 7),
        (0.64, SAGE, 7),
        (0.50, KRAFT, 6),
        (0.38, FOREST, 6),
        (0.26, SAGE_SOFT, 5),
    ]
    top = 42
    for i, (scale, color, sc) in enumerate(layers):
        half = int(size[0] * scale * 0.42)
        h = 48 - i * 2
        y = top + i * 38
        # soft under-layer shadow
        scallop_layer(d, cx + 2, y + 3, half, h, (*INK[:3], 35), sc)
        scallop_layer(d, cx, y, half, h, color, sc)
    # red paper star (faceted)
    star = [
        (cx, 12),
        (cx + 8, 28),
        (cx + 26, 30),
        (cx + 12, 42),
        (cx + 16, 60),
        (cx, 50),
        (cx - 16, 60),
        (cx - 12, 42),
        (cx - 26, 30),
        (cx - 8, 28),
    ]
    d.polygon(star, fill=RED)
    d.line([(cx, 12), (cx, 50)], fill=RED_DEEP, width=1)
    d.line([(cx - 20, 32), (cx + 20, 32)], fill=RED_SOFT, width=1)
    # paper dots
    rnd = random.Random(11)
    for _ in range(14):
        x = cx + rnd.randint(-70, 70)
        y = 70 + rnd.randint(0, 200)
        col = RED if rnd.random() > 0.5 else (CREAM if rnd.random() > 0.4 else SAGE)
        r = rnd.randint(4, 7)
        soft_ellipse(d, [x - r, y - r, x + r, y + r], col)
    img = paper_grain(img, 0.09)
    return drop_shadow(img, (5, 7), 6, 85)


def draw_gift_closed(size=(150, 160)) -> Image.Image:
    img = blank(*size)
    d = ImageDraw.Draw(img)
    # shadow seam under lid
    d.rounded_rectangle([22, 52, 128, 148], radius=4, fill=RED_DEEP)
    d.rounded_rectangle([20, 50, 130, 146], radius=4, fill=RED)
    # cream ribbon
    d.rectangle([68, 50, 82, 146], fill=CREAM)
    d.rectangle([20, 88, 130, 102], fill=CREAM)
    # lid (wider paper layer)
    d.rounded_rectangle([14, 38, 136, 72], radius=4, fill=RED_SOFT)
    d.rectangle([68, 38, 82, 72], fill=CREAM)
    # bow loops (layered paper)
    d.ellipse([42, 12, 78, 48], fill=CREAM)
    d.ellipse([72, 12, 108, 48], fill=CREAM_DEEP)
    d.ellipse([64, 24, 86, 50], fill=SAGE)
    d.polygon([(70, 48), (60, 68), (80, 68)], fill=CREAM)
    # fold line on lid
    d.line([(18, 54), (132, 54)], fill=(*RED_DEEP[:3], 100), width=2)
    img = paper_grain(img, 0.1)
    return drop_shadow(img, (4, 6), 5, 90)


def draw_gift_box(size=(140, 75)) -> Image.Image:
    img = blank(*size)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([10, 10, 130, 68], radius=4, fill=RED)
    d.rectangle([64, 10, 76, 68], fill=CREAM)
    d.rectangle([10, 32, 130, 44], fill=CREAM)
    d.line([(12, 14), (128, 14)], fill=(*RED_SOFT[:3], 160), width=2)
    img = paper_grain(img, 0.08)
    return drop_shadow(img, (3, 4), 4, 80)


def draw_gift_lid(size=(160, 85)) -> Image.Image:
    img = blank(*size)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([8, 32, 152, 78], radius=4, fill=RED_SOFT)
    d.rectangle([72, 32, 88, 78], fill=CREAM)
    d.ellipse([48, 6, 86, 44], fill=CREAM)
    d.ellipse([74, 6, 112, 44], fill=CREAM_DEEP)
    d.ellipse([68, 18, 92, 46], fill=SAGE)
    img = paper_grain(img, 0.08)
    return drop_shadow(img, (3, 4), 4, 80)


def draw_bell(size=(190, 230)) -> Image.Image:
    img = blank(*size)
    d = ImageDraw.Draw(img)
    cx = size[0] // 2
    # hanger loop
    soft_ellipse(d, [cx - 16, 10, cx + 16, 36], CREAM, INK, 2)
    d.rectangle([cx - 6, 28, cx + 6, 48], fill=KRAFT)
    # dome layers
    soft_ellipse(d, [cx - 58, 46, cx + 58, 158], KRAFT)
    soft_ellipse(d, [cx - 48, 56, cx + 40, 140], (*CREAM[:3], 100))
    soft_ellipse(d, [cx - 58, 46, cx + 58, 158], None, FOREST_DEEP, 2)
    # flare rim (paper strip)
    d.polygon(
        [(cx - 68, 140), (cx + 68, 140), (cx + 78, 188), (cx - 78, 188)],
        fill=KRAFT,
        outline=FOREST_DEEP,
    )
    d.arc([cx - 76, 168, cx + 76, 208], 0, 180, fill=FOREST_DEEP, width=2)
    soft_ellipse(d, [cx - 10, 178, cx + 10, 206], RED)
    # red paper bow
    d.ellipse([cx - 36, 50, cx - 6, 78], fill=RED)
    d.ellipse([cx + 6, 50, cx + 36, 78], fill=RED_SOFT)
    d.rectangle([cx - 8, 58, cx + 8, 76], fill=RED_DEEP)
    img = paper_grain(img, 0.09)
    return drop_shadow(img, (5, 7), 6, 85)


def draw_hat(size=(230, 190)) -> Image.Image:
    img = blank(*size)
    d = ImageDraw.Draw(img)
    # cream brim (thick paper)
    soft_ellipse(d, [18, 118, 212, 172], CREAM)
    soft_ellipse(d, [18, 118, 212, 172], None, CREAM_DEEP, 2)
    # red crown layers
    d.polygon([(50, 128), (118, 22), (188, 128)], fill=RED)
    d.polygon([(70, 126), (118, 48), (150, 126)], fill=(*RED_DEEP[:3], 90))
    soft_ellipse(d, [100, 12, 146, 52], CREAM)
    soft_ellipse(d, [100, 12, 146, 52], None, CREAM_DEEP, 2)
    d.rectangle([48, 114, 190, 136], fill=CREAM)
    d.line([(50, 120), (188, 120)], fill=CREAM_DEEP, width=2)
    img = paper_grain(img, 0.1)
    return drop_shadow(img, (4, 6), 5, 90)


def draw_antlers(size=(270, 190)) -> Image.Image:
    img = blank(*size)
    d = ImageDraw.Draw(img)

    def branch(points, w=10, col=KRAFT):
        d.line(points, fill=col, width=w, joint="curve")
        for x, y in points:
            soft_ellipse(d, [x - w // 2, y - w // 2, x + w // 2, y + w // 2], col)

    branch([(120, 158), (88, 108), (52, 58), (28, 28)], 12, KRAFT)
    branch([(88, 108), (64, 72), (42, 44)], 7, CREAM_DEEP)
    branch([(52, 58), (36, 78)], 5, KRAFT)
    branch([(150, 158), (182, 108), (218, 58), (242, 28)], 12, KRAFT)
    branch([(182, 108), (206, 72), (228, 44)], 7, CREAM_DEEP)
    branch([(218, 58), (234, 78)], 5, KRAFT)
    # paper headband
    soft_ellipse(d, [108, 148, 162, 178], RED)
    soft_ellipse(d, [118, 154, 152, 172], CREAM)
    img = paper_grain(img, 0.08)
    return drop_shadow(img, (4, 5), 5, 80)


def draw_holly(size=(100, 100)) -> Image.Image:
    img = blank(*size)
    for ang, col in ((-28, FOREST), (12, FOREST_DEEP), (38, SAGE)):
        leaf = blank(*size)
        ld = ImageDraw.Draw(leaf)
        ld.polygon([(50, 14), (82, 48), (50, 82), (18, 50)], fill=col)
        ld.polygon([(50, 14), (64, 26), (58, 34)], fill=col)
        ld.polygon([(82, 48), (72, 60), (64, 52)], fill=col)
        leaf = leaf.rotate(ang, resample=Image.BICUBIC, center=(50, 50))
        img = Image.alpha_composite(img, leaf)
    d = ImageDraw.Draw(img)
    for cx, cy in ((44, 52), (58, 48), (52, 60)):
        soft_ellipse(d, [cx - 7, cy - 7, cx + 7, cy + 7], RED)
    img = paper_grain(img.filter(ImageFilter.SMOOTH), 0.1)
    return drop_shadow(img, (3, 4), 4, 75)


def draw_pine(size=(110, 75)) -> Image.Image:
    img = blank(*size)
    d = ImageDraw.Draw(img)
    d.line([(12, 44), (98, 32)], fill=KRAFT, width=5)
    for i in range(10):
        x = 16 + i * 8
        y = 42 - int(math.sin(i * 0.9) * 5)
        col = FOREST if i % 2 == 0 else SAGE
        d.polygon([(x, y), (x + 5, y - 20 - (i % 3) * 3), (x + 10, y)], fill=col)
    img = paper_grain(img, 0.08)
    return drop_shadow(img, (3, 3), 3, 70)


def draw_berry_sprig(size=(90, 100)) -> Image.Image:
    img = blank(*size)
    d = ImageDraw.Draw(img)
    d.line([(45, 90), (45, 30)], fill=FOREST, width=4)
    for ang, col in ((-35, SAGE), (25, FOREST), (0, FOREST_DEEP)):
        leaf = blank(*size)
        ld = ImageDraw.Draw(leaf)
        ld.ellipse([28, 18, 62, 55], fill=col)
        leaf = leaf.rotate(ang, resample=Image.BICUBIC, center=(45, 40))
        img = Image.alpha_composite(img, leaf)
    d = ImageDraw.Draw(img)
    for cx, cy in ((38, 72), (52, 68), (45, 80)):
        soft_ellipse(d, [cx - 6, cy - 6, cx + 6, cy + 6], RED)
    img = paper_grain(img, 0.09)
    return drop_shadow(img, (3, 4), 3, 70)


def draw_star_ornament(size=(80, 80)) -> Image.Image:
    img = blank(*size)
    d = ImageDraw.Draw(img)
    cx = cy = 40
    pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        r = 28 if i % 2 == 0 else 12
        pts.append((cx + math.cos(ang) * r, cy + math.sin(ang) * r))
    d.polygon(pts, fill=RED)
    d.line([(cx, cy - 26), (cx, cy + 10)], fill=RED_DEEP, width=1)
    img = paper_grain(img, 0.08)
    return drop_shadow(img, (3, 4), 3, 75)


def draw_bow(size=(130, 85)) -> Image.Image:
    img = blank(*size)
    d = ImageDraw.Draw(img)
    d.ellipse([6, 18, 62, 68], fill=RED)
    d.ellipse([68, 18, 124, 68], fill=RED_SOFT)
    d.rounded_rectangle([54, 30, 76, 56], radius=4, fill=CREAM)
    d.polygon([(50, 56), (40, 80), (64, 64)], fill=RED)
    d.polygon([(80, 56), (90, 80), (66, 64)], fill=RED_SOFT)
    img = paper_grain(img, 0.1)
    return drop_shadow(img, (3, 4), 4, 80)


def draw_ornament(size=(70, 85)) -> Image.Image:
    img = blank(*size)
    d = ImageDraw.Draw(img)
    soft_ellipse(d, [10, 18, 60, 78], FOREST)
    soft_ellipse(d, [16, 24, 42, 54], (*SAGE_SOFT[:3], 120))
    d.rectangle([30, 8, 40, 22], fill=KRAFT)
    soft_ellipse(d, [26, 4, 44, 16], CREAM)
    soft_ellipse(d, [28, 48, 42, 62], RED)
    img = paper_grain(img, 0.09)
    return drop_shadow(img, (3, 4), 3, 75)


def paper_guide(src: Path, dest: Path) -> None:
    """Frame gesture guide photo as layered cream paper card."""
    base = Image.open(src).convert("RGB")
    g = ImageOps.autocontrast(base, cutoff=1)
    g = ImageEnhance.Color(g).enhance(0.92)
    g = ImageEnhance.Contrast(g).enhance(1.04)
    # slight warm paper grade
    r, gg, b = g.split()
    r = r.point(lambda v: min(255, int(v * 1.02 + 6)))
    gg = gg.point(lambda v: min(255, int(v * 0.98 + 4)))
    b = b.point(lambda v: min(255, int(v * 0.9 + 2)))
    g = Image.merge("RGB", (r, gg, b))

    w, h = g.size
    pad = 28
    canvas = Image.new("RGBA", (w + pad * 2 + 16, h + pad * 2 + 16), (0, 0, 0, 0))
    # kraft backing layer (offset)
    back = Image.new("RGBA", (w + pad * 2, h + pad * 2), KRAFT)
    canvas.alpha_composite(back, (14, 14))
    # cream face
    face = Image.new("RGBA", (w + pad * 2, h + pad * 2), CREAM)
    fd = ImageDraw.Draw(face)
    fd.rectangle([0, 0, face.size[0] - 1, face.size[1] - 1], outline=SAGE, width=3)
    fd.rectangle([6, 6, face.size[0] - 7, face.size[1] - 7], outline=RED_SOFT, width=2)
    face.paste(g, (pad, pad))
    # corner holly dots
    for cx, cy in ((18, 18), (face.size[0] - 18, 18), (18, face.size[1] - 18), (face.size[0] - 18, face.size[1] - 18)):
        soft_ellipse(fd, [cx - 5, cy - 5, cx + 5, cy + 5], RED)
    face = paper_grain(face, 0.08)
    canvas.alpha_composite(face, (0, 0))
    # soft outer shadow baked in
    out = drop_shadow(canvas, (5, 7), 6, 70)
    out.convert("RGB").save(dest, quality=88)


def main() -> None:
    ensure_dirs()
    random.seed(42)

    assets = {
        "tree.png": draw_tree(),
        "gift.png": draw_gift_closed(),
        "gift-box.png": draw_gift_box(),
        "gift-lid.png": draw_gift_lid(),
        "bell.png": draw_bell(),
        "santa-hat.png": draw_hat(),
        "antlers.png": draw_antlers(),
        "bow.png": draw_bow(),
        "ornament.png": draw_ornament(),
        "star.png": draw_star_ornament(),
    }
    for name, im in assets.items():
        im.save(OUT / name)
        print("wrote", name, im.size)

    frame_map = {
        0: draw_holly(),
        1: draw_berry_sprig(),
        2: draw_pine(),
        3: draw_holly().rotate(25, expand=True, resample=Image.BICUBIC),
        4: draw_star_ornament(),
        5: draw_ornament(),
        6: draw_bow().resize((96, 64), Image.LANCZOS),
        7: draw_pine().rotate(-18, expand=True, resample=Image.BICUBIC),
        8: draw_berry_sprig().rotate(12, expand=True, resample=Image.BICUBIC),
    }
    for i, im in frame_map.items():
        path = FRAME / f"deco-{i}.png"
        im.save(path)
        print("wrote frame", path.name, im.size)

    guides = [
        "guide-snow.jpg",
        "guide-bell.jpg",
        "guide-hat.jpg",
        "guide-antlers.jpg",
        "guide-tree.jpg",
        "guide-gift.jpg",
        "guide-next.jpg",
    ]
    for g in guides:
        src = PIXEL / g
        if src.exists():
            paper_guide(src, OUT / g)
            print("wrote", g)


if __name__ == "__main__":
    main()
