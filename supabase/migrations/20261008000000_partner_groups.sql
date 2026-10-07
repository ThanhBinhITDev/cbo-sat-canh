-- ------------------------------------------------------------
-- Nhóm đối tác: admin thêm/sửa/xoá được nhóm (trước đây hardcode
-- 3 nhóm strategic/clinic/network trong code + CHECK cố định).
-- ------------------------------------------------------------

create table if not exists public.partner_groups (
  key        text primary key,
  label      text not null,
  title      text not null,
  subtitle   text,
  sort_order int not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- Gỡ CHECK cố định trên partners.group (giữ DEFAULT 'strategic')
alter table public.partners drop constraint if exists partners_group_check;

-- RLS: đọc nhóm đang hiển thị (hoặc admin), ghi chỉ admin
alter table public.partner_groups enable row level security;

drop policy if exists "partner_groups read active or admin" on public.partner_groups;
create policy "partner_groups read active or admin" on public.partner_groups
  for select using (is_active or public.is_admin());

drop policy if exists "partner_groups write admin" on public.partner_groups;
create policy "partner_groups write admin" on public.partner_groups
  for all using (public.is_admin()) with check (public.is_admin());

-- Seed 3 nhóm mặc định (giữ nguyên nhãn cũ trong code)
insert into public.partner_groups (key, label, title, subtitle, sort_order) values
  ('strategic', 'Đối tác chiến lược', 'Đối tác chiến lược chính',
   'Nền tảng thành công của CBO SÁT CÁNH', 1),
  ('clinic', 'Phòng khám', 'Phòng khám Nhà Mình', null, 2),
  ('network', 'Mạng lưới CBO', 'Mạng lưới CBO Đồng bằng Sông Cửu Long', null, 3)
on conflict (key) do nothing;
