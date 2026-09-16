-- แก้บั๊ก: ตาราง batches ไม่เคยมีสิทธิ์ "update" มาก่อน
-- ทำให้ปุ่ม "แก้ไข" ที่ host ใช้แก้สูตร batching กดบันทึกแล้วจะไม่ผ่าน (ถูก Supabase บล็อกเงียบๆ)
-- รันไฟล์นี้ใน SQL Editor เพื่อแก้ (รันครั้งเดียว ไม่กระทบข้อมูลเดิม)

drop policy if exists "Public update batches" on batches;
create policy "Public update batches" on batches for update using (true) with check (true);
