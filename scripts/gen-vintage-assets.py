#!/usr/bin/env python3
"""Generate vintage-postcard Christmas prop sprites (muted crimson/forest/cream)."""

from __future__ import annotations

import math
import os
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "vintage"
PIXEL = ROOT / "public" / "pixel"
FRAME = OUT / "frame"

# Palette from style reference
CREAM = (232, 220, 190, 255)
CREAM_DEEP = (210, 192, 158, 255)
CRIMSON = (140, 54, 54, 255)
CRIMSON_SOFT = (168, 78, 72, 255)
FOREST = (58, 86, 62, 255)
FOREST_DEEP = (38, 62, 46, 255)
SAGE = (110, 128, 98, 255)
GOLD = (168, 138, 72, 255)
INK = (48, 36, 28, 255)
BROWN = (96, 70, 48, 255)
IVORY = (244, 236, 214, 255)
PEWTER = (120, 118, 112, 255)


def ensure_dirs() -> None:
    FRAME.mkdir(parents=True, exist_ok=True)


def blank(w: int, h: int) -> Image.Image:
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def paper_grain(img: Image.Image, strength: float = 0.12) -> Image.Image:
    w, h = img.size
    noise = Image.effect_noise((w, h), 28).convert("L")
    noise = ImageEnhance.Contrast(noise).enhance(1.4)
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
                max(0, min(255, g + delta - 2)),
                max(0, min(255, b + delta - 4)),
                a,
            )
    return rgba


def soft_ellipse(draw: ImageDraw.ImageDraw, box, fill, outline=None, width=1):
    draw.ellipse(box, fill=fill, outline=outline, width=width)


def draw_tree(size=(220, 320)) -> Image.Image:
    img = blank(*size)
    d = ImageDraw.Draw(img)
    cx, base = size[0] // 2, size[1] - 28
    # trunk
    d.rectangle([cx - 10, base - 28, cx + 10, base + 6], fill=BROWN)
    layers = [
        (0.95, FOREST_DEEP),
        (0.78, FOREST),
        (0.62, SAGE),
        (0.46, FOREST),
        (0.32, FOREST_DEEP),
    ]
    top = 28
    for i, (scale, color) in enumerate(layers):
        w = int(size[0] * scale * 0.42)
        h = int(58 - i * 3)
        y = top + i * 42
        d.polygon([(cx, y), (cx - w, y + h), (cx + w, y + h)], fill=color)
        # soft highlight
        d.polygon(
            [(cx - 4, y + 8), (cx - w * 0.35, y + h - 6), (cx + 2, y + h - 10)],
            fill=(color[0] + 18, color[1] + 22, color[2] + 12, 110),
        )
    # star / candle glow at top
    soft_ellipse(d, [cx - 10, 14, cx + 10, 34], (*GOLD[:3], 220))
    soft_ellipse(d, [cx - 4, 20, cx + 4, 28], IVORY)
    # ornaments
    rnd = random.Random(7)
    for _ in range(10):
        x = cx + rnd.randint(-55, 55)
        y = 70 + rnd.randint(0, 180)
        col = CRIMSON if rnd.random() > 0.45 else GOLD
        soft_ellipse(d, [x - 4, y - 4, x + 4, y + 4], col)
    img = img.filter(ImageFilter.GaussianBlur(0.55))
    return paper_grain(img, 0.08)


def draw_gift_closed(size=(140, 150)) -> Image.Image:
    img = blank(*size)
    d = ImageDraw.Draw(img)
    # box body
    d.rounded_rectangle([18, 48, 122, 138], radius=6, fill=CRIMSON, outline=INK, width=2)
    d.rounded_rectangle([18, 48, 122, 78], radius=6, fill=CRIMSON_SOFT, outline=INK, width=2)
    # ribbon
    d.rectangle([62, 48, 78, 138], fill=GOLD)
    d.rectangle([18, 82, 122, 96], fill=GOLD)
    # bow
    d.ellipse([48, 22, 78, 52], fill=GOLD)
    d.ellipse([72, 22, 102, 52], fill=GOLD)
    d.polygon([(70, 48), (62, 68), (78, 68)], fill=(140, 110, 50, 255))
    # lid seam shadow
    d.rectangle([20, 76, 120, 80], fill=(60, 20, 20, 90))
    img = img.filter(ImageFilter.SMOOTH_MORE)
    return paper_grain(img, 0.1)


def draw_gift_box(size=(130, 70)) -> Image.Image:
    img = blank(*size)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([8, 8, 122, 62], radius=5, fill=CRIMSON, outline=INK, width=2)
    d.rectangle([58, 8, 72, 62], fill=GOLD)
    d.rectangle([8, 28, 122, 40], fill=GOLD)
    return paper_grain(img.filter(ImageFilter.SMOOTH), 0.08)


def draw_gift_lid(size=(150, 80)) -> Image.Image:
    img = blank(*size)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([6, 28, 144, 72], radius=6, fill=CRIMSON_SOFT, outline=INK, width=2)
    d.rectangle([66, 28, 84, 72], fill=GOLD)
    # bow on lid
    d.ellipse([48, 6, 82, 40], fill=GOLD)
    d.ellipse([78, 6, 112, 40], fill=GOLD)
    d.ellipse([70, 18, 90, 42], fill=(150, 120, 55, 255))
    return paper_grain(img.filter(ImageFilter.SMOOTH), 0.08)


def draw_bell(size=(180, 220)) -> Image.Image:
    img = blank(*size)
    d = ImageDraw.Draw(img)
    cx = size[0] // 2
    # handle
    d.rectangle([cx - 8, 18, cx + 8, 42], fill=PEWTER, outline=INK, width=1)
    soft_ellipse(d, [cx - 14, 8, cx + 14, 28], PEWTER, INK, 1)
    # dome
    soft_ellipse(d, [cx - 55, 40, cx + 55, 150], GOLD, INK, 2)
    soft_ellipse(d, [cx - 40, 55, cx + 20, 120], (210, 185, 110, 90))
    # flare
    d.polygon([(cx - 62, 130), (cx + 62, 130), (cx + 72, 175), (cx - 72, 175)], fill=GOLD, outline=INK)
    d.arc([cx - 70, 155, cx + 70, 195], 0, 180, fill=INK, width=2)
    # clapper
    soft_ellipse(d, [cx - 8, 168, cx + 8, 196], BROWN)
    # ribbon
    d.polygon([(cx - 30, 48), (cx - 8, 70), (cx - 22, 88)], fill=CRIMSON)
    d.polygon([(cx + 30, 48), (cx + 8, 70), (cx + 22, 88)], fill=CRIMSON_SOFT)
    img = img.filter(ImageFilter.GaussianBlur(0.4))
    return paper_grain(img, 0.09)


def draw_hat(size=(220, 180)) -> Image.Image:
    img = blank(*size)
    d = ImageDraw.Draw(img)
    # brim
    soft_ellipse(d, [20, 110, 200, 165], IVORY, INK, 2)
    # crown
    d.polygon([(55, 120), (110, 18), (175, 120)], fill=CRIMSON)
    soft_ellipse(d, [95, 10, 135, 48], IVORY)
    # fold soft shadow
    d.polygon([(70, 118), (110, 55), (130, 118)], fill=(100, 30, 30, 70))
    # white trim band
    d.rectangle([52, 108, 178, 128], fill=IVORY, outline=CREAM_DEEP)
    img = img.filter(ImageFilter.SMOOTH_MORE)
    return paper_grain(img, 0.1)


def draw_antlers(size=(260, 180)) -> Image.Image:
    img = blank(*size)
    d = ImageDraw.Draw(img)

    def branch(points, width=7):
        d.line(points, fill=BROWN, width=width, joint="curve")
        for x, y in points[1:]:
            soft_ellipse(d, [x - 3, y - 3, x + 3, y + 3], (120, 88, 58, 255))

    # left
    branch([(118, 150), (90, 100), (55, 55), (30, 28)], 8)
    branch([(90, 100), (70, 70), (48, 42)], 5)
    branch([(55, 55), (40, 70)], 4)
    # right
    branch([(142, 150), (170, 100), (205, 55), (230, 28)], 8)
    branch([(170, 100), (190, 70), (212, 42)], 5)
    branch([(205, 55), (220, 70)], 4)
    # head band
    soft_ellipse(d, [105, 140, 155, 168], BROWN)
    img = img.filter(ImageFilter.GaussianBlur(0.35))
    return paper_grain(img, 0.08)


def draw_holly(size=(96, 96)) -> Image.Image:
    img = blank(*size)
    d = ImageDraw.Draw(img)
    for ang, col in ((-25, FOREST), (15, FOREST_DEEP), (40, SAGE)):
        leaf = blank(*size)
        ld = ImageDraw.Draw(leaf)
        ld.polygon([(48, 18), (78, 48), (48, 78), (22, 52)], fill=col)
        # serrations
        ld.polygon([(48, 18), (62, 28), (58, 36)], fill=col)
        ld.polygon([(78, 48), (70, 58), (62, 52)], fill=col)
        leaf = leaf.rotate(ang, resample=Image.BICUBIC, center=(48, 48))
        img = Image.alpha_composite(img, leaf)
    d = ImageDraw.Draw(img)
    for cx, cy in ((44, 50), (56, 46), (50, 58)):
        soft_ellipse(d, [cx - 6, cy - 6, cx + 6, cy + 6], CRIMSON)
    return paper_grain(img.filter(ImageFilter.SMOOTH), 0.1)


def draw_pinecone(size=(80, 96)) -> Image.Image:
    img = blank(*size)
    d = ImageDraw.Draw(img)
    soft_ellipse(d, [18, 12, 62, 88], BROWN)
    for row, y in enumerate(range(20, 82, 10)):
        for i in range(4):
            x = 24 + i * 10 + (4 if row % 2 else 0)
            soft_ellipse(d, [x, y, x + 12, y + 14], (110, 82, 54, 255), INK, 1)
    return paper_grain(img, 0.1)


def draw_pine(size=(100, 70)) -> Image.Image:
    img = blank(*size)
    d = ImageDraw.Draw(img)
    d.line([(10, 40), (90, 30)], fill=BROWN, width=4)
    for i in range(9):
        x = 18 + i * 8
        y = 38 - int(math.sin(i) * 4)
        d.polygon([(x, y), (x + 4, y - 18 - (i % 3) * 3), (x + 8, y)], fill=FOREST if i % 2 == 0 else SAGE)
    return paper_grain(img, 0.08)


def draw_candle(size=(70, 140)) -> Image.Image:
    img = blank(*size)
    d = ImageDraw.Draw(img)
    # holder
    d.rectangle([18, 100, 52, 128], fill=PEWTER, outline=INK, width=1)
    soft_ellipse(d, [12, 120, 58, 138], PEWTER, INK, 1)
    # candle
    d.rectangle([26, 40, 44, 108], fill=IVORY, outline=CREAM_DEEP)
    d.polygon([(28, 55), (32, 48), (36, 58)], fill=CREAM)  # drip
    d.polygon([(38, 70), (42, 62), (44, 74)], fill=CREAM_DEEP)
    # flame
    soft_ellipse(d, [28, 14, 42, 42], (*GOLD[:3], 230))
    soft_ellipse(d, [32, 20, 38, 36], (255, 240, 200, 255))
    return paper_grain(img, 0.08)


def draw_stamp(size=(110, 110)) -> Image.Image:
    img = blank(*size)
    d = ImageDraw.Draw(img)
    # perforated edge
    d.rounded_rectangle([6, 6, 104, 104], radius=4, fill=CREAM, outline=CRIMSON, width=3)
    for i in range(8):
        soft_ellipse(d, [2 + i * 13, 2, 12 + i * 13, 12], (0, 0, 0, 0))
        soft_ellipse(d, [2 + i * 13, 98, 12 + i * 13, 108], (0, 0, 0, 0))
    # reindeer silhouette
    d.rectangle([20, 30, 90, 88], fill=SAGE)
    d.polygon([(40, 70), (55, 40), (70, 70)], fill=FOREST_DEEP)
    soft_ellipse(d, [48, 48, 68, 68], BROWN)
    d.line([(52, 50), (40, 34)], fill=BROWN, width=2)
    d.line([(64, 50), (78, 34)], fill=BROWN, width=2)
    # postmark
    d.ellipse([58, 12, 100, 54], outline=CRIMSON_SOFT, width=2)
    d.arc([62, 18, 96, 48], 20, 200, fill=CRIMSON, width=2)
    return paper_grain(img, 0.12)


def draw_bow(size=(120, 80)) -> Image.Image:
    img = blank(*size)
    d = ImageDraw.Draw(img)
    d.ellipse([8, 18, 58, 62], fill=CRIMSON)
    d.ellipse([62, 18, 112, 62], fill=CRIMSON_SOFT)
    d.rectangle([50, 28, 70, 52], fill=FOREST)
    # plaid lines
    for x in range(14, 54, 8):
        d.line([(x, 22), (x, 58)], fill=FOREST, width=1)
    for x in range(68, 108, 8):
        d.line([(x, 22), (x, 58)], fill=FOREST_DEEP, width=1)
    d.polygon([(48, 52), (40, 74), (60, 60)], fill=CRIMSON)
    d.polygon([(72, 52), (80, 74), (60, 60)], fill=CRIMSON_SOFT)
    return paper_grain(img, 0.1)


def draw_wreath(size=(240, 240)) -> Image.Image:
    img = blank(*size)
    d = ImageDraw.Draw(img)
    cx = cy = size[0] // 2
    rnd = random.Random(3)
    for i in range(48):
        ang = i / 48 * math.tau
        r = 78 + rnd.randint(-6, 6)
        x = cx + math.cos(ang) * r
        y = cy + math.sin(ang) * r
        col = FOREST if i % 3 else SAGE
        leaf = blank(*size)
        ld = ImageDraw.Draw(leaf)
        ld.ellipse([x - 10, y - 4, x + 10, y + 4], fill=col)
        leaf = leaf.rotate(math.degrees(ang), resample=Image.BICUBIC, center=(cx, cy))
        img = Image.alpha_composite(img, leaf)
    d = ImageDraw.Draw(img)
    for i in range(10):
        ang = i / 10 * math.tau + 0.2
        x = cx + math.cos(ang) * 78
        y = cy + math.sin(ang) * 78
        soft_ellipse(d, [x - 5, y - 5, x + 5, y + 5], CRIMSON)
    bow = draw_bow((100, 70)).resize((90, 60), Image.LANCZOS)
    img.alpha_composite(bow, (cx - 45, cy + 55))
    return paper_grain(img, 0.07)


def vintage_guide(src: Path, dest: Path) -> None:
    base = Image.open(src).convert("RGB")
    # sepia-ish grade
    g = ImageOps.autocontrast(base, cutoff=2)
    g = ImageEnhance.Color(g).enhance(0.72)
    g = ImageEnhance.Contrast(g).enhance(1.05)
    r, gg, b = g.split()
    r = r.point(lambda v: min(255, int(v * 1.05 + 12)))
    gg = gg.point(lambda v: min(255, int(v * 0.95 + 8)))
    b = b.point(lambda v: min(255, int(v * 0.75 + 4)))
    g = Image.merge("RGB", (r, gg, b))
    g = ImageEnhance.Brightness(g).enhance(1.04)

    # aged paper border
    w, h = g.size
    pad = 18
    canvas = Image.new("RGB", (w + pad * 2, h + pad * 2), (226, 212, 180))
    # stain blobs
    stain = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(stain)
    rnd = random.Random(hash(src.name) & 0xFFFF)
    for _ in range(7):
        x, y = rnd.randint(0, canvas.size[0]), rnd.randint(0, canvas.size[1])
        rad = rnd.randint(20, 60)
        sd.ellipse([x - rad, y - rad, x + rad, y + rad], fill=(150, 110, 70, 28))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), stain).convert("RGB")
    canvas.paste(g, (pad, pad))
    d = ImageDraw.Draw(canvas)
    d.rectangle([8, 8, canvas.size[0] - 9, canvas.size[1] - 9], outline=(120, 52, 48), width=3)
    d.rectangle([12, 12, canvas.size[0] - 13, canvas.size[1] - 13], outline=(90, 70, 50), width=1)
    canvas = paper_grain(canvas.convert("RGBA"), 0.14).convert("RGB")
    canvas.save(dest, quality=88)


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
        "wreath.png": draw_wreath(),
        "candle.png": draw_candle(),
        "stamp.png": draw_stamp(),
        "bow.png": draw_bow(),
    }
    for name, im in assets.items():
        im.save(OUT / name)
        print("wrote", name, im.size)

    frame_map = {
        0: draw_holly(),
        1: draw_pinecone(),
        2: draw_pine(),
        3: draw_holly().rotate(30, expand=True, resample=Image.BICUBIC),
        4: draw_stamp().resize((88, 88), Image.LANCZOS),
        5: draw_candle().resize((56, 110), Image.LANCZOS),
        6: draw_bow().resize((90, 60), Image.LANCZOS),
        7: draw_pine().rotate(-20, expand=True, resample=Image.BICUBIC),
        8: draw_pinecone().rotate(15, expand=True, resample=Image.BICUBIC),
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
            vintage_guide(src, OUT / g)
            print("wrote", g)


if __name__ == "__main__":
    main()
