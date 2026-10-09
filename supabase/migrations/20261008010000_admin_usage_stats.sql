-- RPC cho thẻ "Dung lượng Supabase" trên Dashboard admin.
-- SECURITY DEFINER (owner = postgres) để vượt RLS của storage.objects
-- và đọc catalog; tự kiểm tra is_admin() — revoke anon/public tránh
-- security advisor. search_path = '' + schema-qualify mọi tham chiếu.
create or replace function public.admin_usage_stats()
returns json
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return json_build_object(
    'database_bytes', pg_catalog.pg_database_size(current_database()),
    'storage_bytes',
      coalesce(
        (select sum((metadata->>'size')::bigint) from storage.objects),
        0
      ),
    'file_count',
      (select count(*) from storage.objects),
    'tables',
      coalesce(
        (select json_agg(x order by x.bytes desc) from (
           select c.relname as name,
                  pg_catalog.pg_total_relation_size(c.oid) as bytes
             from pg_catalog.pg_class c
             join pg_catalog.pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public' and c.relkind = 'r'
            order by 2 desc
            limit 3
         ) x),
        '[]'::json
      )
  );
end;
$$;

revoke execute on function public.admin_usage_stats() from public, anon;
grant execute on function public.admin_usage_stats() to authenticated;
