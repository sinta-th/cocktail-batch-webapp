-- รันไฟล์นี้ไฟล์เดียวใน SQL Editor เพื่อ "ล้างของเก่าทิ้งแล้วสร้างใหม่ทั้งหมด"
-- ในโปรเจกต์ Supabase เดิม (URL/คีย์เดิม ไม่ต้องไปแก้อะไรที่ Vercel)
--
-- ⚠️ คำเตือน: ลบข้อมูลเดิมทั้งหมดถาวร (สมาชิก, ประวัติเข้าใช้งาน, สูตร batching, สูตร Cocktail)
-- เหมาะกับตอนที่ยังเป็นข้อมูลทดสอบอยู่ ถ้ามีข้อมูลจริงที่สำคัญแล้ว อย่ารันไฟล์นี้

-- ===== 1) ลบตารางเก่าทั้งหมดทิ้ง =====
drop table if exists cocktail_recipes;
drop table if exists batches;
drop table if exists access_logs;
drop table if exists members;

-- ===== 2) สร้างทุกอย่างใหม่ (เหมือนเนื้อหาใน supabase-schema.sql) =====

create table members (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  role text not null check (role in ('headbar', 'sn_bartender')),
  created_at timestamptz not null default now()
);

create table access_logs (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  role text not null,
  accessed_at timestamptz not null default now()
);

create table batches (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  cocktail_name text not null,
  category text not null check (
    category in (
      'signature_cocktail',
      'signature_mocktail',
      'beach_vibe',
      'classic_cocktail'
    )
  ),
  component_type text not null check (
    component_type in ('liquor', 'cordial', 'syrup', 'pre_mixed')
  ),
  component_name text,
  bottle_size int not null,
  servings numeric not null,
  total_used int not null,
  ingredients jsonb not null,
  created_by text
);

create table cocktail_recipes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  category text not null check (
    category in (
      'signature_cocktail',
      'signature_mocktail',
      'beach_vibe',
      'classic_cocktail'
    )
  ),
  method text not null check (
    method in ('stir', 'shake', 'building', 'blending', 'throwing')
  ),
  ingredients jsonb not null,
  garnish text,
  photo_url text,
  created_by text
);

alter table members enable row level security;
alter table access_logs enable row level security;
alter table batches enable row level security;
alter table cocktail_recipes enable row level security;

create policy "Public read members" on members for select using (true);
create policy "Public insert members" on members for insert with check (true);
create policy "Public delete members" on members for delete using (true);

create policy "Public read logs" on access_logs for select using (true);
create policy "Public insert logs" on access_logs for insert with check (true);

create policy "Public read batches" on batches for select using (true);
create policy "Public insert batches" on batches for insert with check (true);
create policy "Public update batches" on batches for update using (true) with check (true);
create policy "Public delete batches" on batches for delete using (true);

create policy "Public read cocktail_recipes" on cocktail_recipes for select using (true);
create policy "Public insert cocktail_recipes" on cocktail_recipes for insert with check (true);
create policy "Public update cocktail_recipes" on cocktail_recipes for update using (true) with check (true);
create policy "Public delete cocktail_recipes" on cocktail_recipes for delete using (true);

-- ===== 3) storage bucket สำหรับรูปภาพสูตร Cocktail =====
insert into storage.buckets (id, name, public)
values ('cocktail-photos', 'cocktail-photos', true)
on conflict (id) do nothing;

drop policy if exists "Public upload cocktail photos" on storage.objects;
drop policy if exists "Public read cocktail photos" on storage.objects;
drop policy if exists "Public delete cocktail photos" on storage.objects;

create policy "Public upload cocktail photos" on storage.objects for insert
  with check (bucket_id = 'cocktail-photos');
create policy "Public read cocktail photos" on storage.objects for select
  using (bucket_id = 'cocktail-photos');
create policy "Public delete cocktail photos" on storage.objects for delete
  using (bucket_id = 'cocktail-photos');
