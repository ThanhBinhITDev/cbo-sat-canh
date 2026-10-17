-- Đối chiếu drift: cột content_html được thêm trực tiếp trên database
-- (migration 20261015042823) nhưng thiếu tệp trong repository.
-- Idempotent — an toàn khi chạy lại.
alter table public.posts
  add column if not exists content_html text;
