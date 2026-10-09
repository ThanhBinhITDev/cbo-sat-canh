-- Avatar hồ sơ: cho phép MỌI vai trò staff upload/xoá file trong
-- thư mục avatars/ của bucket site-assets (policy cũ chỉ cho editor
-- và bắt thư mục con "uploads/" — không khớp avatar).
drop policy if exists "site-assets staff avatar upload" on storage.objects;
create policy "site-assets staff avatar upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'site-assets'
    and public.is_staff()
    and (storage.foldername(name))[1] = 'avatars'
  );

drop policy if exists "site-assets staff avatar delete" on storage.objects;
create policy "site-assets staff avatar delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'site-assets'
    and public.is_staff()
    and (storage.foldername(name))[1] = 'avatars'
  );
