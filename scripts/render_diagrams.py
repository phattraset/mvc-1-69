from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "design"
FONT_REGULAR = "C:/Windows/Fonts/segoeui.ttf"
FONT_BOLD = "C:/Windows/Fonts/segoeuib.ttf"


def font(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REGULAR, size)


def arrow(draw, start, end, color="#50627f", width=4):
    draw.line([start, end], fill=color, width=width)
    x2, y2 = end
    x1, y1 = start
    dx, dy = x2 - x1, y2 - y1
    length = max((dx * dx + dy * dy) ** 0.5, 1)
    ux, uy = dx / length, dy / length
    px, py = -uy, ux
    size = 14
    p1 = (x2 - ux * size + px * size * 0.55, y2 - uy * size + py * size * 0.55)
    p2 = (x2 - ux * size - px * size * 0.55, y2 - uy * size - py * size * 0.55)
    draw.polygon([end, p1, p2], fill=color)


def rounded_box(draw, box, title, lines, accent="#3ee7d0"):
    x1, y1, x2, y2 = box
    draw.rounded_rectangle(box, radius=18, fill="#151d2d", outline="#34415c", width=3)
    draw.rounded_rectangle((x1, y1, x2, y1 + 68), radius=18, fill=accent)
    draw.rectangle((x1, y1 + 48, x2, y1 + 68), fill=accent)
    draw.text((x1 + 22, y1 + 16), title, font=font(28, True), fill="#07100f")
    y = y1 + 92
    for line in lines:
        draw.text((x1 + 24, y), line, font=font(21), fill="#e9eef8")
        y += 36


def render_class_diagram():
    image = Image.new("RGB", (1800, 1320), "#080b12")
    draw = ImageDraw.Draw(image)
    draw.text((90, 58), "Ladkrabang's Got Talent", font=font(48, True), fill="#f6f7fb")
    draw.text((90, 118), "MVC Class / Responsibility Diagram", font=font(27), fill="#8fa0bb")

    rounded_box(draw, (90, 220, 520, 520), "VIEW", [
        "DashboardView", "+ renderDashboard(data)", "+ renderContestantDetail(data)", "HTML + CSS presentation"
    ], "#60a5fa")
    rounded_box(draw, (685, 220, 1115, 520), "CONTROLLER", [
        "TalentController", "+ handle(request, response)", "+ dashboard() / detail()", "Routes actions to Model"
    ], "#c084fc")
    rounded_box(draw, (1280, 220, 1710, 520), "MODEL / DOMAIN", [
        "TalentShow", "+ submitDecision()", "+ useGoldenBuzzer()", "+ getState() / getSummary()"
    ], "#3ee7d0")

    arrow(draw, (520, 370), (685, 370))
    draw.text((545, 330), "form action", font=font(19), fill="#8fa0bb")
    arrow(draw, (1115, 370), (1280, 370))
    draw.text((1143, 330), "domain call", font=font(19), fill="#8fa0bb")
    arrow(draw, (1280, 440), (1115, 440))
    arrow(draw, (685, 440), (520, 440))
    draw.text((575, 455), "state / result", font=font(19), fill="#8fa0bb")

    rounded_box(draw, (120, 700, 490, 1050), "Contestant", [
        "+ id, name, performance", "+ status", "+ decisions: Map", "+ qualification", "0..4 Decisions"
    ], "#fbbf24")
    rounded_box(draw, (580, 700, 950, 1010), "Judge", [
        "+ id, name", "+ goldenBuzzerContestantId", "Exactly one GB maximum"
    ], "#fbbf24")
    rounded_box(draw, (1040, 700, 1410, 1010), "Decision", [
        "+ judgeId", "+ result: PASS | FAIL", "Unique by judge/contestant"
    ], "#fbbf24")
    rounded_box(draw, (1500, 700, 1710, 1010), "Enums", [
        "STATUS", "PENDING", "ADVANCED", "ELIMINATED"
    ], "#fbbf24")

    arrow(draw, (1490, 520), (1490, 650))
    draw.line([(1490, 650), (305, 650), (305, 700)], fill="#50627f", width=4)
    draw.line([(765, 650), (765, 700)], fill="#50627f", width=4)
    draw.line([(1225, 650), (1225, 700)], fill="#50627f", width=4)
    draw.line([(1605, 650), (1605, 700)], fill="#50627f", width=4)
    draw.text((1320, 606), "owns domain state", font=font(20), fill="#8fa0bb")

    draw.rounded_rectangle((90, 1165, 1710, 1245), radius=14, fill="#0e1523", outline="#293249", width=2)
    draw.text((120, 1190), "Business rules stay in TalentShow; View and Controller never decide qualification.", font=font(26, True), fill="#3ee7d0")
    image.save(OUT / "class-diagram.png", optimize=True)


def render_sequence_diagram():
    image = Image.new("RGB", (1800, 1580), "#080b12")
    draw = ImageDraw.Draw(image)
    draw.text((90, 58), "Sequence Diagram — T3", font=font(48, True), fill="#f6f7fb")
    draw.text((90, 118), "J04 gives PASS to P02 as the fourth normal decision", font=font(27), fill="#8fa0bb")

    participants = [
        (210, "Judge J04", "Actor"),
        (650, "Dashboard View", "View"),
        (1080, "TalentController", "Controller"),
        (1510, "TalentShow", "Model")
    ]
    for x, name, role in participants:
        draw.rounded_rectangle((x - 150, 210, x + 150, 310), radius=15, fill="#151d2d", outline="#3ee7d0", width=3)
        box = draw.textbbox((0, 0), name, font=font(24, True))
        draw.text((x - (box[2] - box[0]) / 2, 230), name, font=font(24, True), fill="#f6f7fb")
        role_box = draw.textbbox((0, 0), role, font=font(18))
        draw.text((x - (role_box[2] - role_box[0]) / 2, 270), role, font=font(18), fill="#8fa0bb")
        draw.line((x, 310, x, 1460), fill="#50627f", width=3)

    messages = [
        (380, 210, 650, "1. Select P02, J04 and PASS", "#60a5fa"),
        (500, 650, 1080, "2. POST /contestants/P02/decisions", "#60a5fa"),
        (620, 1080, 1510, "3. submitDecision(J04, P02, PASS)", "#c084fc"),
        (750, 1510, 1510, "4. Validate PENDING + no duplicate", "#fbbf24"),
        (880, 1510, 1510, "5. Store fourth Decision", "#fbbf24"),
        (1010, 1510, 1510, "6. Count PASS=3, FAIL=1", "#fbbf24"),
        (1140, 1510, 1510, "7. Set status = ADVANCED", "#3ee7d0"),
        (1270, 1510, 1080, "8. Return success + current state", "#3ee7d0"),
        (1385, 1080, 650, "9. 303 redirect with notice", "#3ee7d0"),
        (1490, 650, 210, "10. Show P02 advanced (3/1)", "#3ee7d0")
    ]
    for y, source, target, label, color in messages:
        if source == target:
            draw.line((source, y, source + 150, y), fill=color, width=4)
            draw.line((source + 150, y, source + 150, y + 52), fill=color, width=4)
            arrow(draw, (source + 150, y + 52), (source, y + 52), color)
            draw.text((source - 360, y + 10), label, font=font(21), fill="#e9eef8")
        else:
            arrow(draw, (source, y), (target, y), color)
            left = min(source, target) + 18
            draw.text((left, y - 35), label, font=font(21), fill="#e9eef8")

    image.save(OUT / "sequence-diagram.png", optimize=True)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    render_class_diagram()
    render_sequence_diagram()
    print("Rendered class-diagram.png and sequence-diagram.png")
