-- ============================================================
-- CBO Sát Cánh — username cho hồ sơ + đăng nhập bằng username
-- Chạy một lần trong Supabase SQL Editor (hoặc MCP/Migration).
-- ============================================================

-- 1. Cột username (tùy chọn, duy nhất, không phân biệt hoa thường)
alter table public.profiles add column if not exists username text;

create unique index if not exists profiles_username_key
  on public.profiles (lower(username)) where username is not null;

-- 2. Tra cứu email theo username khi đăng nhập.
--    security definer: RLS profiles chặn đọc ẩn danh, nên login
--    phải tra được email mà không leak dữ liệu khác (chỉ trả về email).
create or replace function public.resolve_login_identifier(p_identifier text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_email text;
begin
  select p.email into v_email
    from public.profiles p
   where lower(p.username) = lower(p_identifier)
   limit 1;
  return v_email;
end;
$$;

revoke all on function public.resolve_login_identifier(text) from public, anon, authenticated;
grant execute on function public.resolve_login_identifier(text) to anon, authenticated;
