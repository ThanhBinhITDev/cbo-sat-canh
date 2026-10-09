-- RPC trạng thái hạn mức cho cảnh báo + khóa ghi (mọi vai trò staff).
-- SECURITY DEFINER (owner = postgres) để đọc pg_catalog/storage.objects
-- vượt RLS; tự chặn vai trò ngoài staff. search_path = '' + schema-qualify.
create or replace function public.quota_status()
returns json
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return json_build_object(
    'database_bytes', pg_catalog.pg_database_size(current_database()),
    'storage_bytes',
      coalesce(
        (select sum((metadata->>'size')::bigint) from storage.objects),
        0
      )
  );
end;
$$;

revoke execute on function public.quota_status() from public, anon;
grant execute on function public.quota_status() to authenticated;
