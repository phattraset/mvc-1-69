from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "Student_Submission_MVC_Practice_Completed.pdf"

NAVY = colors.HexColor("#0B1220")
PANEL = colors.HexColor("#EEF3F8")
LINE = colors.HexColor("#B7C2D0")
TEAL = colors.HexColor("#0B8178")
GOLD = colors.HexColor("#B87900")
RED = colors.HexColor("#B4233A")
MUTED = colors.HexColor("#536174")


def register_fonts():
    pdfmetrics.registerFont(TTFont("Leela", "C:/Windows/Fonts/LeelawUI.ttf"))
    pdfmetrics.registerFont(TTFont("Leela-Bold", "C:/Windows/Fonts/LeelaUIb.ttf"))


def p(text, style):
    return Paragraph(text, style)


def build_styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "TitleThai", parent=base["Title"], fontName="Leela-Bold", fontSize=24,
            leading=30, textColor=NAVY, alignment=TA_CENTER, spaceAfter=6
        ),
        "subtitle": ParagraphStyle(
            "SubtitleThai", parent=base["Normal"], fontName="Leela", fontSize=11,
            leading=16, textColor=MUTED, alignment=TA_CENTER, spaceAfter=16
        ),
        "section": ParagraphStyle(
            "SectionThai", parent=base["Heading2"], fontName="Leela-Bold", fontSize=15,
            leading=20, textColor=NAVY, spaceBefore=8, spaceAfter=8
        ),
        "body": ParagraphStyle(
            "BodyThai", parent=base["BodyText"], fontName="Leela", fontSize=9.5,
            leading=14, textColor=NAVY, spaceAfter=5
        ),
        "small": ParagraphStyle(
            "SmallThai", parent=base["BodyText"], fontName="Leela", fontSize=8,
            leading=11, textColor=NAVY
        ),
        "small_center": ParagraphStyle(
            "SmallCenterThai", parent=base["BodyText"], fontName="Leela", fontSize=8,
            leading=11, textColor=NAVY, alignment=TA_CENTER
        ),
        "table_head": ParagraphStyle(
            "TableHeadThai", parent=base["BodyText"], fontName="Leela-Bold", fontSize=8.2,
            leading=11, textColor=colors.white, alignment=TA_CENTER
        ),
        "note": ParagraphStyle(
            "NoteThai", parent=base["BodyText"], fontName="Leela", fontSize=8.5,
            leading=12, textColor=MUTED
        ),
    }


def table(data, widths, header=True, row_heights=None):
    t = Table(data, colWidths=widths, rowHeights=row_heights, repeatRows=1 if header else 0)
    commands = [
        ("FONTNAME", (0, 0), (-1, -1), "Leela"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.6, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("ROWBACKGROUNDS", (0, 1 if header else 0), (-1, -1), [colors.white, PANEL]),
    ]
    if header:
        commands += [
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ]
    t.setStyle(TableStyle(commands))
    return t


def header_footer(canvas, doc):
    canvas.saveState()
    width, height = letter
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(18 * mm, 15 * mm, width - 18 * mm, 15 * mm)
    canvas.setFont("Leela", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(18 * mm, 9.5 * mm, "Exit Exam MVC 1/2569 - ฉบับฝึกทำ")
    canvas.drawRightString(width - 18 * mm, 9.5 * mm, f"หน้า {doc.page}")
    canvas.restoreState()


def build_pdf():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    register_fonts()
    s = build_styles()
    doc = SimpleDocTemplate(
        str(OUTPUT), pagesize=letter, rightMargin=18 * mm, leftMargin=18 * mm,
        topMargin=17 * mm, bottomMargin=21 * mm, title="Student Submission MVC Practice",
        author="Codex - generated for practice use"
    )
    story = []

    story += [
        p("แบบฟอร์มสรุปการส่งคำตอบ", s["title"]),
        p("Exit Exam MVC 1/2569 - เสาร์เช้า - ฉบับฝึกทำ", s["subtitle"]),
        p("1) วิธีเปิดโปรแกรมและจุดเริ่มต้นของโปรแกรม", s["section"]),
        p("เปิดโฟลเดอร์ <b>D:\\mvc 2026</b> ใน VS Code แล้วรัน <b>npm start</b> จาก Terminal จากนั้นเปิดลิงก์ที่โปรแกรมแสดง เช่น <b>http://localhost:3000</b> หากพอร์ตถูกใช้งาน ระบบจะเลือกพอร์ตถัดไปอัตโนมัติ จุดเริ่มต้นคือ <b>src/server.js</b>", s["body"]),
        p("2) ตารางเชื่อมโยง Requirements", s["section"]),
    ]

    req_rows = [
        [p("Requirement", s["table_head"]), p("Model / Domain", s["table_head"]), p("Controller / Action", s["table_head"]), p("View / Screen", s["table_head"])],
        [p("R1", s["small_center"]), p("TalentShow, STATUS, RESULT และสถานะในหน่วยความจำ", s["small"]), p("TalentController.handle() และ createApp()", s["small"]), p("Dashboard และหน้ารายละเอียด", s["small"])],
        [p("R2", s["small_center"]), p("submitDecision() ตรวจ PENDING และผลซ้ำ", s["small"]), p("POST /contestants/:id/decisions", s["small"]), p("รายการผู้แข่งขัน ฟอร์ม PASS/FAIL และตารางผล", s["small"])],
        [p("R3", s["small_center"]), p("finalizeNormal() สรุปเมื่อครบ 4 ผล และใช้เกณฑ์ PASS ตั้งแต่ 3", s["small"]), p("บันทึกผลแล้ว redirect พร้อมสถานะล่าสุด", s["small"]), p("badge สถานะและจำนวนผ่าน/ไม่ผ่าน", s["small"])],
        [p("R4", s["small_center"]), p("useGoldenBuzzer() ตรวจสิทธิ์หนึ่งครั้งและ provenance", s["small"]), p("POST /contestants/:id/golden-buzzer", s["small"]), p("ปุ่ม Golden Buzzer และชื่อกรรมการผู้ใช้สิทธิ์", s["small"])],
        [p("R5", s["small_center"]), p("getSummary() และ DomainError พร้อมเหตุผล", s["small"]), p("success/error redirect และ GET /api/state", s["small"]), p("สรุปแยก 3 กลุ่มและ alert แจ้งผล", s["small"])],
    ]
    story += [table(req_rows, [23 * mm, 48 * mm, 52 * mm, 53 * mm]), Spacer(1, 7 * mm), PageBreak()]

    story += [
        p("3) ผลการทดสอบ", s["section"]),
        p("ทดสอบจาก seed_data.json ตามลำดับ T1-T6 ในสถานะการทำงานเดียวกัน และตรวจเพิ่มด้วย automated tests คำสั่ง <b>npm test</b>", s["body"]),
    ]
    test_rows = [
        [p("กรณี", s["table_head"]), p("ผ่าน/ไม่ผ่าน", s["table_head"]), p("ผลจริงและหมายเหตุ", s["table_head"])],
        [p("T1", s["small_center"]), p("ผ่าน", s["small_center"]), p("J02 ให้ PASS แก่ P01 สำเร็จ P01 มีผล 2/4 และยังอยู่ในสถานะรอผล", s["small"])],
        [p("T2", s["small_center"]), p("ผ่าน", s["small_center"]), p("ปฏิเสธผลซ้ำของ J01/P01 พร้อมเหตุผล จำนวนผลของ P01 ไม่เปลี่ยน", s["small"])],
        [p("T3", s["small_center"]), p("ผ่าน", s["small_center"]), p("J04 ให้ PASS เป็นผลที่ 4 ของ P02 สรุปเป็น PASS 3 / FAIL 1 และผ่านเข้ารอบ", s["small"])],
        [p("T4", s["small_center"]), p("ผ่าน", s["small_center"]), p("J02 ใช้ Golden Buzzer กับ P03 สำเร็จ P03 ผ่านทันที และบันทึกว่า J02 ใช้สิทธิ์แล้ว", s["small"])],
        [p("T5", s["small_center"]), p("ผ่าน", s["small_center"]), p("ปฏิเสธ J04 ใช้ Golden Buzzer กับ P04 เพราะข้อมูลตั้งต้นระบุว่าใช้กับ P06 แล้ว", s["small"])],
        [p("T6", s["small_center"]), p("ผ่าน", s["small_center"]), p("J04 ให้ FAIL เป็นผลที่ 4 ของ P05 สรุปเป็น PASS 2 / FAIL 2 และไม่ผ่านเข้ารอบ", s["small"])],
    ]
    story += [
        table(test_rows, [20 * mm, 29 * mm, 127 * mm]),
        Spacer(1, 7 * mm),
        KeepTogether([
            p("ผล automated tests", s["section"]),
            table([
                [p("ชุดทดสอบ", s["table_head"]), p("ผล", s["table_head"]), p("รายละเอียด", s["table_head"])],
                [p("Node.js test runner", s["small"]), p("11/11 ผ่าน", s["small_center"]), p("ครอบคลุม HTTP, seed, T1-T6, การสรุปผล, ผลซ้ำ และ Golden Buzzer", s["small"])],
            ], [48 * mm, 32 * mm, 96 * mm])
        ]),
        PageBreak(),
    ]

    story += [
        p("4) ความแตกต่างระหว่างแบบที่ออกกับโปรแกรมจริง", s["section"]),
        p("1. ใช้ Map ใน Model สำหรับ Judge, Contestant และ Decision เพื่อค้นหาด้วยรหัสและป้องกันผลซ้ำได้โดยตรง", s["body"]),
        p("2. รวม action ที่จำเป็นไว้บนการ์ด Dashboard แต่ยังแยกหน้ารายละเอียดผล เพื่อใช้งาน T1-T6 ได้ต่อเนื่องโดยเปลี่ยนหน้าน้อยลง", s["body"]),
        p("3. เพิ่ม GET /api/state และระบบเลือกพอร์ตว่างอัตโนมัติ เพื่อช่วยตรวจสอบและเปิดโปรแกรมใน VS Code ได้สะดวก", s["body"]),
        Spacer(1, 4 * mm),
        p("5) บันทึกการใช้ Generative AI", s["section"]),
    ]
    ai_rows = [
        [p("เวลาโดยประมาณ", s["table_head"]), p("เครื่องมือ", s["table_head"]), p("ใช้เพื่ออะไร", s["table_head"]), p("นำคำแนะนำไปใช้อย่างไร", s["table_head"])],
        [p("45 นาที", s["small_center"]), p("Codex", s["small_center"]), p("วิเคราะห์ R1-R5 และสร้างโปรเจกต์ MVC ฉบับฝึกทำ", s["small"]), p("ตรวจ mapping ระหว่าง Model, Controller, View และปรับ business rules ให้ตรงโจทย์", s["small"])],
        [p("25 นาที", s["small_center"]), p("Codex", s["small_center"]), p("สร้างและรัน tests รวม T1-T6", s["small"]), p("ตรวจผลจริง 11 tests และแก้การแสดงลิงก์เมื่อพอร์ต 3000 ถูกใช้งาน", s["small"])],
        [p("15 นาที", s["small_center"]), p("Codex", s["small_center"]), p("จัดทำเอกสาร PDF", s["small"]), p("นำผลจาก source code, tests และ SUBMISSION.md มาสรุป แล้วตรวจภาพทุกหน้า", s["small"])],
    ]
    story += [
        table(ai_rows, [30 * mm, 31 * mm, 55 * mm, 60 * mm]),
        Spacer(1, 7 * mm),
        KeepTogether([
            p("หลักฐานประกอบใน Repository", s["section"]),
            p("- Source code: src/models, src/controllers, src/views และ src/server.js<br/>- Test: test/talent-show.test.js และ test/http.test.js<br/>- Design: design/class-diagram.png และ design/sequence-diagram.png<br/>- คำสั่งทดสอบ: npm test", s["body"]),
        ]),
        Spacer(1, 6 * mm),
        p("หมายเหตุ: เอกสารนี้จัดทำสำหรับโปรแกรมฝึกทำตามที่ผู้ใช้ระบุ ไม่ควรนำไปแสดงว่าเป็นผลงานที่ไม่ได้ใช้ Generative AI", s["note"]),
    ]

    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print(OUTPUT)


if __name__ == "__main__":
    build_pdf()
