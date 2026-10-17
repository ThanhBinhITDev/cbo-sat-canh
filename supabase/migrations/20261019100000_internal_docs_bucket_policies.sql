-- 20261019100000_internal_docs_bucket_policies.sql
-- Create private bucket internal-docs and storage policies (read/write manager)

-- Ensure bucket exists (idempotent) – if already created via SQL above, this no-op
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('internal-docs', 'internal-docs', false, 10485760, NULL)
  ON CONFLICT (id) DO NOTHING;
END$$;

-- Policies: read/write for can_manage_collab (admin/editor with can_manage_tasks or admin), public no read
DROP POLICY IF EXISTS "internal_docs_read_manager" ON storage.objects;
CREATE POLICY "internal_docs_read_manager" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'internal-docs' AND public.can_manage_collab());

DROP POLICY IF EXISTS "internal_docs_insert_manager" ON storage.objects;
CREATE POLICY "internal_docs_insert_manager" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'internal-docs' AND public.can_manage_collab());

DROP POLICY IF EXISTS "internal_docs_update_manager" ON storage.objects;
CREATE POLICY "internal_docs_update_manager" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'internal-docs' AND public.can_manage_collab())
  WITH CHECK (bucket_id = 'internal-docs' AND public.can_manage_collab());

DROP POLICY IF EXISTS "internal_docs_delete_manager" ON storage.objects;
CREATE POLICY "internal_docs_delete_manager" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'internal-docs' AND public.can_manage_collab());
