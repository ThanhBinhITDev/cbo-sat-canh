# 11 — SUPABASE, VERCEL VÀ BIẾN MÔI TRƯỜNG

## 11.1. Supabase

**Lần đầu cấu hình**

1. Vào `https://supabase.com/dashboard` → chọn project đã có (hoặc tạo mới).
2. `Project Settings → API` → lấy:
   - `Project URL`
   - `anon` `public` key
   - `service_role` key
3. `SQL Editor` → dán nội dung `supabase/migrations/0001_init.sql` → **Run**.
4. `Storage` → tạo bucket `site-assets`, đặt **Public bucket = ON**.
5. `Authentication → Providers → Email`: bật, tắt *"Confirm email"* nếu muốn vào admin ngay
   (khuyến nghị: giữ bật, sẽ cần tạo user qua Dashboard).
6. `Authentication → URL Configuration`: thêm `https://<site>.vercel.app` vào
   **Site URL** và **Redirect URLs**.

**Chạy migration bằng CLI (tuỳ chọn)**

```bash
npm i -g supabase
supabase login
supabase link --project-ref <PROJECT_REF>
supabase db push
```

## 11.2. Biến môi trường

`.env.local` (không commit):

```bash
# ---- Supabase ----
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...        # chỉ server

# ---- Google Sheets ----
GOOGLE_SHEETS_WEBHOOK=https://script.google.com/macros/s/XXX/exec
GOOGLE_SHEETS_SECRET=doi-lap-mot-chuoi-bi-mat
NEWSLETTER_SHEETS_WEBHOOK=                      # nếu tách sheet riêng

# ---- Ứng dụng ----
NEXT_PUBLIC_SITE_URL=https://<site>.vercel.app
NEXT_PUBLIC_SITE_NAME=CBO Sát Cánh
NEXT_PUBLIC_DEFAULT_HOTLINE=0967206095

# ---- Chống spam (tuỳ chọn) ----
TURNSTILE_SECRET_KEY=
```

`.env.example` (commit được) chứa bản thiếu giá trị thật.

## 11.3. Vercel

**Kết nối repo**

1. `https://vercel.com/new` → chọn GitHub repo → Framework **Next.js**
2. `Settings → Environment Variables` → nhập toàn bộ biến ở trên, cho cả
   `Production`, `Preview`, `Development`.
3. `Deploy` lần đầu.

**Cấu hình sau deploy**

| Hạng mục | Giá trị |
|---|---|
| Domain | `Settings → Domains` → thêm tên miền riêng (nếu có) |
| Node.js | 20+ |
| Build command | `npm run build` (mặc định) |
| Output | `.next` (mặc định) |
| Env | `NEXT_PUBLIC_SITE_URL` phải khớp domain thật |

**Quy tắc cập nhật database**

| Thao tác | Cách chạy |
|---|---|
| Đổi cấu trúc bảng | File SQL mới trong `supabase/migrations/` → `supabase db push` |
| Nạp dữ liệu ban đầu | `npm run db:seed` |
| Thay đổi thủ công dữ liệu | Supabase Dashboard → Table Editor |

## 11.4. Lệnh npm

```jsonc
{
  "dev":      "next dev",
  "build":    "next build",
  "start":    "next start",
  "lint":     "next lint",
  "typecheck":"tsc --noEmit",
  "db:migrate": "supabase db push",
  "db:seed":  "tsx supabase/seed.ts",
  "images":   "node scripts/optimize-images.mjs"
}
```

## 11.5. Quy trình triển khai

```
chỉnh mã → npm run lint → npm run typecheck → npm run build
   → commit → push → Vercel tự build môi trường Preview
   → kiểm tra link Preview
   → merge vào nhánh chính → Vercel build Production
```

Không bao giờ push thẳng vào `main` nếu có thay đổi migration chưa kiểm chứng.

## 11.6. Sao lưu & khôi phục

- Supabase → `Database → Backups`: bật bản sao lưu tự động (theo gói).
- Hàng tuần xuất CSV các bảng `posts`, `contact_messages`, `newsletters`.
- Cách khôi phục: Dashboard → `Database → Backups → Restore`.

## 11.7. Giám sát

| Công cụ | Cái gì |
|---|---|
| Vercel → Observability | Lỗi build, thời gian tải trang |
| Supabase → Logs | Lỗi SQL, số request API |
| Google Search Console | Thứ hạng tìm kiếm, lỗi SEO |
| Supabase → Auth → Users | Người dùng đăng nhập |

## 11.8. Chi phí tham khảo

| Dịch vụ | Gói | Ước tính |
|---|---|---|
| Vercel | Hobby | Miễn phí (dùng cá nhân/nhóm nhỏ) |
| Supabase | Free | 500MB database, 1GB storage, 50.000 user/tháng |
| Google Sheets | Miễn phí | — |
| Tên miền | Theo nhà cung cấp | ~300.000đ/năm |

Gói Pro của Supabase (~$25/tháng) chỉ cần khi vượt giới hạn free.
