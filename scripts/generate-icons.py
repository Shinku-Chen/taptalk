"""Generate the TapTalk PWA icons. Requires Pillow (pip install pillow)."""

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
SCALE = 4
SIZE = 512 * SCALE


def build_icon():
    gradient = Image.new("RGB", (SIZE, SIZE), "#1456d8")
    pixels = gradient.load()
    start = (45, 123, 255)
    end = (11, 63, 168)
    for y in range(SIZE):
        for x in range(SIZE):
            ratio = (x + y) / (2 * (SIZE - 1))
            pixels[x, y] = tuple(round(start[i] + (end[i] - start[i]) * ratio) for i in range(3))

    icon = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 255))
    icon.paste(gradient, (0, 0))
    draw = ImageDraw.Draw(icon)

    bubble = (128 * SCALE, 105 * SCALE, 384 * SCALE, 323 * SCALE)
    draw.rounded_rectangle(bubble, radius=43 * SCALE, fill="#ffffff")
    draw.polygon(
        [
            (238 * SCALE, 323 * SCALE),
            (160 * SCALE, 380 * SCALE),
            (160 * SCALE, 323 * SCALE),
        ],
        fill="#ffffff",
    )

    for cx in (196, 256, 316):
        draw.ellipse(
            (
                (cx - 19) * SCALE,
                (214 - 19) * SCALE,
                (cx + 19) * SCALE,
                (214 + 19) * SCALE,
            ),
            fill="#1456d8",
        )

    return icon


def save_png(icon, name, size):
    ASSETS.mkdir(parents=True, exist_ok=True)
    icon.resize((size, size), Image.Resampling.LANCZOS).save(ASSETS / name, optimize=True)


if __name__ == "__main__":
    icon = build_icon()
    save_png(icon, "icon-180.png", 180)
    save_png(icon, "icon-192.png", 192)
    save_png(icon, "icon-512.png", 512)
    print("Generated icons in", ASSETS)
