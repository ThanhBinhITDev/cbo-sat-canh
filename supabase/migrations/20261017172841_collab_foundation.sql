-- ============================================================
-- Giai đoạn 1 — Nền tảng nhiệm vụ (additive, không phá dữ liệu cũ)
-- ============================================================

-- Quyền quản lý cộng tác cấp riêng cho từng tài khoản.
alter table public.profiles
  add column if not exists can_manage_tasks boolean not null default false;

-- ------------------------------------------------------------
-- Bảng (tạo trước hàm SQL để tránh lỗi kiểm tra tham chiếu khi tạo hàm)
-- ------------------------------------------------------------

create table if not exists public.task_categories (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  label       text not null,
  description text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.tasks (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  description         text,
  category_id         uuid references public.task_categories (id) on delete set null,
  -- project_id: khoá ngoại tới public.projects sẽ thêm ở Giai đoạn 3
  project_id          uuid,
  created_by          uuid references public.profiles (id) on delete set null,
  priority            text not null default 'normal'
                      check (priority in ('low', 'normal', 'high', 'urgent')),
  status              text not null default 'assigned'
                      check (status in ('assigned','accepted','in_progress','submitted','needs_revision','completed','cancelled')),
  start_date          date,
  due_date            date,
  acceptance_criteria text,
  points_estimated    int not null default 0 check (points_estimated >= 0),
  internal_note       text,
  completed_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.task_assignees (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid not null references public.tasks (id) on delete cascade,
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  role_in_task  text not null default 'member'
                check (role_in_task in ('lead','member','support')),
  status        text not null default 'assigned'
                check (status in ('assigned','accepted','in_progress','submitted','needs_revision','completed','cancelled')),
  accepted_at   timestamptz,
  completed_at  timestamptz,
  points_awarded int not null default 0 check (points_awarded >= 0),
  created_at    timestamptz not null default now(),
  unique (task_id, profile_id)
);

create table if not exists public.task_updates (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks (id) on delete cascade,
  author_id   uuid references public.profiles (id) on delete set null,
  kind        text not null
              check (kind in ('comment','progress','result','revision_request','approval','accept','cancel','status_change')),
  body        text,
  status_from text,
  status_to   text,
  created_at  timestamptz not null default now()
);

create table if not exists public.task_attachments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks (id) on delete cascade,
  name        text,
  url         text not null,
  kind        text not null default 'reference'
              check (kind in ('reference','result')),
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Chỉ mục
-- ------------------------------------------------------------

create index if not exists tasks_status_idx       on public.tasks (status);
create index if not exists tasks_due_idx          on public.tasks (due_date);
create index if not exists tasks_category_idx     on public.tasks (category_id);
create index if not exists tasks_created_by_idx   on public.tasks (created_by);
create index if not exists tasks_project_idx      on public.tasks (project_id);
create index if not exists task_assignees_task_idx    on public.task_assignees (task_id);
create index if not exists task_assignees_profile_idx on public.task_assignees (profile_id);
create index if not exists task_updates_task_idx  on public.task_updates (task_id, created_at desc);
create index if not exists task_attachments_task_idx on public.task_attachments (task_id);

-- updated_at trigger cho tasks
drop trigger if exists set_updated_at_tasks on public.tasks;
create trigger set_updated_at_tasks before update on public.tasks
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Hàm trợ giúp (security definer, KHÔNG đệ quy RLS)
-- ------------------------------------------------------------

create or replace function public.can_manage_collab()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select (p.role = 'admin' or p.can_manage_tasks) and p.is_active
       from public.profiles p
      where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.is_task_assignee(p_task uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1 from public.task_assignees a
    where a.task_id = p_task and a.profile_id = auth.uid()
  );
$$;

-- Danh sách thành viên nội bộ (chỉ staff). Tránh mở rộng RLS bảng profiles.
create or replace function public.collab_members()
returns table (
  id uuid,
  full_name text,
  email text,
  role text,
  avatar_url text,
  can_manage_tasks boolean,
  is_active boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name, p.email, p.role, p.avatar_url, p.can_manage_tasks, p.is_active
    from public.profiles p
   where public.is_staff()
   order by p.full_name;
$$;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------

alter table public.task_categories  enable row level security;
alter table public.tasks            enable row level security;
alter table public.task_assignees   enable row level security;
alter table public.task_updates     enable row level security;
alter table public.task_attachments enable row level security;

-- task_categories: staff đọc; quản lý cộng tác ghi.
drop policy if exists "task_categories read staff" on public.task_categories;
create policy "task_categories read staff" on public.task_categories
  for select using (public.is_staff());

drop policy if exists "task_categories write manager" on public.task_categories;
create policy "task_categories write manager" on public.task_categories
  for all using (public.can_manage_collab()) with check (public.can_manage_collab());

-- tasks: quản lý hoặc người được giao (hoặc người tạo) đọc.
drop policy if exists "tasks select" on public.tasks;
create policy "tasks select" on public.tasks
  for select using (
    public.can_manage_collab()
    or created_by = auth.uid()
    or public.is_task_assignee(id)
  );

drop policy if exists "tasks insert manager" on public.tasks;
create policy "tasks insert manager" on public.tasks
  for insert with check (public.can_manage_collab() and created_by = auth.uid());

drop policy if exists "tasks update manager" on public.tasks;
create policy "tasks update manager" on public.tasks
  for update using (public.can_manage_collab()) with check (public.can_manage_collab());

drop policy if exists "tasks delete admin" on public.tasks;
create policy "tasks delete admin" on public.tasks
  for delete using (public.is_admin());

-- task_assignees: quản lý toàn quyền; người liên quan đọc.
drop policy if exists "task_assignees select" on public.task_assignees;
create policy "task_assignees select" on public.task_assignees
  for select using (
    public.can_manage_collab()
    or profile_id = auth.uid()
    or public.is_task_assignee(task_id)
  );

drop policy if exists "task_assignees write manager" on public.task_assignees;
create policy "task_assignees write manager" on public.task_assignees
  for all using (public.can_manage_collab()) with check (public.can_manage_collab());

-- task_updates: chỉ đọc; mọi thay đổi qua hàm definer collab_transition_task.
drop policy if exists "task_updates select" on public.task_updates;
create policy "task_updates select" on public.task_updates
  for select using (public.can_manage_collab() or public.is_task_assignee(task_id));

-- task_attachments
drop policy if exists "task_attachments select" on public.task_attachments;
create policy "task_attachments select" on public.task_attachments
  for select using (public.can_manage_collab() or public.is_task_assignee(task_id));

drop policy if exists "task_attachments insert manager" on public.task_attachments;
create policy "task_attachments insert manager" on public.task_attachments
  for insert with check (public.can_manage_collab() and uploaded_by = auth.uid());

drop policy if exists "task_attachments delete" on public.task_attachments;
create policy "task_attachments delete" on public.task_attachments
  for delete using (public.can_manage_collab() or uploaded_by = auth.uid());

-- ------------------------------------------------------------
-- Máy trạng thái (một hàm duy nhất, kiểm tra quyền + nguyên tử)
-- ------------------------------------------------------------

create or replace function public.collab_transition_task(
  p_task uuid,
  p_action text,
  p_note text default null,
  p_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_task public.tasks;
  v_is_assignee boolean;
  v_is_manager boolean;
  v_new_status text;
  v_kind text;
begin
  if v_uid is null then
    raise exception 'unauthenticated' using errcode = '42501';
  end if;

  select * into v_task from public.tasks where id = p_task;
  if not found then
    raise exception 'task_not_found' using errcode = 'P0002';
  end if;

  v_is_assignee := public.is_task_assignee(p_task);
  v_is_manager  := public.can_manage_collab();

  if not (v_is_assignee or v_is_manager) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  v_new_status := v_task.status;

  case p_action
    when 'comment' then
      v_kind := 'comment';
    when 'accept' then
      if not v_is_assignee then raise exception 'forbidden' using errcode = '42501'; end if;
      if v_task.status not in ('assigned','needs_revision') then
        raise exception 'invalid_transition' using errcode = 'P0001'; end if;
      v_new_status := 'accepted'; v_kind := 'accept';
    when 'progress' then
      if not v_is_assignee then raise exception 'forbidden' using errcode = '42501'; end if;
      if v_task.status not in ('accepted','in_progress','needs_revision') then
        raise exception 'invalid_transition' using errcode = 'P0001'; end if;
      v_new_status := 'in_progress'; v_kind := 'progress';
    when 'submit' then
      if not v_is_assignee then raise exception 'forbidden' using errcode = '42501'; end if;
      if v_task.status not in ('accepted','in_progress','needs_revision') then
        raise exception 'invalid_transition' using errcode = 'P0001'; end if;
      v_new_status := 'submitted'; v_kind := 'result';
    when 'request_revision' then
      if not v_is_manager then raise exception 'forbidden' using errcode = '42501'; end if;
      if v_task.status <> 'submitted' then
        raise exception 'invalid_transition' using errcode = 'P0001'; end if;
      v_new_status := 'needs_revision'; v_kind := 'revision_request';
    when 'approve' then
      if not v_is_manager then raise exception 'forbidden' using errcode = '42501'; end if;
      if v_task.status <> 'submitted' then
        raise exception 'invalid_transition' using errcode = 'P0001'; end if;
      v_new_status := 'completed'; v_kind := 'approval';
    when 'cancel' then
      if not v_is_manager then raise exception 'forbidden' using errcode = '42501'; end if;
      if v_task.status in ('completed','cancelled') then
        raise exception 'invalid_transition' using errcode = 'P0001'; end if;
      v_new_status := 'cancelled'; v_kind := 'cancel';
    else
      raise exception 'unknown_action' using errcode = 'P0001';
  end case;

  if p_action <> 'comment' then
    update public.tasks
       set status = v_new_status,
           completed_at = case
             when v_new_status = 'completed' then now()
             when v_new_status in ('needs_revision','in_progress','submitted') then null
             else completed_at end,
           updated_at = now()
     where id = p_task;

    if p_action in ('accept','progress','submit') then
      update public.task_assignees
         set status = v_new_status,
             accepted_at = case when p_action = 'accept' then now() else accepted_at end,
             completed_at = case when p_action = 'submit' then now() else completed_at end
       where task_id = p_task and profile_id = v_uid;
    elsif p_action = 'approve' then
      update public.task_assignees set status = 'completed', completed_at = coalesce(completed_at, now())
       where task_id = p_task and status <> 'completed';
    elsif p_action = 'cancel' then
      update public.task_assignees set status = 'cancelled'
       where task_id = p_task and status <> 'cancelled';
    elsif p_action = 'request_revision' then
      update public.task_assignees set status = 'needs_revision'
       where task_id = p_task and status = 'submitted';
    end if;
  end if;

  insert into public.task_updates (task_id, author_id, kind, body, status_from, status_to)
  values (p_task, v_uid, v_kind, nullif(btrim(coalesce(p_note,'')), ''),
          case when p_action = 'comment' then null else v_task.status end,
          case when p_action = 'comment' then null else v_new_status end);

  if p_url is not null and length(btrim(p_url)) > 0 then
    insert into public.task_attachments (task_id, name, url, kind, uploaded_by)
    values (p_task, nullif(btrim(coalesce(p_note,'')), ''), btrim(p_url), 'result', v_uid);
  end if;

  if p_action <> 'comment' then
    insert into public.audit_log (actor_id, action, table_name, record_id, payload)
    values (v_uid, 'task.' || p_action, 'tasks', p_task,
            jsonb_build_object('from', v_task.status, 'to', v_new_status));
  end if;

  return jsonb_build_object('ok', true, 'status', v_new_status);
end;
$$;

revoke all on function public.collab_transition_task(uuid, text, text, text) from public, anon;
grant execute on function public.collab_transition_task(uuid, text, text, text) to authenticated;

revoke all on function public.collab_members() from public, anon;
grant execute on function public.collab_members() to authenticated;

-- ------------------------------------------------------------
-- Danh mục mặc định
-- ------------------------------------------------------------

insert into public.task_categories (key, label, description, sort_order)
values
  ('truyen-thong',       'Truyền thông',        'Bài viết, mạng xã hội, ấn phẩm', 1),
  ('su-kien',            'Sự kiện',             'Tổ chức và hỗ trợ sự kiện', 2),
  ('tiep-can-cong-dong', 'Tiếp cận cộng đồng',  'Hoạt động thực địa, cộng đồng', 3),
  ('xet-nghiem',         'Xét nghiệm & hỗ trợ', 'Hỗ trợ xét nghiệm, chuyển gửi', 4),
  ('hanh-chinh',         'Hành chính',          'Văn phòng, giấy tờ, hậu cần', 5),
  ('tai-chinh',          'Tài chính & gây quỹ', 'Ngân sách, tài trợ, gây quỹ', 6),
  ('khac',               'Khác',                'Công việc khác', 99)
on conflict (key) do nothing;
