-- รันไฟล์นี้ใน SQL Editor เพื่อเพิ่มฟีเจอร์ "สูตร Cocktail" (สูตรเสิร์ฟจริง แยกจาก batching)

create table if not exists cocktail_recipes (
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

alter table cocktail_recipes enable row level security;

create policy "Public read cocktail_recipes" on cocktail_recipes for select using (true);
create policy "Public insert cocktail_recipes" on cocktail_recipes for insert with check (true);
create policy "Public update cocktail_recipes" on cocktail_recipes for update using (true) with check (true);
create policy "Public delete cocktail_recipes" on cocktail_recipes for delete using (true);

-- Storage bucket สำหรับรูปภาพสูตร Cocktail (จำเป็นสำหรับปุ่ม "อัปโหลดรูป" ในฟอร์ม)
insert into storage.buckets (id, name, public)
values ('cocktail-photos', 'cocktail-photos', true)
on conflict (id) do nothing;

create policy "Public upload cocktail photos" on storage.objects for insert
  with check (bucket_id = 'cocktail-photos');
create policy "Public read cocktail photos" on storage.objects for select
  using (bucket_id = 'cocktail-photos');
create policy "Public delete cocktail photos" on storage.objects for delete
  using (bucket_id = 'cocktail-photos');
