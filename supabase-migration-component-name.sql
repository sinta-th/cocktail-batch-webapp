-- รันไฟล์นี้ใน SQL Editor ถ้าฐานข้อมูลของคุณมีตาราง batches อยู่แล้ว
-- (มี cocktail_name, category, component_type ครบแล้ว) แต่ยังไม่มีคอลัมน์ component_name
-- ใช้เก็บชื่อที่ตั้งเองให้สูตรย่อยแต่ละอัน เช่น "สูตรต้มชา" (เป็นคอลัมน์เสริม ไม่บังคับกรอก)

alter table batches add column if not exists component_name text;
