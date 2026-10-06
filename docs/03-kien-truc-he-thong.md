# 03 — KIẾN TRÚC HỆ THỐNG

## 3.1. Sơ đồ tổng

```
                          ┌──────────────────────────┐
      Khách truy cập ───► │  Vercel (Next.js 15)     │
                          │  - SSR / ISR              │
                          │  - /  /tin-tuc  /admin    │
                          │  - /api/*                 │
                          └───────┬──────────┬────────┘
                                  │          │
                 đọc/ghi nội dung │          │ ghi form
                                  ▼          ▼
                     ┌────────────────┐   ┌─────────────────────┐
                     │   Supabase     │   │ Google Sheets       │
                     │  PostgreSQL    │   │ (qua Apps Script    │
                     │  Auth          │   │  Web App)           │
                     │  Storage (ảnh) │   │                     │
                     └────────────────┘   └─────────────────────┘

  Admin  ──►  /admin  ──►  Supabase Auth (3 vai trò)  ──►  RLS
```

## 3.2. Stack

| Thành phần | Lựa chọn | Lý do |
|---|---|---|
| Framework | **Next.js 15** (App Router) | SSR/SSG, tối ưu SEO cho tin tức, deploy thẳng lên Vercel |
| Ngôn ngữ | **TypeScript** | An toàn kiểu khi CMS sửa dữ liệu phức tạp |
| Styling | **Tailwind CSS v4** | Nhanh, dễ ghép biến màu động |
| Font | **Be Vietnam Pro** (Google Fonts) | Chữ tiếng Việt đẹp, đủ nét đậm nhạt |
| Database | **Supabase** (PostgreSQL 15+) | Đã có tài khoản, kèm Auth + Storage + RLS |
| Auth | **Supabase Auth** (email/password) | Gắn thẳng với database, không cần thêm dịch vụ |
| Nôi dung bài | **react-markdown** + remark-gfm | Soạn markdown trong CMS, render an toàn |
| Ảnh | **next/image** | Nén AVIF/WebP, chặn biến ảnh |
| Icon | **lucide-react** | Mũi tên, điện thoại, zalo… nhẹ và sạch |
| Deploy | **Vercel** | Khớp hoàn toàn với Next.js |
| Bản đồ | **Google Maps embed** (iframe) | Không cần API key nếu chỉ nhúng |

## 3.3. Cấu trúc thư mục

```
web/
├─ app/
│  ├─ layout.tsx                    # font, theme server, metadata
│  ├─ globals.css                   # biến CSS của hệ màu
│  ├─ (site)/
│  │  ├─ page.tsx                   # Trang chủ (một trang cuộn)
│  │  ├─ tin-tuc/
│  │  │  ├─ page.tsx                # Danh sách bài viết
│  │  │  └─ [slug]/page.tsx         # Chi tiết bài viết
│  │  └─ lien-he/page.tsx           # Liên hệ + form + bản đồ
│  ├─ admin/
│  │  ├─ login/page.tsx             # Đăng nhập
│  │  ├─ (protected)/
│  │  │  ├─ layout.tsx              # Sidebar, kiểm tra vai trò
│  │  │  ├─ page.tsx                # Dashboard
│  │  │  ├─ bai-viet/                # Bài viết (admin, editor)
│  │  │  ├─ bai-viet/[id]/page.tsx
│  │  │  ├─ dich-vu/                 # Dịch vụ
│  │  │  ├─ doi-tac/                 # Đối tác
│  │  │  ├─ doi-ngu/                 # Đội ngũ
│  │  │  ├─ noi-dung/                # Nội dung tĩnh (hero, tầm nhìn…)
│  │  │  ├─ giao-dien/               # Chọn màu
│  │  │  ├─ anh/                     # Quản lý ảnh (Storage)
│  │  │  ├─ cau-hoi/                 # Form liên hệ
│  │  │  ├─ newsletter/              # Đăng ký nhận tin
│  │  │  └─ tai-khoan/               # Tài khoản & vai trò (admin)
│  │  └─ layout.tsx
│  └─ api/
│     ├─ contact/route.ts            # POST form liên hệ
│     ├─ newsletter/route.ts         # POST đăng ký nhận tin
│     └─ theme/route.ts              # GET theme public (fallback)
├─ components/
│  ├─ site/                          # Header, Hero, Section, Footer, Form…
│  ├─ admin/                         # Bảng dữ liệu, form, editor…
│  └─ ui/                            # Button, Input, Modal, Card…
├─ lib/
│  ├─ supabase/
│  │  ├─ client.ts                   # client cho trình duyệt
│  │  ├─ server.ts                   # server component / route handler
│  │  └─ middleware.ts               # refresh session
│  ├─ auth.ts                        # requireRole(), getUser()
│  ├─ theme.ts                       # đọc/ghép theme
│  ├─ drive-link.ts                  # chuẩn hoá link ảnh
│  ├─ posts.ts                       # truy vấn bài viết
│  ├─ settings.ts                    # đọc site_settings
│  └─ sheets.ts                      # gửi Apps Script
├─ supabase/
│  ├─ migrations/                    # file SQL
│  └─ seed.ts                        # nạp nội dung từ Word
├─ assets/                           # ảnh cố định đã nén
├─ public/                           # favicon, sitemap tĩnh
├─ docs/                             # tài liệu này
├─ middleware.ts                     # bảo vệ /admin
├─ next.config.ts
├─ tailwind.config.ts
└─ .env.local                        # KHÔNG commit
```

## 3.4. Luồng dữ liệu chính

### A. Khách đọc trang

```
Request → middleware (bỏ qua /admin) → layout đọc site_settings.theme
        → trả HTML với CSS variables → component đọc dữ liệu đã nén (cache)
```

### B. Khách gửi form liên hệ

```
Form submit
  → POST /api/contact        (kiểm tra CSRF, chống spam bằng honeypot + rate limit)
  → INSERT contact_messages   (Supabase, bản chính)
  → fetch Apps Script Web App (bản sao sang Google Sheets, retry 1 lần)
  → trả { ok: true }
  → giao diện hiện "Đã gửi, chúng tôi sẽ liên hệ lại"
```

### C. Admin sửa màu giao diện

```
Đăng nhập → /admin/giao-dien → chọn màu
  → UPDATE site_settings (key = 'theme')
  → áp dụng lại ngay trong trang admin (thử màu)
  → Lưu → khách reload trang nhận màu mới từ server
```

### D. Admin đăng bài

```
/admin/bai-viet → Soạn tiêu đề, ảnh bìa (dán link), nội dung markdown
  → Lưu nháp (status = draft)
  → "Xuất bản" → status = published, published_at = now
  → Trang /tin-tuc/[slug] hiển thị
```

## 3.5. Nguyên tắc thiết kế

1. **Server trước, client sau** — dữ liệu tĩnh đọc server component để nhẹ JS.
2. **Không bao giờ tin client** — mọi ghi dữ liệu qua API route có kiểm tra phiên và vai trò.
3. **RLS là lớp bảo vệ cuối** — ngay cả khi quên kiểm tra trong code, database chặn.
4. **Không commit bí mật** — `.env.local` nằm trong `.gitignore`.
5. **Ảnh luôn qua `next/image`** — không chèn thẻ `<img>` thô.
6. **Tách nội dung khỏi giao diện** — mọi chữ hiển thị trên trang lấy từ database,
   admin sửa được mà không sửa code.
