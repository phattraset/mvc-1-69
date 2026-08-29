# Ladkrabang's Got Talent — MVC Practice

เว็บแอป Node.js ที่แยก Model, View และ Controller ชัดเจน และไม่ต้องติดตั้ง dependency ภายนอก

## วิธีเปิดโปรแกรม

ต้องมี Node.js 20 ขึ้นไป จากโฟลเดอร์โปรเจกต์ให้รัน:

```powershell
npm start
```

Terminal จะแสดงลิงก์ของพอร์ตที่เปิดได้จริง เช่น `http://localhost:3000`
หากพอร์ต 3000 ถูกใช้งานอยู่ โปรแกรมจะลองพอร์ตถัดไปและแสดงลิงก์ใหม่ให้อัตโนมัติ

## การทดสอบ

```powershell
npm test
```

ชุดทดสอบเริ่มจาก `data/seed_data.json` ใหม่ทุกครั้ง และตรวจ T1-T6 ต่อเนื่องในสถานะการทำงานเดียวกัน

## โครงสร้าง MVC

- Model/Domain: `src/models/talent-show.js` เก็บสถานะและบังคับ business rules ทั้งหมด
- Controller: `src/controllers/talent-controller.js` รับ HTTP request เรียก Model และเลือก View
- View: `src/views/dashboard.js` สร้างหน้ารายการ หน้ารายละเอียด ฟอร์ม และข้อความตอบกลับ
- Entry point: `src/server.js`

ข้อมูลอยู่ในหน่วยความจำเท่านั้น เมื่อปิดและเปิดโปรแกรมใหม่จะโหลด seed ใหม่ตาม R1

## API สำหรับตรวจสถานะ

`GET /api/state` คืนสถานะปัจจุบันแบบ JSON เพื่อช่วยตรวจสอบและดีบัก
