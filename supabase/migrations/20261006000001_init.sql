-- ============================================================
-- CBO Sát Cánh — khởi tạo schema, phân quyền (RLS), storage
-- Chạy một lần trong Supabase SQL Editor (hoặc MCP/Migration).
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. Bảng profiles (1:1 với auth.users)
-- ------------------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  email       text not null unique,
  -- mặc định quyền thấp nhất; vai trò thật do admin gán qua
  -- auth.admin.createUser + upsert (service role), KHÔNG đọc từ client
  role        text not null default 'collaborator'
              check (role in ('admin', 'editor', 'collaborator')),
  avatar_url  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 0. Hàm kiểm tra vai trò (security definer để tránh đệ quy RLS)
--    KHÔNG di chuyển lên trước bảng profiles: SQL function được
--    kiểm tra tham chiếu khi tạo → sẽ lỗi nếu bảng chưa tồn tại.
-- ------------------------------------------------------------

create or replace function public.app_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.role = 'admin' and p.is_active
       from public.profiles p
      where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.role in ('admin', 'editor', 'collaborator') and p.is_active
       from public.profiles p
      where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.role in ('admin', 'editor') and p.is_active
       from public.profiles p
      where p.id = auth.uid()),
    false
  );
$$;

-- Tự tạo hồ sơ khi có user mới (Supabase Auth).
-- ⚠ KHÔNG đọc role từ raw_user_meta_data: client tự đặt được metadata khi
--   gọi /auth/v1/signup → nếu tin thì ai cũng thành admin.
--   Vai trò thật do admin gán qua auth.admin.createUser + upsert (service role).
--   is_active=false (fail-closed): tài khoản tự đăng ký không vào được /admin
--   cho tới khi admin bật trong trang Tài khoản.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''),
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 2. Bài viết
-- ------------------------------------------------------------

create table if not exists public.posts (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  excerpt          text,
  content_md       text,
  cover_url        text,
  category         text not null default 'tin-tuc'
                   check (category in ('tin-tuc', 'hoat-dong')),
  status           text not null default 'draft'
                   check (status in ('draft', 'published')),
  author_id        uuid references public.profiles (id) on delete set null,
  is_featured      boolean not null default false,
  meta_title       text,
  meta_description text,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists posts_status_published_idx
  on public.posts (status, published_at desc);
create index if not exists posts_category_idx on public.posts (category);
create index if not exists posts_author_idx on public.posts (author_id);
create index if not exists posts_title_trgm_idx
  on public.posts using gin (to_tsvector('simple', coalesce(title, '')));

-- ------------------------------------------------------------
-- 3. Dịch vụ / Đối tác / Đội ngũ
-- ------------------------------------------------------------

create table if not exists public.services (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text unique,
  description text,
  icon        text,
  color       text,
  sort_order  int not null default 0,
  is_active   boolean not null default true
);

create table if not exists public.partners (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  "group"      text not null default 'strategic'
               check ("group" in ('strategic', 'clinic', 'network')),
  logo_url     text,
  website_url  text,
  sort_order   int not null default 0,
  is_active    boolean not null default true
);

create table if not exists public.team_members (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  position    text,
  avatar_url  text,
  bio         text,
  sort_order  int not null default 0,
  is_active   boolean not null default true
);

-- ------------------------------------------------------------
-- 4. site_settings (key / jsonb)
-- ------------------------------------------------------------

create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

-- ------------------------------------------------------------
-- 5. media (thư viện ảnh)
-- ------------------------------------------------------------

create table if not exists public.media (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null default 'other'
               check (kind in ('hero', 'banner', 'decoration', 'logo', 'avatar', 'other')),
  storage_path text,
  public_url   text not null,
  alt          text,
  uploaded_by  uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists media_kind_idx on public.media (kind);

-- ------------------------------------------------------------
-- 6. contact_messages / newsletters
-- ------------------------------------------------------------

create table if not exists public.contact_messages (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  phone            text not null,
  email            text,
  service_interest text,
  message          text not null,
  status           text not null default 'new'
                   check (status in ('new', 'replied', 'archived')),
  source           text not null default 'website',
  handled_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists contact_status_idx
  on public.contact_messages (status, created_at desc);

create table if not exists public.newsletters (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  name       text,
  source     text not null default 'footer',
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 7. audit_log (giai đoạn 2)
-- ------------------------------------------------------------

create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null,
  table_name  text,
  record_id   uuid,
  payload     jsonb,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 8. updated_at trigger
-- ------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'posts', 'site_settings', 'contact_messages', 'newsletters'
  ]
  loop
    execute format(
      'drop trigger if exists set_updated_at_%I on public.%I', t, t);
    execute format(
      'create trigger set_updated_at_%I before update on public.%I
         for each row execute function public.set_updated_at()',
      t, t);
  end loop;
end;
$$;

-- ------------------------------------------------------------
-- 9. View: câu hỏi chưa trả lời
-- ------------------------------------------------------------

create or replace view public.v_unread_messages
with (security_invoker = on) as
  select count(*)::int as unread_count
  from public.contact_messages
  where status = 'new';

-- ------------------------------------------------------------
-- 10. Bật RLS
-- ------------------------------------------------------------

alter table public.profiles        enable row level security;
alter table public.posts           enable row level security;
alter table public.services        enable row level security;
alter table public.partners        enable row level security;
alter table public.team_members    enable row level security;
alter table public.site_settings   enable row level security;
alter table public.media           enable row level security;
alter table public.contact_messages enable row level security;
alter table public.newsletters     enable row level security;
alter table public.audit_log       enable row level security;

-- ------------------------------------------------------------
-- 11. Chính sách RLS
-- ------------------------------------------------------------

-- profiles ---------------------------------------------------
drop policy if exists "profiles select own or admin" on public.profiles;
create policy "profiles select own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles insert admin" on public.profiles;
create policy "profiles insert admin" on public.profiles
  for insert with check (public.is_admin());

drop policy if exists "profiles update own or admin" on public.profiles;
create policy "profiles update own or admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists "profiles delete admin" on public.profiles;
create policy "profiles delete admin" on public.profiles
  for delete using (public.is_admin());

-- posts ------------------------------------------------------
drop policy if exists "posts read published or staff" on public.posts;
create policy "posts read published or staff" on public.posts
  for select using (status = 'published' or public.is_staff());

drop policy if exists "posts insert staff" on public.posts;
create policy "posts insert staff" on public.posts
  for insert with check (public.is_editor() and author_id = auth.uid());

drop policy if exists "posts update staff" on public.posts;
create policy "posts update staff" on public.posts
  for update using (public.is_editor());

drop policy if exists "posts delete admin" on public.posts;
create policy "posts delete admin" on public.posts
  for delete using (public.is_admin());

-- services / partners / team_members -------------------------
drop policy if exists "services read active or admin" on public.services;
create policy "services read active or admin" on public.services
  for select using (is_active or public.is_admin());

drop policy if exists "services write admin" on public.services;
create policy "services write admin" on public.services
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "partners read active or admin" on public.partners;
create policy "partners read active or admin" on public.partners
  for select using (is_active or public.is_admin());

drop policy if exists "partners write admin" on public.partners;
create policy "partners write admin" on public.partners
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "team read active or admin" on public.team_members;
create policy "team read active or admin" on public.team_members
  for select using (is_active or public.is_admin());

drop policy if exists "team write admin" on public.team_members;
create policy "team write admin" on public.team_members
  for all using (public.is_admin()) with check (public.is_admin());

-- site_settings ----------------------------------------------
drop policy if exists "settings read all" on public.site_settings;
create policy "settings read all" on public.site_settings
  for select using (true);

drop policy if exists "settings write admin" on public.site_settings;
create policy "settings write admin" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- media ------------------------------------------------------
drop policy if exists "media read all" on public.media;
create policy "media read all" on public.media
  for select using (true);

-- admin: toàn quyền. editor: chỉ thêm/sửa ảnh thường ('other') do chính mình tải lên
drop policy if exists "media insert staff" on public.media;
create policy "media insert staff" on public.media
  for insert with check (
    public.is_admin()
    or (public.is_editor()
        and uploaded_by = auth.uid()
        and kind = 'other')
  );

drop policy if exists "media update staff" on public.media;
create policy "media update staff" on public.media
  for update using (
    public.is_admin()
    or (public.is_editor()
        and uploaded_by = auth.uid()
        and kind = 'other')
  );

drop policy if exists "media delete admin" on public.media;
create policy "media delete admin" on public.media
  for delete using (public.is_admin());

-- contact_messages -------------------------------------------
-- Ghi chỉ thực hiện qua API route bằng service_role (bỏ qua RLS).
drop policy if exists "contact read staff" on public.contact_messages;
create policy "contact read staff" on public.contact_messages
  for select using (public.is_staff());

drop policy if exists "contact update staff" on public.contact_messages;
create policy "contact update staff" on public.contact_messages
  for update using (public.is_editor());

drop policy if exists "contact delete admin" on public.contact_messages;
create policy "contact delete admin" on public.contact_messages
  for delete using (public.is_admin());

-- newsletters -------------------------------------------------
drop policy if exists "newsletter read staff" on public.newsletters;
create policy "newsletter read staff" on public.newsletters
  for select using (public.is_staff());

drop policy if exists "newsletter update admin" on public.newsletters;
create policy "newsletter update admin" on public.newsletters
  for update using (public.is_admin());

drop policy if exists "newsletter delete admin" on public.newsletters;
create policy "newsletter delete admin" on public.newsletters
  for delete using (public.is_admin());

-- audit_log ---------------------------------------------------
drop policy if exists "audit read admin" on public.audit_log;
create policy "audit read admin" on public.audit_log
  for select using (public.is_admin());

drop policy if exists "audit insert staff" on public.audit_log;
create policy "audit insert staff" on public.audit_log
  for insert with check (auth.uid() is not null);

-- ------------------------------------------------------------
-- 12. Storage: bucket site-assets
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-assets',
  'site-assets',
  true,
  5242880, -- 5MB
  array['image/png','image/jpeg','image/webp','image/gif','image/avif','image/svg+xml']
)
on conflict (id) do nothing;

drop policy if exists "site-assets public read" on storage.objects;
create policy "site-assets public read" on storage.objects
  for select using (bucket_id = 'site-assets');

drop policy if exists "site-assets staff upload" on storage.objects;
create policy "site-assets staff upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'site-assets'
    and public.is_editor()
    and (storage.foldername(name))[1] = 'uploads'
  );

drop policy if exists "site-assets staff update" on storage.objects;
create policy "site-assets staff update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'site-assets'
    and public.is_admin()
  );

drop policy if exists "site-assets delete own or admin" on storage.objects;
create policy "site-assets delete own or admin" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'site-assets'
    and (
      public.is_admin()
      or (public.is_editor()
          and (storage.foldername(name))[1] = 'uploads'
          and (storage.foldername(name))[2] = auth.uid()::text)
    )
  );
