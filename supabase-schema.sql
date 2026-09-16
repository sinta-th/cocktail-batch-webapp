-- รันไฟล์นี้ทั้งหมดใน Supabase Dashboard > SQL Editor
-- (สำหรับโปรเจกต์ Supabase ใหม่ที่ยังไม่เคยรัน schema อะไรมาก่อน)

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  role text not null check (role in ('headbar', 'sn_bartender')),
  created_at timestamptz not null default now()
);

create table if not exists access_logs (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  role text not null,
  accessed_at timestamptz not null default now()
);

-- แต่ละแถว = 1 "สูตรย่อย" (component batch) ที่ผูกกับค็อกเทล/ม็อกเทลตัวหนึ่ง
-- ผ่านคอลัมน์ cocktail_name (หลายแถวมี cocktail_name เดียวกันได้ ถ้าเป็นสูตรย่อยคนละประเภทของค็อกเทลตัวเดียวกัน)
create table if not exists batches (
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
  servings int not null,
  total_used int not null,
  ingredients jsonb not null,
  created_by text
);

alter table members enable row level security;
alter table access_logs enable row level security;
alter table batches enable row level security;

create policy "Public read members" on members for select using (true);
create policy "Public insert members" on members for insert with check (true);
create policy "Public delete members" on members for delete using (true);

create policy "Public read logs" on access_logs for select using (true);
create policy "Public insert logs" on access_logs for insert with check (true);

create policy "Public read batches" on batches for select using (true);
create policy "Public insert batches" on batches for insert with check (true);
create policy "Public delete batches" on batches for delete using (true);
