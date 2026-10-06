# 04 — CƠ SỞ DỮ LIỆU (SUPABASE)

Ngôn ngữ: PostgreSQL. Toàn bộ định nghĩa nằm trong `supabase/migrations/`.

## 4.1. Sơ đồ quan hệ

```
auth.users ──1:1──► profiles
                        │
posts.author_id ────────┤
                        │
site_settings   (độc lập, key/value)
services        (độc lập)
partners        (độc lập)
team_members    (độc lập)
media           (độc lập)
contact_messages (độc lập, có staff_id → profiles)
newsletters     (độc lập)
```

## 4.2. Các bảng

### `profiles` — tài khoản người quản trị

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | uuid | PK, FK → `auth.users.id` ON DELETE CASCADE |
| `full_name` | text | NOT NULL |
| `email` | text | NOT NULL, UNIQUE |
| `role` | text | NOT NULL, CHECK IN (`admin`, `editor`, `collaborator`), DEFAULT `editor` |
| `avatar_url` | text | |
| `is_active` | boolean | DEFAULT true |
| `created_at` | timestamptz | DEFAULT now() |
| `updated_at` | timestamptz | DEFAULT now() |

Trigger: khi tạo user trong `auth.users` → tự tạo dòng `profiles`.

### `posts` — bài viết, tin tức, hoạt động

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | uuid | PK, DEFAULT gen_random_uuid() |
| `slug` | text | NOT NULL, UNIQUE |
| `title` | text | NOT NULL |
| `excerpt` | text | tóm tắt cho thẻ danh sách |
| `content_md` | text | nội dung markdown |
| `cover_url` | text | ảnh bìa (URL ngoài) |
| `category` | text | CHECK IN (`tin-tuc`, `hoat-dong`) |
| `status` | text | CHECK IN (`draft`, `published`), DEFAULT `draft` |
| `author_id` | uuid | FK → profiles.id, ON DELETE SET NULL |
| `is_featured` | boolean | DEFAULT false — hiện ở trang chủ |
| `meta_title` | text | SEO |
| `meta_description` | text | SEO |
| `published_at` | timestamptz | |
| `created_at` | timestamptz | DEFAULT now() |
| `updated_at` | timestamptz | DEFAULT now() |

Index: `(status, published_at DESC)`, `(category)`, GIN full-text trên `title + excerpt + content_md`.

### `services` — dịch vụ

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | uuid | PK |
| `title` | text | NOT NULL |
| `slug` | text | UNIQUE |
| `description` | text | |
| `icon` | text | tên icon lucide |
| `color` | text | mã màu riêng cho card |
| `sort_order` | int | DEFAULT 0 |
| `is_active` | boolean | DEFAULT true |

4 bản ghi mặc định: Xét nghiệm nhanh HIV/STIs · PrEP · PEP · Chuyển gửi điều trị ARV.

### `partners` — đối tác

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | NOT NULL |
| `group` | text | CHECK IN (`strategic`, `clinic`, `network`) |
| `logo_url` | text | |
| `website_url` | text | |
| `sort_order` | int | DEFAULT 0 |
| `is_active` | boolean | DEFAULT true |

Nhóm: `strategic` = ĐỐI TÁC CHIẾN LƯỢC CHÍNH (6), `clinic` = PHÒNG KHÁM NHÀ MÌNH (3),
`network` = MẠNG LƯỚI CBO ĐỒNG BẰNG SÔNG CỬU LONG (1).

### `team_members` — đội ngũ

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | uuid | PK |
| `full_name` | text | NOT NULL |
| `position` | text | chức danh |
| `avatar_url` | text | |
| `bio` | text | |
| `sort_order` | int | DEFAULT 0 |
| `is_active` | boolean | DEFAULT true |

### `site_settings` — nội dung tĩnh & thiết lập

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `key` | text | PK (ví dụ: `theme`, `hero`, `about`, `vision`, `mission`, `values`, `contact`, `footer`, `map`, `seo`) |
| `value` | jsonb | NOT NULL |
| `updated_at` | timestamptz | |
| `updated_by` | uuid | FK → profiles.id |

Cấu trúc `value` của một số key:

```jsonc
// key = 'theme'
{ "primary": "#279CD7", "dark": "#1C4592", "ink": "#454C56",
  "surface": "#FFFFFF", "muted": "#F5F8FA", "accent": "#FFB020",
  "radius": 16, "fontScale": 1 }

// key = 'hero'
{ "title": "...", "subtitle": "...", "image": "<public url>",
  "cta_label": "Nhận tư vấn", "cta_href": "/lien-he" }

// key = 'contact'
{ "hotline": ["0967.206.095", "0396.433.095"],
  "email": "satcanhkg68@gmail.com",
  "fanpage": "CBO SÁT CÁNH",
  "fanpage_url": "https://facebook.com/...",
  "zalo": "0967206095",
  "address": "...", "maps_embed": "<iframe src=...>" }
```

### `media` — ảnh không phải bài viết

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | uuid | PK |
| `kind` | text | CHECK IN (`hero`, `banner`, `decoration`, `logo`, `avatar`, `other`) |
| `storage_path` | text | đường dẫn trong Supabase Storage (NULL nếu là URL ngoài) |
| `public_url` | text | URL hiển thị |
| `alt` | text | văn bản thay thế ảnh |
| `uploaded_by` | uuid | FK → profiles.id |
| `created_at` | timestamptz | |

Bucket Storage: `site-assets` (công khai đọc, ghi chỉ cho người đã đăng nhập).

### `contact_messages` — câu hỏi từ form

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | NOT NULL |
| `phone` | text | NOT NULL |
| `email` | text | |
| `service_interest` | text | |
| `message` | text | NOT NULL |
| `status` | text | CHECK IN (`new`, `replied`, `archived`), DEFAULT `new` |
| `source` | text | DEFAULT `website` |
| `handled_by` | uuid | FK → profiles.id |
| `created_at` | timestamptz | |

### `newsletters` — đăng ký nhận tin

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | uuid | PK |
| `email` | text | NOT NULL, UNIQUE |
| `name` | text | |
| `source` | text | DEFAULT `footer` |
| `is_active` | boolean | DEFAULT true |
| `created_at` | timestamptz | |

### `audit_log` — lịch sử thao tác (giai đoạn 2)

| Cột | Kiểu |
|---|---|
| `id` | uuid PK |
| `actor_id` | uuid FK profiles |
| `action` | text |
| `table_name` | text |
| `record_id` | uuid |
| `payload` | jsonb |
| `created_at` | timestamptz |

## 4.3. Chức năng phụ

- `updated_at` trigger cho mọi bảng có cột này.
- View `v_unread_messages` đếm câu hỏi chưa trả lời (dùng cho dashboard).
- Function `is_admin()`, `is_editor()`, `is_staff()` trả về vai trò của phiên hiện tại,
  dùng lại trong chính sách RLS.

## 4.4. Chính sách RLS (tóm tắt)

| Bảng | SELECT (đọc) | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | bản thân mình / admin | trigger tạo user | admin | admin |
| `posts` | `published` (ai cũng đọc) | admin, editor | admin, editor | admin |
| `services` | `is_active` | admin | admin | admin |
| `partners` | `is_active` | admin | admin | admin |
| `team_members` | `is_active` | admin | admin | admin |
| `site_settings` | ai cũng đọc | admin | admin | admin |
| `media` | ai cũng đọc | đã đăng nhập | admin | admin |
| `contact_messages` | admin, editor, collaborator | anon (qua API) | admin, editor | admin |
| `newsletters` | admin, collaborator | anon (qua API) | admin | admin |

Chi tiết ở [10-phan-quyen-va-bao-mat.md](./10-phan-quyen-va-bao-mat.md).

## 4.5. Dữ liệu seed

Chạy một lần sau khi tạo database — mở Supabase **SQL Editor** (hoặc MCP Supabase) và chạy theo thứ tự:

1. `supabase/migrations/20261006000001_init.sql` — schema, trigger, RLS, storage bucket
2. `supabase/seed.sql` — 4 dịch vụ, 10 đối tác, nội dung tĩnh, 3 bài viết mẫu

Tài khoản `admin` đầu tiên: Supabase **Authentication → Users → Add user**
(thêm user_metadata `full_name`, mật khẩu ≥ 8 ký tự) rồi ở SQL Editor chạy

```sql
-- trigger tạo profile với is_active=false (fail-closed) nên phải bật kèm
update public.profiles
   set role = 'admin', is_active = true
 where email = 'ban@email.com';
```

> ⚠️ **Vô hiệu hoá đăng ký công khai**: Dashboard → *Authentication → Sign In / Up*
> → bỏ chọn *Allow new users to sign up*. Trigger tạo profile với quyền thấp nhất
> và `is_active = false` (đăng ký công khai không vào được `/admin`), nhưng nên
> tắt hẳn để tránh rác dữ liệu. Mọi tài khoản quản trị chỉ sinh ra qua
> trang **Tài khoản** (`/admin/tai-khoan`) hoặc Dashboard.

- 4 `services`
- 10 `partners` (chia 3 nhóm, logo đã đổi tên file)
- Nội dung `site_settings`: giới thiệu, tầm nhìn, sứ mệnh, giá trị, liên hệ, theme mặc định
- 1 tài khoản `admin` đầu tiên (tạo qua Supabase Dashboard hoặc seed có tham số email)
- Các bài viết mẫu: 2 tin tức, 1 hoạt động
