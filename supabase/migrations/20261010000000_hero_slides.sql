-- Slider banner trang chủ: bảng quản lý ảnh slide (admin CRUD).
create table if not exists public.hero_slides (
  id         uuid primary key default gen_random_uuid(),
  image_url  text not null,
  alt        text,
  sort_order int not null default 0,
  is_active  boolean not null default true
);

alter table public.hero_slides enable row level security;

-- Mirror partners/services: khách thấy slide đang hiển thị, admin thấy tất cả.
drop policy if exists "hero_slides read active or admin" on public.hero_slides;
create policy "hero_slides read active or admin" on public.hero_slides
  for select using (is_active or public.is_admin());

drop policy if exists "hero_slides write admin" on public.hero_slides;
create policy "hero_slides write admin" on public.hero_slides
  for all using (public.is_admin()) with check (public.is_admin());
