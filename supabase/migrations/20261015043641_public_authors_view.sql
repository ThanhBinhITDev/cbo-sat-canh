-- Đối chiếu drift: view public_authors được tạo trực tiếp trên database
-- (migration 20261015043641) nhưng thiếu tệp trong repository.
--
-- LƯU Ý BẢO MẬT: đây là view công khai tối thiểu (chỉ id, full_name, avatar_url
-- của hồ sơ đang hoạt động) dùng cho trang bài viết. View hiện chạy theo quyền
-- người tạo (SECURITY DEFINER) — Supabase advisor gắn cờ. Tệp này phản ánh ĐÚNG
-- trạng thái database hiện tại để repo khớp live; việc chuyển sang
-- security_invoker (nếu cần) sẽ được xử lý ở migration riêng.
create or replace view public.public_authors as
  select id, full_name, avatar_url
  from public.profiles
  where is_active;
