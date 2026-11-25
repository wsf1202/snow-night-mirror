#!/usr/bin/env python3
"""Chroma-key GenerateImage vintage props → RGBA PNGs + contact sheet."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ART = Path("/opt/cursor/artifacts/assets")
STORE = Path("/cursor/stores/bc-64649c7c-2226-49fa-90c9-be712e81df96/media/vintage-postcard-v2")
REPO = Path("/agent/repos/snow-night-mirror/public/vintage")
RAW = STORE / "raw"
FRAME_STORE = STORE / "frame"
FRAME_REPO = REPO / "frame"

PROP_MAP = {
    "gift.png": "gift-closed.jpg",
    "gift-box.png": "gift-box.jpg",
    "gift-lid.png": "gift-lid.jpg",
    "tree.png": "tree.jpg",
    "bell.png": "bell.jpg",
    "santa-hat.png": "santa-hat.jpg",
    "antlers.png": "antlers.jpg",
    "wreath.png": "wreath.jpg",
    "candle.png": "candle.jpg",
    "stamp.png": "stamp.jpg",
    "bow.png": "bow.jpg",
    "snowflake.png": "snowflake.jpg",
}

FRAME_MAP = {
    "deco-0.png": "deco-holly.jpg",
    "deco-1.png": "deco-pinecone.jpg",
    "deco-2.png": "deco-pine.jpg",
    "deco-3.png": "deco-holly-2.jpg",
    "deco-4.png": "deco-mini-stamp.jpg",
    "deco-5.png": "candle.jpg",  # mini reuse; will scale later
    "deco-6.png": "bow.jpg",
    "deco-7.png": "deco-pine-2.jpg",
    "deco-8.png": "deco-postmark.jpg",
}

GUIDES = [
    "guide-snow.jpg",
    "guide-bell.jpg",
    "guide-hat.jpg",
    "guide-antlers.jpg",
    "guide-tree.jpg",
    "guide-gift.jpg",
    "guide-next.jpg",
]


def sample_key_color(im: Image.Image) -> tuple[int, int, int]:
    rgb = im.convert("RGB")
    w, h = rgb.size
    pts = [
        (2, 2),
        (w - 3, 2),
        (2, h - 3),
        (w - 3, h - 3),
        (w // 2, 2),
        (w // 2, h - 3),
        (2, h // 2),
        (w - 3, h // 2),
    ]
    cols = [rgb.getpixel(p) for p in pts]
    # median-ish via sort of channel means
    rs = sorted(c[0] for c in cols)
    gs = sorted(c[1] for c in cols)
    bs = sorted(c[2] for c in cols)
    mid = len(cols) // 2
    return rs[mid], gs[mid], bs[mid]


def chroma_key(src: Path, soft: float = 48.0, hard: float = 28.0) -> Image.Image:
    im = Image.open(src).convert("RGBA")
    key = sample_key_color(im)
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            dist = math.sqrt((r - key[0]) ** 2 + (g - key[1]) ** 2 + (b - key[2]) ** 2)
            # also treat saturated magenta/fuchsia fringe
            magenta = r > 140 and b > 70 and g < 90 and r > g + 40
            if magenta:
                dist = min(dist, 20)
            if dist <= hard:
                px[x, y] = (r, g, b, 0)
            elif dist < soft:
                t = (dist - hard) / (soft - hard)
                px[x, y] = (r, g, b, int(a * t))
    return crop_alpha(im)


def crop_alpha(im: Image.Image, pad: float = 0.04) -> Image.Image:
    bbox = im.split()[-1].getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    w, h = im.size
    pw = int((r - l) * pad) + 2
    ph = int((b - t) * pad) + 2
    l = max(0, l - pw)
    t = max(0, t - ph)
    r = min(w, r + pw)
    b = min(h, b + ph)
    return im.crop((l, t, r, b))


def save_png(im: Image.Image, *dests: Path, max_side: int | None = None) -> None:
    out = im
    if max_side:
        w, h = out.size
        scale = max_side / max(w, h)
        if scale < 1:
            out = out.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
    for d in dests:
        d.parent.mkdir(parents=True, exist_ok=True)
        out.save(d, optimize=True)


def copy_guide(name: str) -> None:
    src = ART / name
    for d in (STORE / name, REPO / name, RAW / name):
        d.parent.mkdir(parents=True, exist_ok=True)
        Image.open(src).convert("RGB").save(d, quality=90)


def contact_sheet(paths: list[Path], out: Path, cols: int = 4, cell: int = 280) -> None:
    rows = (len(paths) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cell + 20, rows * cell + 60), (232, 220, 190))
    draw = ImageDraw.Draw(sheet)
    draw.text((12, 12), "Vintage postcard v2 — GenerateImage sprites", fill=(47, 36, 28))
    for i, p in enumerate(paths):
        if not p.exists():
            continue
        im = Image.open(p).convert("RGBA")
        # checker under alpha
        tile = Image.new("RGBA", (cell - 16, cell - 40), (0, 0, 0, 0))
        base = Image.new("RGB", tile.size, (243, 234, 214))
        for yy in range(0, tile.size[1], 12):
            for xx in range(0, tile.size[0], 12):
                if (xx // 12 + yy // 12) % 2:
                    ImageDraw.Draw(base).rectangle([xx, yy, xx + 12, yy + 12], fill=(220, 208, 180))
        tw = tile.size[0] - 8
        th = tile.size[1] - 8
        im.thumbnail((tw, th), Image.LANCZOS)
        ox = (tile.size[0] - im.size[0]) // 2
        oy = (tile.size[1] - im.size[1]) // 2
        base.paste(im, (ox, oy), im if im.mode == "RGBA" else None)
        c, r = i % cols, i // cols
        x, y = 10 + c * cell, 40 + r * cell
        sheet.paste(base, (x, y))
        draw.text((x + 4, y + cell - 36), p.name[:28], fill=(90, 54, 40))
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out, quality=92)
    print("contact sheet", out, sheet.size)


def main() -> None:
    STORE.mkdir(parents=True, exist_ok=True)
    RAW.mkdir(parents=True, exist_ok=True)
    FRAME_STORE.mkdir(parents=True, exist_ok=True)
    FRAME_REPO.mkdir(parents=True, exist_ok=True)

    preview_paths: list[Path] = []

    for dest_name, src_name in PROP_MAP.items():
        src = ART / src_name
        print("key", src_name, "->", dest_name)
        im = chroma_key(src)
        # keep raw keyed preview + repo
        save_png(im, STORE / dest_name, REPO / dest_name, RAW / dest_name, max_side=1024)
        preview_paths.append(STORE / dest_name)

    for dest_name, src_name in FRAME_MAP.items():
        src = ART / src_name
        print("frame", src_name, "->", dest_name)
        im = chroma_key(src)
        # deco-5 candle: shrink for scatter
        max_side = 420 if dest_name != "deco-5.png" else 360
        if dest_name == "deco-6.png":
            max_side = 360
        save_png(
            im,
            FRAME_STORE / dest_name,
            FRAME_REPO / dest_name,
            max_side=max_side,
        )
        preview_paths.append(FRAME_STORE / dest_name)

    for g in GUIDES:
        print("guide", g)
        copy_guide(g)
        preview_paths.append(STORE / g)

    # keep style sample hero if present in repo already; also copy preview ref note
    contact_sheet(preview_paths, STORE / "contact-sheet.jpg", cols=4, cell=260)
    print("done", len(preview_paths), "assets")


if __name__ == "__main__":
    main()
