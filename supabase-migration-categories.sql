-- รันไฟล์นี้แทน supabase-schema.sql ถ้าคุณเคยรัน schema เวอร์ชันเก่า
-- (ที่มี 6 หมวด: signature_cocktail, signature_mocktail, beach_vibe, syrup, cordial, color)
-- ไปแล้ว และตอนนี้ต้องการเปลี่ยนเป็น 4 หมวดใหม่
-- (signature_cocktail, signature_mocktail, beach_vibe, classic_cocktail)
--
-- ⚠️ คำเตือน: ถ้ามีสูตรที่เคยบันทึกไว้ในหมวด syrup / cordial / color อยู่แล้ว
-- ต้องย้ายหรือลบสูตรเหล่านั้นก่อน ไม่งั้นขั้นตอนนี้จะรันไม่ผ่าน
-- (เช็คได้จาก Table Editor > batches > กรองคอลัมน์ category)

-- 1) หา constraint เดิมชื่ออะไร แล้วลบทิ้ง
alter table batches drop constraint if exists batches_category_check;

-- 2) ใส่ constraint ใหม่ที่มีแค่ 4 หมวด
alter table batches add constraint batches_category_check
  check (
    category in (
      'signature_cocktail',
      'signature_mocktail',
      'beach_vibe',
      'classic_cocktail'
    )
  );
