# แบทช์ค็อกเทล — เครื่องคำนวณ Batching (มีรหัสผ่าน + สิทธิ์การใช้งาน + 3 ภาษา)

เว็บแอปคำนวณสัดส่วนของเหลวสำหรับ batching cocktail มีระบบล็อกอินด้วยรหัส แบ่งสิทธิ์ตามตำแหน่ง
คลังสูตรจัดหมวดหมู่ และสลับภาษาได้ 3 ภาษา (ไทย / English / မြန်မာ) ข้อมูลเก็บบน cloud (Supabase)

## สิทธิ์การใช้งานแต่ละตำแหน่ง

| ตำแหน่ง | รหัส | เมนูที่เห็น |
|---|---|---|
| **Host** | `mm001` (ค่าคงที่ ฝังไว้ในแอป) | ดูสูตร batching / สมาชิก / Calculator batching |
| **HeadBar** | ตั้งโดย host ตอนเพิ่มสมาชิก | ดูสูตร batching / Calculator batching |
| **Senior Bartender** | ตั้งโดย host ตอนเพิ่มสมาชิก | ดูสูตร batching เท่านั้น |

## หมวดหมู่สูตร (4 หมวด)

Signature Cocktail / Signature Mocktail / Beach Vibe / Classic Cocktail

## ภาษา

มีปุ่มสลับภาษา ไทย/English/မြန်မာ ที่มุมขวาบน (และหน้าล็อกอิน) ระบบจะจำภาษาที่เลือกไว้ในเครื่องนั้น
**หมายเหตุ:** ปุ่มนี้แปลเฉพาะข้อความของระบบ (ปุ่ม/หัวข้อ/คำอธิบาย) — ชื่อสูตร ชื่อส่วนผสม
ที่พนักงานพิมพ์เองจะเป็นภาษาที่พิมพ์ไว้ ไม่ได้แปลอัตโนมัติ

---

## ⚠️ อัปเดตล่าสุด: สูตรตอนนี้แบ่งเป็น "ค็อกเทล/ม็อกเทล" + "สูตรย่อย"

แต่ละสูตรที่บันทึกตอนนี้ต้องระบุ 2 อย่าง:
1. **ชื่อค็อกเทล/ม็อกเทล** (เช่น "Beach Bear") + หมวดหมู่ของมัน — พิมพ์ชื่อเดิมซ้ำได้ ระบบจะจำหมวดหมู่ให้อัตโนมัติ
2. **ประเภท batch ย่อย** ของสูตรนั้น: Liquor Batch / Cordial Batch / Syrup Batch / Pre-mixed

หน้า "ดูสูตร batching" เลยกลายเป็น 3 ชั้น: เลือกหมวดหมู่ → เลือกชื่อค็อกเทล → เลือกสูตรย่อย (Liquor/Cordial/...) → เห็นขวดแบบ animation + บันทึกรูปได้

**ถ้าคุณรันสคีมาเวอร์ชันก่อนหน้าไปแล้ว (มีแค่ name + category ไม่มี component_type)**
ไปที่ Supabase → SQL Editor → รันไฟล์ `supabase-migration-batch-types.sql` แทนการรัน schema ใหม่ทั้งหมด
(ไฟล์นี้จะเปลี่ยนคอลัมน์ name เป็น cocktail_name และเพิ่มคอลัมน์ component_type ให้)
จากนั้นเข้า Table Editor เติมค่า component_type ให้สูตรเก่าที่เคยบันทึกไว้ (เช่น "BEACH BEAR") ด้วย
ไม่งั้นสูตรนั้นจะไม่โผล่ในหน้าคลังสูตรของแอปเวอร์ชันใหม่



ไม่ต้องเริ่มใหม่ทั้งหมด แค่ **อัปเดตไฟล์ในที่เดิม** พอครับ ทำตามนี้:

### ถ้ายังไม่เคยบันทึกสูตรจริงจัง (แนะนำ — ง่ายสุด)

1. เข้า Supabase ที่โปรเจกต์เดิม (Batching) → **SQL Editor**
2. เปิดไฟล์ `supabase-schema.sql` ใหม่ในนี้ คัดลอกทั้งหมด วางแทนของเดิม แล้วกด **Run** อีกรอบ
   (คำสั่ง `create table if not exists` จะไม่ลบข้อมูลเดิม แต่ตาราง `batches` เดิมยังใช้ constraint หมวดหมู่แบบเก่าอยู่
   ถ้าเจอ error ตอนบันทึกสูตรว่า category ไม่ผ่าน ให้รันไฟล์ `supabase-migration-categories.sql` ต่อ — ดูขั้นตอนด้านล่าง)

### ถ้าเคยบันทึกสูตรไว้แล้ว และมีสูตรอยู่ในหมวด Syrup / Cordial / Color

1. เข้า Supabase → **Table Editor** → ตาราง `batches` → เช็คว่ามีแถวไหนอยู่ในหมวดที่จะตัดออกไหม
   ถ้ามี ให้ลบทิ้งหรือแก้ค่าช่อง `category` เป็นหนึ่งใน 4 หมวดใหม่ก่อน
2. ไปที่ **SQL Editor** → วางเนื้อหาจากไฟล์ `supabase-migration-categories.sql` → กด **Run**
   (ไฟล์นี้แค่เปลี่ยนกฎเช็คหมวดหมู่ ไม่ลบข้อมูล)

### อัปเดตโค้ดที่ GitHub (repo เดิมที่เคยสร้างไว้)

1. เข้า github.com → เข้า repo เดิมชื่อ `cocktail-batch-webapp`
2. ลบไฟล์/โฟลเดอร์เก่าทั้งหมดใน repo ก่อน (เลือกทุกไฟล์ → Delete files → Commit)
   — หรือถ้าไม่อยากลบ ให้ลากไฟล์ใหม่ทับ (GitHub จะถามว่าจะแทนที่ไฟล์ซ้ำไหม กด Yes)
3. กดลิงก์ **"Add file" → "Upload files"** (แทนที่ "uploading an existing file" ที่ใช้ตอนตั้ง repo ใหม่)
4. เปิดโฟลเดอร์โปรเจกต์ใหม่ที่แตกจาก zip นี้ใน Windows Explorer เลือกไฟล์/โฟลเดอร์ข้างในทั้งหมด
   ลากวางลงหน้าเว็บ GitHub เหมือนเดิม
5. เลื่อนลงล่างสุด กด **Commit changes**

### Vercel จะอัปเดตเว็บให้อัตโนมัติ

Vercel ที่เชื่อมกับ repo นี้ไว้แล้วจะ **เดพลอยใหม่ให้เองทันที** ทุกครั้งที่มีการ commit ขึ้น GitHub
ไม่ต้องกดอะไรเพิ่ม รอสัก 1-2 นาที แล้วเข้าลิงก์เว็บเดิม (เช่น `your-app.vercel.app`) รีเฟรชหน้าดูได้เลย
(ถ้าอยากเช็คสถานะ เข้า vercel.com → โปรเจกต์นี้ → แท็บ **Deployments** จะเห็นรายการล่าสุดกำลังรันอยู่)

---

## ถ้าอยากเริ่มใหม่ทั้งหมดตั้งแต่ต้น (Supabase ใหม่)

### 1. ตั้งค่า Supabase

1. ไปที่ https://supabase.com สร้างองค์กร + โปรเจกต์ใหม่ (ดูรายละเอียดวิธีสร้างองค์กร/โปรเจกต์ที่คุยกันไว้ก่อนหน้า)
2. ไปที่ **SQL Editor** → วางเนื้อหาทั้งหมดจากไฟล์ `supabase-schema.sql` → กด **Run**
3. ไปที่ **Project Settings → API Keys**
   - คัดลอก **Project URL** → ใช้เป็น `VITE_SUPABASE_URL`
   - คัดลอก **Publishable key** (ขึ้นต้นด้วย `sb_publishable_...` — ถ้าเป็น UI เก่าจะเรียกว่า `anon public key`)
     → ใช้เป็น `VITE_SUPABASE_ANON_KEY`

### 2. รันบนเครื่องตัวเอง (ถ้าต้องการทดสอบก่อน)

ต้องมี [Node.js](https://nodejs.org) เวอร์ชัน 18 ขึ้นไป

```bash
cd cocktail-batch-webapp
npm install
cp .env.example .env
# เปิดไฟล์ .env แล้วใส่ค่า VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY
npm run dev
```

### 3. เดพลอยขึ้นเว็บจริงด้วย Vercel

1. เอาโค้ดขึ้น GitHub repo ใหม่ (สมัคร github.com → New repository → uploading an existing file → ลากไฟล์ทั้งโฟลเดอร์วาง → Commit)
2. ไปที่ vercel.com → Sign up ด้วย GitHub → Add New → Project → Import repo นี้
3. ก่อนกด Deploy เปิด **Environment Variables** ใส่ `VITE_SUPABASE_URL` และ `VITE_SUPABASE_ANON_KEY`
4. กด **Deploy**

---

## วิธีใช้งานฝั่ง Host

1. ล็อกอินด้วย `mm001`
2. เข้าเมนู **สมาชิก** → กรอกรหัสที่ต้องการตั้งให้พนักงาน + เลือกตำแหน่ง → กด **เพิ่มสมาชิก**
3. ดูว่าใครเข้าระบบไปเมื่อไหร่ได้ในแท็บ **ประวัติการเข้าใช้งาน**

## วิธีทำ batching ใหม่

1. ใส่ส่วนผสม + ปริมาณต่อ 1 เสิร์ฟ → ยืนยันส่วนผสม
2. ตรวจสอบรายการ → ยืนยัน เตรียม Batching
3. เลือกขนาดขวด (700/750/1000/1500 มล.) — คำนวณให้ลงตัวพอดี
4. ดูผลลัพธ์ — กด "ย้อนกลับ" ปรับขนาดขวดหรือแก้ส่วนผสมได้ทุกขั้น ยังไม่บันทึกอะไรจนกว่าจะถึงขั้นสุดท้าย
5. ตั้งชื่อสูตร + เลือกหมวดหมู่ (Signature Cocktail / Signature Mocktail / Beach Vibe / Classic Cocktail) → บันทึกสูตร

## หมายเหตุเรื่องความปลอดภัยของข้อมูล

แอปนี้ตรวจรหัสฝั่ง client เอง (ไม่ใช่ Supabase Auth เต็มรูปแบบ) และเปิดสิทธิ์อ่าน/เขียนแบบสาธารณะ
เหมาะกับใช้งานภายในทีม/ร้านเดียวที่ไว้ใจกัน

## โครงสร้างไฟล์

```
cocktail-batch-webapp/
├── index.html
├── package.json
├── vite.config.js
├── supabase-schema.sql               ← รันตอนตั้ง Supabase ใหม่
├── supabase-migration-categories.sql ← รันตอนอัปเดตหมวดหมู่ ถ้าเคยรัน schema เก่าไปแล้ว
├── .env.example
└── src/
    ├── main.jsx
    ├── App.jsx                  ← session / role-based routing / ปุ่มสลับภาษา
    ├── styles.css
    ├── supabaseClient.js
    ├── lib/
    │   ├── constants.js          ← host code, roles, 4 หมวดหมู่, เมนูตามสิทธิ์
    │   ├── i18n.js                ← ข้อความ 3 ภาษา (ไทย/English/မြန်မာ)
    │   ├── db.js
    │   ├── format.js
    │   └── image.js
    └── components/
        ├── Bottle.jsx
        ├── Login.jsx
        ├── Menu.jsx
        ├── Recipes.jsx
        ├── Members.jsx
        └── Calculator.jsx
```
