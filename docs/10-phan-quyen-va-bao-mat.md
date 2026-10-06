# 10 — PHÂN QUYỀN VÀ BẢO MẬT

## 10.1. Ba vai trò

| Vai trò | Mô tả | Ai dùng |
|---|---|---|
| `admin` | Toàn quyền: nội dung, thiết lập, tài khoản | Ban điều hành |
| `editor` | Đăng và sửa bài viết, tin tức, ảnh bài viết | Người viết bài |
| `collaborator` | Chỉ xem bảng câu hỏi và đăng ký nhận tin | Nhân viên theo dõi form |

Gán vai trò trong `/admin/tai-khoan` (chỉ `admin`).

## 10.2. Ma trận quyền chi tiết

| Hành động | admin | editor | collaborator | Khách |
|---|---|---|---|---|
| Đọc trang khách | ✅ | ✅ | ✅ | ✅ |
| Gửi form liên hệ | ✅ | ✅ | ✅ | ✅ |
| Đăng ký nhận tin | ✅ | ✅ | ✅ | ✅ |
| Tạo/sửa bài viết | ✅ | ✅ | ❌ | ❌ |
| Xuất bản bài viết | ✅ | ✅ | ❌ | ❌ |
| Xoá bài viết | ✅ | ❌ | ❌ | ❌ |
| Thêm/sửa ảnh bài viết | ✅ | ✅ | ❌ | ❌ |
| Thêm/sửa ảnh banner, logo | ✅ | ❌ | ❌ | ❌ |
| Sửa dịch vụ | ✅ | ❌ | ❌ | ❌ |
| Sửa đối tác | ✅ | ❌ | ❌ | ❌ |
| Sửa đội ngũ | ✅ | ❌ | ❌ | ❌ |
| Sửa nội dung tĩnh | ✅ | ❌ | ❌ | ❌ |
| Sửa giao diện/màu | ✅ | ❌ | ❌ | ❌ |
| Xem câu hỏi liên hệ | ✅ | ✅ | ✅ (chỉ đọc) | ❌ |
| Đánh dấu đã trả lời | ✅ | ✅ | ❌ | ❌ |
| Xem / xuất newsletter | ✅ | ❌ | ✅ (xuất CSV) | ❌ |
| Xoá bản ghi | ✅ | ❌ | ❌ | ❌ |
| Quản lý tài khoản & vai trò | ✅ | ❌ | ❌ | ❌ |

## 10.3. Ba lớp kiểm tra

Lớp nào cũng phải qua — không được bỏ lớp nào.

**Lớp 1 — Middleware (Next.js)**

```ts
// middleware.ts
// /admin/* → lấy phiên Supabase → không có phiên thì chuyển /admin/login
// thiếu quyền → chuyển /admin/403
```

**Lớp 2 — Giao diện**

```tsx
<CanAccess role={['admin', 'editor']}>
  <NewPostButton />
</CanAccess>
```

**Lớp 3 — Row Level Security (bảo vệ cuối)**

```sql
-- ví dụ: chỉ admin/editor sửa bài
-- Hàm is_editor()/is_admin() khai báo SECURITY DEFINER (§10.1)
-- nên không tự đệ quy chính bảng profiles.
CREATE POLICY "staff update posts" ON posts
  FOR UPDATE USING (public.is_editor());
```

Ngay cả khi hacker sửa giao diện, database vẫn chặn.

## 10.4. Chính sách RLS đầy đủ

| Bảng | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | bản thân / admin | trigger | admin (không tự đổi vai trò mình) | admin |
| `posts` | `status='published'` OR staff | admin, editor (phải `author_id = auth.uid()`) | admin, editor | admin |
| `services` | `is_active` | admin | admin | admin |
| `partners` | `is_active` | admin | admin | admin |
| `team_members` | `is_active` | admin | admin | admin |
| `site_settings` | ai cũng được | admin | admin | admin |
| `media` | ai cũng được | admin, hoặc editor với ảnh `kind='other'` do chính mình tải lên | như INSERT | admin |
| `contact_messages` | admin, editor, collaborator | anon + service role (API) | admin, editor | admin |
| `newsletters` | admin, collaborator | anon + service role (API) | admin | admin |

> **Quy ước thư viện ảnh:** mọi tệp do nhân sự tải lên nằm ở thư mục con
> `uploads/<user-id>/` trong bucket `site-assets`. Policy `storage.objects` chặn
> editor ghi/xoá ngoài thư mục của mình; mọi thao tác xoá ảnh trên giao diện
> chỉ dành cho `admin`.

> `anon key` không được phép ghi `contact_messages`/`newsletters` trực tiếp —
> mọi lượt ghi đi qua API route trên Vercel để có rate limit và kiểm tra đầu vào.
> Vì vậy API route dùng `service_role_key` (chỉ nằm trên máy chủ, không lộ ra trình duyệt).

## 10.5. Bí mật

| Bí mật | Ở đâu | Được đưa vào trình duyệt? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` | ✅ có |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` | ✅ có (an toàn nhờ RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` | ❌ **không bao giờ** |
| `GOOGLE_SHEETS_WEBHOOK` | `.env.local` | ❌ không |
| `GOOGLE_SHEETS_SECRET` | `.env.local` | ❌ không |

- `.env.local` nằm trong `.gitignore`.
- Trên Vercel: Settings → Environment Variables.
- Nếu lộ `service_role_key` → đổi key ngay trong Supabase Dashboard.

## 10.6. Bảo mật khác

| Hạng mục | Biện pháp |
|---|---|
| Mật khẩu | Tối thiểu 8 ký tự, Supabase Auth tự đánh giá độ mạnh |
| Phiên | Cookie httpOnly, refresh token tự làm mới |
| CSRF | Kiểm tra `Origin`/`Host` ở mọi POST |
| Tiêu chuẩn HTTP | `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, CSP cơ bản |
| Markdown | `react-markdown` không cho HTML thô → chống XSS |
| Tệp tải lên | Chỉ ảnh, ≤ 5MB, kiểm tra định dạng thật bằng magic bytes |
| Nhật ký | Ghi thao tác của admin vào `audit_log` (giai đoạn 2) |

## 10.7. Kiểm tra trước khi bàn giao

- [ ] Tạo user `editor`, xác nhận **không** thấy menu Giao diện / Tài khoản.
- [ ] Truy cập thẳng URL `/admin/tai-khoan` bằng tài khoản `editor` → bị chặn.
- [ ] Gọi API ghi bằng `anon key` trực tiếp → bị từ chối.
- [ ] Submit form 5 lần liên tiếp → lần thứ 4 bị chặn rate limit.
- [ ] `grep` mã nguồn chắc chắn không có `SERVICE_ROLE` trong file `client`.
- [ ] Trang 403 và 404 hiển thị đúng.
