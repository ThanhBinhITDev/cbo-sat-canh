-- Siết quyền gọi hàm trợ giúp nhiệm vụ: chỉ người đã đăng nhập.
-- (Các hàm kiểm tra vai trò dùng cho trang công khai như is_staff/is_editor
--  vẫn để nguyên vì policy trang khách cần gọi được khi ẩn danh.)
revoke all on function public.can_manage_collab() from public, anon;
grant execute on function public.can_manage_collab() to authenticated;

revoke all on function public.is_task_assignee(uuid) from public, anon;
grant execute on function public.is_task_assignee(uuid) to authenticated;
