-- รันไฟล์นี้แทน supabase-schema.sql ถ้าคุณเคยรัน schema เวอร์ชันก่อนหน้าไปแล้ว
-- ที่มีคอลัมน์ "name" (ชื่อสูตรเดี่ยวๆ) และ "category" (4 หมวด) แต่ยังไม่มี cocktail_name / component_type
--
-- ⚠️ ถ้ามีสูตรที่บันทึกไว้แล้ว (เช่น "BEACH BEAR") จะถูกเปลี่ยนคอลัมน์ name ให้กลายเป็น cocktail_name
-- อัตโนมัติ แต่จะยังไม่มีค่า component_type (ต้องแก้เพิ่มเองใน Table Editor เลือกว่าเป็น
-- liquor / cordial / syrup / pre_mixed ให้แถวเก่าเหล่านั้น ไม่งั้นจะไม่โผล่ในหน้าคลังสูตรของแอปเวอร์ชันใหม่)

-- 1) เปลี่ยนชื่อคอลัมน์ name -> cocktail_name (ถ้ายังไม่เคยเปลี่ยน)
alter table batches rename column name to cocktail_name;

-- 2) เพิ่มคอลัมน์ component_type
alter table batches add column if not exists component_type text;

-- 3) ใส่กฎเช็คค่า component_type ให้ถูกต้อง
alter table batches drop constraint if exists batches_component_type_check;
alter table batches add constraint batches_component_type_check
  check (component_type in ('liquor', 'cordial', 'syrup', 'pre_mixed'));

-- 4) (แนะนำ) หลังจากไปเติมค่า component_type ให้ครบทุกแถวใน Table Editor แล้ว
--    ค่อยรันบรรทัดนี้เพื่อบังคับว่าแถวใหม่ต้องมีค่าเสมอ (ข้ามได้ถ้ายังไม่พร้อม)
-- alter table batches alter column component_type set not null;
