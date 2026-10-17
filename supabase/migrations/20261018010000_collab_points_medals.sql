-- ============================================================
-- Giai đoạn 2 — Điểm đóng góp, huy chương, xếp hạng
-- (additive, không phá dữ liệu cũ; điểm ghi tay, luật tự
-- động hoá sẵn sàng sau)
-- ============================================================

-- ------------------------------------------------------------
-- Bảng (tạo trước hàm SQL để tránh lỗi tham chiếu)
-- ------------------------------------------------------------

-- Sổ điểm: bất biến (append-only trên thực tế; admin mới được ghi).
create table if not exists public.contribution_ledger (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  points      int not null check (points <> 0),
  source      text not null default 'manual'
              check (source in ('task','manual','event','other')),
  task_id     uuid references public.tasks (id) on delete set null,
  note        text,
  awarded_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.medals (
  id              uuid primary key default gen_random_uuid(),
  key             text not null unique,
  name            text not null,
  description     text,
  tier            text not null default 'bronze'
                  check (tier in ('bronze','silver','gold','platinum')),
  threshold_points int not null default 0 check (threshold_points >= 0),
  sort_order      int not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create table if not exists public.profile_medals (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  medal_id    uuid not null references public.medals (id) on delete cascade,
  awarded_by  uuid references public.profiles (id) on delete set null,
  note        text,
  awarded_at  timestamptz not null default now(),
  unique (profile_id, medal_id)
);

-- ------------------------------------------------------------
-- Chỉ mục
-- ------------------------------------------------------------

create index if not exists contribution_ledger_profile_idx on public.contribution_ledger (profile_id, created_at desc);
create index if not exists contribution_ledger_task_idx    on public.contribution_ledger (task_id);
create index if not exists contribution_ledger_source_idx  on public.contribution_ledger (source);
create index if not exists profile_medals_profile_idx      on public.profile_medals (profile_id);
create index if not exists medals_active_idx               on public.medals (is_active, sort_order);

-- updated_at trigger cho medals (đồng bộ với set_updated_at)
drop trigger if exists set_updated_at_medals on public.medals;
create trigger set_updated_at_medals before update on public.medals
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Hàm xếp hạng (security definer; staff mới xem được).
-- profiles chỉ cho đọc "own or admin" nên không join trực tiếp
-- từ client — dùng hàm definer giống collab_members().
-- ------------------------------------------------------------

create or replace function public.collab_leaderboard()
returns table (
  id           uuid,
  full_name    text,
  avatar_url   text,
  role         text,
  total_points bigint,
  total_medals bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name, p.avatar_url, p.role,
         coalesce(lp.points, 0)::bigint as total_points,
         coalesce(pm.medals, 0)::bigint as total_medals
    from public.profiles p
    left join (
      select l.profile_id, sum(l.points) as points
        from public.contribution_ledger l
       group by l.profile_id
    ) lp on lp.profile_id = p.id
    left join (
      select m.profile_id, count(*) as medals
        from public.profile_medals m
       group by m.profile_id
    ) pm on pm.profile_id = p.id
   where public.is_staff() and p.is_active
   order by total_points desc, total_medals desc, p.full_name asc nulls last;
$$;

-- Tổng điểm / số huy chương của một người (staff).
create or replace function public.collab_totals(p_profile uuid)
returns table (total_points bigint, total_medals bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(l.points), 0)::bigint,
         (select count(*) from public.profile_medals m where m.profile_id = p_profile)::bigint
    from public.contribution_ledger l
   where l.profile_id = p_profile and public.is_staff();
$$;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------

alter table public.contribution_ledger enable row level security;
alter table public.medals              enable row level security;
alter table public.profile_medals      enable row level security;

-- Sổ điểm: staff đọc; người có quyền quản lý cộng tác ghi.
drop policy if exists "ledger read staff" on public.contribution_ledger;
create policy "ledger read staff" on public.contribution_ledger
  for select using (public.is_staff());

drop policy if exists "ledger write manager" on public.contribution_ledger;
create policy "ledger write manager" on public.contribution_ledger
  for all using (public.can_manage_collab()) with check (public.can_manage_collab());

-- Danh mục huy chương: staff đọc; admin ghi.
drop policy if exists "medals read staff" on public.medals;
create policy "medals read staff" on public.medals
  for select using (public.is_staff());

drop policy if exists "medals write admin" on public.medals;
create policy "medals write admin" on public.medals
  for all using (public.is_admin()) with check (public.is_admin());

-- Huy chương đã trao: staff đọc; admin trao/rút.
drop policy if exists "profile_medals read staff" on public.profile_medals;
create policy "profile_medals read staff" on public.profile_medals
  for select using (public.is_staff());

drop policy if exists "profile_medals write admin" on public.profile_medals;
create policy "profile_medals write admin" on public.profile_medals
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- Quyền gọi hàm
-- ------------------------------------------------------------

revoke all on function public.collab_leaderboard() from public, anon;
grant execute on function public.collab_leaderboard() to authenticated;

revoke all on function public.collab_totals(uuid) from public, anon;
grant execute on function public.collab_totals(uuid) to authenticated;

-- ------------------------------------------------------------
-- Huy chương mặc định (điểm ngưỡng để hệ thống chấm sau này)
-- ------------------------------------------------------------

insert into public.medals (key, name, description, tier, threshold_points, sort_order)
values
  ('khoi-dau',          'Khởi đầu',        'Đạt 10 điểm đóng góp',          'bronze',   10, 1),
  ('cong-tac-vien',     'Cộng tác viên',   'Đạt 50 điểm đóng góp',          'bronze',   50, 2),
  ('nguoi-ung-ho',      'Người ủng hộ',    'Đạt 100 điểm đóng góp',         'silver',  100, 3),
  ('nhan-vat-noi-bat',  'Nhân vật nổi bật','Đạt 250 điểm đóng góp',         'gold',    250, 4),
  ('tru-cot',           'Trụ cột',         'Đạt 500 điểm đóng góp',         'platinum',500, 5),
  ('cham-chi',          'Chăm chỉ',        'Hoàn thành nhiều nhiệm vụ',     'bronze',    0, 6),
  ('dau-lanh',          'Đầu nhóm',        'Dẫn dắt nhóm hoàn thành việc','silver',    0, 7)
on conflict (key) do nothing;
