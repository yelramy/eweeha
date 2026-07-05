#!/usr/bin/env python3
"""
Clean wedding-car fleet photos for production web use.

Fixes:
  - Phone-screenshot chrome (status bars, nav bars) and black/white letterbox
    bars on any side -> auto-detected and cropped so only the photo remains.
  - Mild, production-safe enhancement: luminance contrast stretch, slight
    saturation, unsharp mask, downscale of huge camera originals.

Usage:
  python clean-fleet-photos.py analyze   # dry run: report + review montages
  python clean-fleet-photos.py apply     # write cleaned images to OUT_ROOT

Originals are never modified. Videos and non-images are skipped.
"""

import csv
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

SRC_ROOT = Path(r"C:\Users\youss\Documents\personal\001 Wedding Cars-3-001\001 Wedding Cars-ORGANIZED")
OUT_ROOT = Path(r"C:\Users\youss\Documents\personal\001 Wedding Cars-3-001\001 Wedding Cars-CLEANED")
REVIEW_ROOT = Path(r"C:\Users\youss\Documents\personal\001 Wedding Cars-3-001\_clean_review")

IMG_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

# --- bar detection tuning ---
DARK_LUM = 48          # pixel counts as "bar-dark" below this luminance
DARK_FRAC = 0.90       # fraction of row/col pixels that must be bar-dark (HARD line)
DARK_STD = 16.0        # std of the dark pixels must be below (uniform, not shadow)
SOFT_DARK_FRAC = 0.52  # SOFT line: mostly dark but with UI text/icons on the bar
HALO_LUM = 80          # softer threshold for compression halo rows next to a bar
HALO_MAX = 6           # max halo rows to peel after a hard bar
LIGHT_LUM = 208        # pixel counts as "bar-light" above this
LIGHT_FRAC = 0.90
LIGHT_STD = 14.0
SOFT_LIGHT_FRAC = 0.70
LIGHT_BAND = 0.15      # light bars only detected within this fraction from an edge
DARK_LIMIT_H = 0.48    # max fraction of height peelable from one edge (letterbox can be big)
DARK_LIMIT_W = 0.40
MIN_KEEP_H = 0.22      # abort crop if less than this of the dimension would remain
MIN_KEEP_PX = 240      # and never keep less than this many pixels
MIN_KEEP_W = 0.45
MIN_CROP_PX = 3        # ignore crops smaller than this per side
HARD_RATIO = 0.50      # a soft-extended band must be at least this fraction HARD lines

# Per-file manual overrides, keyed by filename.
# value: None -> skip cropping entirely; (l, t, r, b) -> explicit crop box.
OVERRIDES: dict[str, tuple | None] = {
    # FB screenshot: caption block below photo resists row heuristics
    "mercedes-g-class-white-wedding-bridal-car-floral-decor-01.jpg": (0, 264, 540, 818),
}

# --- enhancement tuning ---
MAX_DIM = 2560         # downscale anything larger
JPEG_QUALITY = 90
SATURATION = 1.06
UNSHARP = dict(radius=1.6, percent=70, threshold=2)

# --- AI upscale (Real-ESRGAN portable) ---
ESRGAN_EXE = Path(r"C:\Users\youss\Documents\personal\001 Wedding Cars-3-001\_tools\realesrgan\realesrgan-ncnn-vulkan.exe")
UPSCALE_BELOW = 1100   # AI-upscale images whose long side is below this
UPSCALE_TARGET = 1600  # aim for at least this on the long side


def ai_upscale(img: Image.Image, tmp_dir: Path) -> Image.Image:
    """4x Real-ESRGAN upscale, then Lanczos down to a sane web size."""
    tmp_dir.mkdir(parents=True, exist_ok=True)
    tin = tmp_dir / "_up_in.png"
    tout = tmp_dir / "_up_out.png"
    img.save(tin)
    r = subprocess.run(
        [str(ESRGAN_EXE), "-i", str(tin), "-o", str(tout), "-n", "realesrgan-x4plus", "-s", "4"],
        capture_output=True, text=True,
    )
    if r.returncode != 0 or not tout.exists():
        return img  # fall back silently; caller keeps original
    up = Image.open(tout).convert("RGB")
    long_side = max(up.size)
    cap = max(UPSCALE_TARGET, min(long_side, 2000))
    if long_side > cap:
        scale = cap / long_side
        up = up.resize((round(up.width * scale), round(up.height * scale)), Image.LANCZOS)
    return up


def luminance(arr: np.ndarray) -> np.ndarray:
    a = arr.astype(np.float32)
    return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]


CHROME_LUM = 64        # flat digital gray (UI chrome / nav bar) upper bound
CHROME_STD = 6.0       # must be extremely uniform to count as chrome at that level
SOFT_STD = 32.0        # antialiased UI text on black pushes dark-pixel std up


def _classify_line(line: np.ndarray, allow_light: bool) -> str:
    """'hard' = pure bar line, 'soft' = bar line with UI glyphs, 'content' otherwise."""
    dark = line < DARK_LUM
    if dark.mean() >= DARK_FRAC and float(line[dark].std()) < DARK_STD:
        return "hard"
    chrome = line < CHROME_LUM
    if chrome.mean() >= DARK_FRAC and float(line[chrome].std()) < CHROME_STD:
        return "hard"  # flat gray UI chrome (e.g. Android nav bar)
    if allow_light:
        light = line > LIGHT_LUM
        if light.mean() >= LIGHT_FRAC and float(line[light].std()) < LIGHT_STD:
            return "hard"
        if light.mean() >= SOFT_LIGHT_FRAC:
            return "soft"  # light nav bar with gray glyphs
    # dark bar carrying UI glyphs/text (status bar, FB caption): background must
    # be truly black (median) even if bright icons cover much of the width
    if float(np.median(line)) < 40 and chrome.mean() >= SOFT_DARK_FRAC \
            and float(line[chrome].std()) < SOFT_STD:
        return "soft"
    return "content"


def _peel(lum: np.ndarray, axis: int, from_end: bool) -> int:
    """Return number of lines to peel from one edge along axis (0=rows, 1=cols)."""
    n = lum.shape[axis]
    other = lum.shape[1 - axis]
    if other < 40:
        return 0
    dark_limit = int(n * (DARK_LIMIT_H if axis == 0 else DARK_LIMIT_W))
    light_limit = max(int(n * LIGHT_BAND), 1)

    def line(i: int) -> np.ndarray:
        idx = n - 1 - i if from_end else i
        return lum[idx, :] if axis == 0 else lum[:, idx]

    kinds: list[str] = []
    for i in range(dark_limit):
        # light (white) bars only accepted near the physical edge
        k = _classify_line(line(i), allow_light=i < light_limit)
        if k == "content":
            break
        kinds.append(k)

    # trim trailing soft lines (could be a dark photo edge, keep them)
    while kinds and kinds[-1] == "soft":
        kinds.pop()
    peel = len(kinds)
    if peel == 0:
        return 0

    longest_hard = run = 0
    for k in kinds:
        run = run + 1 if k == "hard" else 0
        longest_hard = max(longest_hard, run)
    soft_frac = kinds.count("soft") / peel
    # accept full band only when anchored by a solid hard run and not mostly soft
    if longest_hard < max(6, n // 100) or soft_frac > 0.75:
        peel = 0
        for k in kinds:
            if k == "hard":
                peel += 1
            else:
                break
    if peel > 0:
        # peel soft compression halo directly after a hard bar
        halo = 0
        while halo < HALO_MAX and peel + halo < dark_limit:
            ln = line(peel + halo)
            if (ln < HALO_LUM).mean() >= 0.92:
                halo += 1
            else:
                break
        peel += halo
    return peel if peel >= MIN_CROP_PX else 0


def detect_crop(img: Image.Image) -> tuple[int, int, int, int]:
    """Return (left, top, right, bottom) crop box in image coords."""
    arr = np.asarray(img.convert("RGB"))
    lum = luminance(arr)
    h, w = lum.shape

    top = _peel(lum, 0, False)
    bottom = _peel(lum, 0, True)
    if h - top - bottom < max(h * MIN_KEEP_H, MIN_KEEP_PX):
        top = bottom = 0

    sub = lum[top: h - bottom, :]
    left = _peel(sub, 1, False)
    right = _peel(sub, 1, True)
    if w - left - right < w * MIN_KEEP_W:
        left = right = 0

    return (left, top, w - right, h - bottom)


def enhance(img: Image.Image, sharpen: bool = True) -> Image.Image:
    arr = np.asarray(img.convert("RGB"), dtype=np.float32)
    lum = 0.299 * arr[..., 0] + 0.587 * arr[..., 1] + 0.114 * arr[..., 2]
    lo = float(np.percentile(lum, 0.5))
    hi = float(np.percentile(lum, 99.5))
    if hi - lo < 235 and hi > lo:
        gain = min(255.0 / (hi - lo), 1.35)
        arr = np.clip((arr - lo) * gain, 0, 255)
    out = Image.fromarray(arr.astype(np.uint8))

    if max(out.size) > MAX_DIM:
        scale = MAX_DIM / max(out.size)
        out = out.resize((round(out.width * scale), round(out.height * scale)), Image.LANCZOS)

    out = ImageEnhance.Color(out).enhance(SATURATION)
    if sharpen:
        out = out.filter(ImageFilter.UnsharpMask(**UNSHARP))
    return out


def iter_images():
    for p in sorted(SRC_ROOT.rglob("*")):
        if p.is_file() and p.suffix.lower() in IMG_EXTS:
            yield p


def load(p: Path) -> Image.Image:
    img = Image.open(p)
    img = ImageOps.exif_transpose(img)
    return img.convert("RGB")


def get_crop(p: Path, img: Image.Image) -> tuple[int, int, int, int]:
    if p.name in OVERRIDES:
        ov = OVERRIDES[p.name]
        return ov if ov is not None else (0, 0, img.width, img.height)
    return detect_crop(img)


def cmd_analyze():
    REVIEW_ROOT.mkdir(parents=True, exist_ok=True)
    rows = []
    cropped_entries = []

    for p in iter_images():
        img = load(p)
        w, h = img.size
        l, t, r, b = get_crop(p, img)
        changed = (l, t, r, b) != (0, 0, w, h)
        cw, ch = r - l, b - t
        rows.append({
            "file": str(p.relative_to(SRC_ROOT)),
            "size": f"{w}x{h}",
            "crop_l": l, "crop_t": t, "crop_r": w - r, "crop_b": h - b,
            "result": f"{cw}x{ch}",
            "small": "YES" if cw < 900 else "",
        })
        if changed:
            cropped_entries.append((p, img, (l, t, r, b)))

    with open(REVIEW_ROOT / "report.csv", "w", newline="", encoding="utf-8") as f:
        wtr = csv.DictWriter(f, fieldnames=rows[0].keys())
        wtr.writeheader()
        wtr.writerows(rows)

    # montage sheets: original with red crop box | cropped result
    thumb_w = 360
    pairs_per_sheet = 8
    for si in range(0, len(cropped_entries), pairs_per_sheet):
        chunk = cropped_entries[si: si + pairs_per_sheet]
        cells = []
        for p, img, box in chunk:
            orig = img.copy()
            d = ImageDraw.Draw(orig)
            d.rectangle(box, outline=(255, 0, 0), width=max(3, orig.width // 200))
            crop = img.crop(box)
            for im in (orig, crop):
                im.thumbnail((thumb_w, thumb_w), Image.LANCZOS)
            cells.append((p.name, orig, crop))
        cell_h = max(max(o.height, c.height) for _, o, c in cells) + 26
        cols = 2
        rows_n = (len(cells) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * (thumb_w * 2 + 30) + 20, rows_n * cell_h + 20), (34, 34, 34))
        d = ImageDraw.Draw(sheet)
        for i, (name, o, c) in enumerate(cells):
            cx = 10 + (i % cols) * (thumb_w * 2 + 30)
            cy = 10 + (i // cols) * cell_h
            sheet.paste(o, (cx, cy + 20))
            sheet.paste(c, (cx + thumb_w + 10, cy + 20))
            d.text((cx, cy + 4), name[:60], fill=(255, 220, 120))
        out = REVIEW_ROOT / f"montage_{si // pairs_per_sheet + 1:02d}.jpg"
        sheet.save(out, quality=85)

    n_changed = len(cropped_entries)
    n_small = sum(1 for r in rows if r["small"])
    print(f"images={len(rows)} cropped={n_changed} small_after_crop={n_small}")
    print(f"review sheets: {REVIEW_ROOT}")


def cmd_apply():
    OUT_ROOT.mkdir(parents=True, exist_ok=True)
    tmp = OUT_ROOT / "_tmp"
    n = n_up = 0
    for p in iter_images():
        img = load(p)
        box = get_crop(p, img)
        if box != (0, 0, img.width, img.height):
            img = img.crop(box)
        upscaled = False
        if max(img.size) < UPSCALE_BELOW and ESRGAN_EXE.exists():
            up = ai_upscale(img, tmp)
            if up.size != img.size:
                img, upscaled = up, True
                n_up += 1
        img = enhance(img, sharpen=not upscaled)
        rel = p.relative_to(SRC_ROOT)
        dest = (OUT_ROOT / rel).with_suffix(".jpg")
        dest.parent.mkdir(parents=True, exist_ok=True)
        img.save(dest, quality=JPEG_QUALITY, optimize=True, progressive=True, subsampling=0)
        n += 1
        if n % 20 == 0:
            print(f"...{n} done ({n_up} upscaled)", flush=True)
    for f in tmp.glob("_up_*.png") if tmp.exists() else []:
        f.unlink()
    if tmp.exists():
        try:
            tmp.rmdir()
        except OSError:
            pass
    print(f"written={n} ai_upscaled={n_up} -> {OUT_ROOT}")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "analyze"
    if cmd == "analyze":
        cmd_analyze()
    elif cmd == "apply":
        cmd_apply()
    else:
        print("usage: clean-fleet-photos.py [analyze|apply]")
        sys.exit(1)
