-- ============================================================
-- Giai đoạn 1 bổ sung — Cho phép người quản lý cộng tác tải
-- ảnh đính kèm nhiệm vụ lên thư mục uploads/tasks/ của
-- bucket site-assets (policy cũ chỉ cho admin/editor).
-- ============================================================

drop policy if exists "site-assets collab upload tasks" on storage.objects;
create policy "site-assets collab upload tasks" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'site-assets'
    and public.can_manage_collab()
    and (storage.foldername(name))[1] = 'uploads'
    and (storage.foldername(name))[2] = 'tasks'
  );

drop policy if exists "site-assets collab update tasks" on storage.objects;
create policy "site-assets collab update tasks" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'site-assets'
    and public.is_admin()
    and (storage.foldername(name))[1] = 'uploads'
    and (storage.foldername(name))[2] = 'tasks'
  );

drop policy if exists "site-assets collab delete tasks" on storage.objects;
create policy "site-assets collab delete tasks" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'site-assets'
    and (
      public.is_admin()
      or (
        public.can_manage_collab()
        and (storage.foldername(name))[1] = 'uploads'
        and (storage.foldername(name))[2] = 'tasks'
      )
    )
  );
