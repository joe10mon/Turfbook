"""Generate original top-down turf illustrations as SVG files.

    python tools/gen_images.py

Output goes to frontend/public/img. Replace any of these with real photography
whenever you have it: the app only references the file paths.
"""
import math
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "frontend" / "public" / "img"
(OUT / "turfs").mkdir(parents=True, exist_ok=True)

VARIANTS = {
    # grass light, grass dark, surround, overlay opacity, glow opacity
    "day": dict(g1="#46a85f", g2="#3b9852", out="#2a7040", dark=0.0, glow=0.0),
    "dusk": dict(g1="#3d9456", g2="#33834a", out="#235c37", dark=0.0, glow=0.25),
    "night": dict(g1="#1f6b3b", g2="#195c33", out="#0f3a22", dark=0.55, glow=0.6),
}

LINE = "#f8f5ea"


def defs(W, H, v, vid):
    p = VARIANTS[v]
    sky = ""
    if v == "dusk":
        sky = (f'<linearGradient id="sky{vid}" x1="0" y1="0" x2="0" y2="1">'
               '<stop offset="0" stop-color="#ff9a4d" stop-opacity=".38"/>'
               '<stop offset=".55" stop-color="#d45f8c" stop-opacity=".18"/>'
               '<stop offset="1" stop-color="#4b2f86" stop-opacity=".42"/></linearGradient>')
    return (
        f'<defs>{sky}'
        f'<radialGradient id="glow{vid}"><stop offset="0" stop-color="#fffbe0" stop-opacity="{p["glow"]}"/>'
        '<stop offset="1" stop-color="#fffbe0" stop-opacity="0"/></radialGradient>'
        '<radialGradient id="vig' + vid + '" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/>'
        '<stop offset="1" stop-color="#000" stop-opacity=".4"/></radialGradient></defs>'
    )


def overlay(W, H, v, vid):
    p = VARIANTS[v]
    s = ""
    if v == "dusk":
        s += f'<rect width="{W}" height="{H}" fill="url(#sky{vid})"/>'
    if p["dark"]:
        s += f'<rect width="{W}" height="{H}" fill="#03101f" opacity="{p["dark"]}"/>'
    if p["glow"]:
        r = min(W, H) * 0.42
        for (x, y) in [(W * .06, H * .08), (W * .94, H * .08), (W * .06, H * .92), (W * .94, H * .92)]:
            s += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.0f}" fill="url(#glow{vid})"/>'
            s += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="7" fill="#fffbe0"/>'
    s += f'<rect width="{W}" height="{H}" fill="url(#vig{vid})"/>'
    return s


def svg(W, H, body, v, vid):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" '
            f'preserveAspectRatio="xMidYMid slice">{defs(W, H, v, vid)}{body}{overlay(W, H, v, vid)}</svg>')


def line_attrs(w=4):
    return f'fill="none" stroke="{LINE}" stroke-width="{w}" stroke-linecap="round"'


# ---------------------------------------------------------------- football
def football(W, H, v, vid="f"):
    p = VARIANTS[v]
    m = round(W * 0.075)
    x0, y0, w, h = m, round(H * 0.09), W - 2 * m, round(H * 0.82)
    body = f'<rect width="{W}" height="{H}" fill="{p["out"]}"/>'
    n = 12
    for i in range(n):
        body += f'<rect x="{x0 + i * w / n:.1f}" y="{y0}" width="{w / n + .5:.1f}" height="{h}" fill="{p["g1"] if i % 2 == 0 else p["g2"]}"/>'
    cx, cy = x0 + w / 2, y0 + h / 2
    L = line_attrs(4)
    body += f'<rect x="{x0}" y="{y0}" width="{w}" height="{h}" {L}/>'
    body += f'<line x1="{cx}" y1="{y0}" x2="{cx}" y2="{y0 + h}" {L}/>'
    body += f'<circle cx="{cx}" cy="{cy}" r="{h * .14:.0f}" {L}/><circle cx="{cx}" cy="{cy}" r="5" fill="{LINE}"/>'
    bw, bh = w * .16, h * .52
    gw, gh = w * .06, h * .26
    for side in (0, 1):
        bx = x0 if side == 0 else x0 + w - bw
        gx = x0 if side == 0 else x0 + w - gw
        body += f'<rect x="{bx:.0f}" y="{cy - bh / 2:.0f}" width="{bw:.0f}" height="{bh:.0f}" {L}/>'
        body += f'<rect x="{gx:.0f}" y="{cy - gh / 2:.0f}" width="{gw:.0f}" height="{gh:.0f}" {L}/>'
        px = x0 + w * .11 if side == 0 else x0 + w - w * .11
        body += f'<circle cx="{px:.0f}" cy="{cy}" r="4" fill="{LINE}"/>'
        # goal mouth
        gm_x = x0 - 14 if side == 0 else x0 + w
        body += f'<rect x="{gm_x}" y="{cy - h * .07:.0f}" width="14" height="{h * .14:.0f}" fill="none" stroke="{LINE}" stroke-width="3"/>'
    return svg(W, H, body, v, vid)


# ----------------------------------------------------------------- cricket
def cricket(W, H, v, vid="c"):
    p = VARIANTS[v]
    cx, cy = W / 2, H / 2
    rx, ry = W * .42, H * .44
    body = f'<rect width="{W}" height="{H}" fill="{p["out"]}"/>'
    body += f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{p["g2"]}"/>'
    for i in range(7, 0, -1):
        k = i / 7
        body += f'<ellipse cx="{cx}" cy="{cy}" rx="{rx * k:.0f}" ry="{ry * k:.0f}" fill="{p["g1"] if i % 2 == 0 else p["g2"]}"/>'
    L = line_attrs(4)
    body += f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" {L} stroke-dasharray="3 14"/>'
    body += f'<ellipse cx="{cx}" cy="{cy}" rx="{rx * .55:.0f}" ry="{ry * .55:.0f}" {L} stroke-dasharray="14 12" opacity=".8"/>'
    pw, ph = W * .06, H * .42
    body += f'<rect x="{cx - pw / 2:.0f}" y="{cy - ph / 2:.0f}" width="{pw:.0f}" height="{ph:.0f}" rx="4" fill="#d8c18d"/>'
    for yy in (cy - ph / 2 + ph * .12, cy + ph / 2 - ph * .12):
        body += f'<line x1="{cx - pw * .8:.0f}" y1="{yy:.0f}" x2="{cx + pw * .8:.0f}" y2="{yy:.0f}" {line_attrs(3)}/>'
    for yy in (cy - ph / 2 + 10, cy + ph / 2 - 10):
        for dx in (-9, 0, 9):
            body += f'<rect x="{cx + dx - 2:.0f}" y="{yy - 8:.0f}" width="4" height="16" fill="#fff6cf"/>'
    return svg(W, H, body, v, vid)


# --------------------------------------------------------------- badminton
def badminton(W, H, v, vid="b"):
    p = VARIANTS[v]
    floor = {"day": "#b98a52", "dusk": "#a97b45", "night": "#8a5f33"}[v]
    court = {"day": "#2c8a62", "dusk": "#277a56", "night": "#1f6848"}[v]
    body = f'<rect width="{W}" height="{H}" fill="{floor}"/>'
    for i in range(0, H, 38):
        body += f'<rect x="0" y="{i}" width="{W}" height="2" fill="#000" opacity=".07"/>'
    s = W * .058  # px per metre (court is 13.4 x 6.1 m, so it fills ~78% of the width)
    cw, ch = 13.4 * s, 6.1 * s
    x0, y0 = (W - cw) / 2, (H - ch) / 2
    body += f'<rect x="{x0 - 28:.0f}" y="{y0 - 28:.0f}" width="{cw + 56:.0f}" height="{ch + 56:.0f}" fill="{court}" opacity=".35"/>'
    body += f'<rect x="{x0:.0f}" y="{y0:.0f}" width="{cw:.0f}" height="{ch:.0f}" fill="{court}"/>'
    L = line_attrs(4)
    body += f'<rect x="{x0:.0f}" y="{y0:.0f}" width="{cw:.0f}" height="{ch:.0f}" {L}/>'
    inset = .46 * s
    body += f'<line x1="{x0:.0f}" y1="{y0 + inset:.0f}" x2="{x0 + cw:.0f}" y2="{y0 + inset:.0f}" {L}/>'
    body += f'<line x1="{x0:.0f}" y1="{y0 + ch - inset:.0f}" x2="{x0 + cw:.0f}" y2="{y0 + ch - inset:.0f}" {L}/>'
    cx = W / 2
    for dx in (-1.98 * s, 1.98 * s):
        body += f'<line x1="{cx + dx:.0f}" y1="{y0:.0f}" x2="{cx + dx:.0f}" y2="{y0 + ch:.0f}" {L}/>'
    for sign in (-1, 1):
        body += f'<line x1="{cx + sign * 1.98 * s:.0f}" y1="{H / 2:.0f}" x2="{cx + sign * cw / 2:.0f}" y2="{H / 2:.0f}" {L}/>'
        lx = cx + sign * (cw / 2 - .76 * s)
        body += f'<line x1="{lx:.0f}" y1="{y0:.0f}" x2="{lx:.0f}" y2="{y0 + ch:.0f}" {L}/>'
    body += f'<line x1="{cx}" y1="{y0 - 20:.0f}" x2="{cx}" y2="{y0 + ch + 20:.0f}" stroke="#fff" stroke-width="7" opacity=".9"/>'
    body += f'<line x1="{cx}" y1="{y0 - 20:.0f}" x2="{cx}" y2="{y0 + ch + 20:.0f}" stroke="#222" stroke-width="2" stroke-dasharray="3 3" opacity=".5"/>'
    return svg(W, H, body, v, vid)


# -------------------------------------------------------------- basketball
def basketball(W, H, v, vid="k"):
    floor = {"day": "#d39a55", "dusk": "#c28c4b", "night": "#a06f38"}[v]
    paint = {"day": "#b94a33", "dusk": "#a64230", "night": "#8c3827"}[v]
    sc = W / 30.0  # court is 28 x 15 m with margin
    cw, ch = 28 * sc, 15 * sc
    x0, y0 = (W - cw) / 2, (H - ch) / 2
    body = f'<rect width="{W}" height="{H}" fill="#7d5428"/>'
    body += f'<rect x="{x0 - 30:.0f}" y="{y0 - 30:.0f}" width="{cw + 60:.0f}" height="{ch + 60:.0f}" fill="{floor}" opacity=".6"/>'
    body += f'<rect x="{x0:.0f}" y="{y0:.0f}" width="{cw:.0f}" height="{ch:.0f}" fill="{floor}"/>'
    for i in range(0, int(cw), 44):
        body += f'<rect x="{x0 + i:.0f}" y="{y0:.0f}" width="2" height="{ch:.0f}" fill="#000" opacity=".06"/>'
    L = line_attrs(4)
    cx, cy = W / 2, H / 2
    body += f'<rect x="{x0:.0f}" y="{y0:.0f}" width="{cw:.0f}" height="{ch:.0f}" {L}/>'
    body += f'<line x1="{cx}" y1="{y0:.0f}" x2="{cx}" y2="{y0 + ch:.0f}" {L}/>'
    body += f'<circle cx="{cx}" cy="{cy}" r="{1.8 * sc:.0f}" {L}/>'

    def half():
        key_l, key_w = 5.8 * sc, 4.9 * sc
        g = f'<rect x="{x0:.0f}" y="{cy - key_w / 2:.0f}" width="{key_l:.0f}" height="{key_w:.0f}" fill="{paint}" stroke="{LINE}" stroke-width="4"/>'
        g += f'<circle cx="{x0 + key_l:.0f}" cy="{cy}" r="{1.8 * sc:.0f}" {L}/>'
        bx = x0 + 1.575 * sc
        r = 6.75 * sc
        off = .9 * sc
        dy = (ch / 2) - off
        dx = math.sqrt(max(r * r - dy * dy, 0))
        g += (f'<path d="M{x0:.0f},{y0 + off:.0f} H{bx + dx:.0f} A{r:.0f},{r:.0f} 0 0 1 {bx + dx:.0f},{y0 + ch - off:.0f} '
              f'H{x0:.0f}" {L}/>')
        g += f'<circle cx="{bx:.0f}" cy="{cy}" r="{.23 * sc:.0f}" fill="none" stroke="#ff7a1a" stroke-width="5"/>'
        g += f'<line x1="{x0 + 1.2 * sc:.0f}" y1="{cy - .9 * sc:.0f}" x2="{x0 + 1.2 * sc:.0f}" y2="{cy + .9 * sc:.0f}" stroke="{LINE}" stroke-width="6"/>'
        return g

    body += half()
    body += f'<g transform="translate({W},0) scale(-1,1)">{half()}</g>'
    return svg(W, H, body, v, vid)


# ------------------------------------------------------------- multi-sport
def multi(W, H, v, vid="m"):
    blue = {"day": "#2563a8", "dusk": "#215791", "night": "#173f6b"}[v]
    out = {"day": "#8f2f2f", "dusk": "#7d2929", "night": "#5a1d1d"}[v]
    m = round(W * .08)
    x0, y0, w, h = m, round(H * .12), W - 2 * m, round(H * .76)
    body = f'<rect width="{W}" height="{H}" fill="{out}"/>'
    body += f'<rect x="{x0}" y="{y0}" width="{w}" height="{h}" fill="{blue}"/>'
    for i in range(0, w, 70):
        body += f'<rect x="{x0 + i}" y="{y0}" width="35" height="{h}" fill="#fff" opacity=".035"/>'
    L = line_attrs(5)
    cx, cy = x0 + w / 2, y0 + h / 2
    body += f'<rect x="{x0}" y="{y0}" width="{w}" height="{h}" {L}/>'
    body += f'<line x1="{cx}" y1="{y0}" x2="{cx}" y2="{y0 + h}" {L}/>'
    body += f'<circle cx="{cx}" cy="{cy}" r="{h * .16:.0f}" {L}/>'
    r = h * .30
    body += f'<path d="M{x0},{cy - r:.0f} A{r:.0f},{r:.0f} 0 0 1 {x0},{cy + r:.0f}" {L}/>'
    body += f'<path d="M{x0 + w},{cy - r:.0f} A{r:.0f},{r:.0f} 0 0 0 {x0 + w},{cy + r:.0f}" {L}/>'
    # overlaid basketball-style key on one end, to hint at multi-use
    gold = 'fill="none" stroke="#ffd45c" stroke-width="5" opacity=".9"'
    body += f'<rect x="{x0}" y="{cy - h * .13:.0f}" width="{w * .13:.0f}" height="{h * .26:.0f}" {gold}/>'
    body += f'<rect x="{x0 + w - w * .13:.0f}" y="{cy - h * .13:.0f}" width="{w * .13:.0f}" height="{h * .26:.0f}" {gold}/>'
    for gx in (x0 - 16, x0 + w):
        body += f'<rect x="{gx}" y="{cy - h * .09:.0f}" width="16" height="{h * .18:.0f}" fill="none" stroke="{LINE}" stroke-width="3"/>'
    return svg(W, H, body, v, vid)


SPORTS = {"football": football, "cricket": cricket, "badminton": badminton,
          "basketball": basketball, "multi": multi}


def main():
    count = 0
    for sport, fn in SPORTS.items():
        for v in VARIANTS:
            (OUT / "turfs" / f"{sport}-{v}.svg").write_text(fn(1200, 800, v, f"{sport[0]}{v[0]}"), encoding="utf-8")
            count += 1
    (OUT / "hero.svg").write_text(football(1800, 900, "dusk", "hero"), encoding="utf-8")
    (OUT / "banner-night.svg").write_text(football(1800, 700, "night", "ban"), encoding="utf-8")
    (OUT / "banner-cricket.svg").write_text(cricket(1800, 700, "dusk", "bc"), encoding="utf-8")
    count += 3
    print(f"Wrote {count} images to {OUT}")


if __name__ == "__main__":
    main()
