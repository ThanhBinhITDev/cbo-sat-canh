# Website CBO SÁT CÁNH

Website chính thức của **Tổ chức Dựa vào Cộng đồng CBO SÁT CÁNH** — giới thiệu tổ chức,
dịch vụ, hoạt động và tiếp nhận thông tin từ cộng đồng.

- Thành lập: 04/12/2022
- Lĩnh vực: y tế cộng đồng & thiện nguyện xã hội (chăm sóc sức khỏe, phòng chống HIV/AIDS)
- Fanpage: **CBO SÁT CÁNH** · Hotline: **0967.206.095 – 0396.433.095**
- Email: **satcanhkg68@gmail.com**

> Toàn bộ giao diện và nội dung bằng **tiếng Việt**.

---

## Giới thiệu

Đây là một website + **CMS (hệ quản trị nội dung)** chạy hoàn toàn trên web. Quản trị viên
có thể tự sửa mọi thứ — bài viết, dịch vụ, đối tác, đội ngũ, banner trang chủ, màu giao diện —
**mà không cần đụng tới mã nguồn**.

**Trang khách:**

- Trang chủ dạng một trang cuộn (anchor) với banner slider, dịch vụ, đối tác, đội ngũ, bài nổi bật…
- Trang tin tức + trang chi tiết bài viết (nội dung Markdown).
- Trang liên hệ: form gửi câu hỏi + bản đồ Google Maps.
- Form đăng ký nhận tin (newsletter).

**Trang quản trị `/admin`** với 3 vai trò và các màn hình:

| Màn hình | URL | Nội dung |
| --- | --- | --- |
| Dashboard | `/admin` | Thẻ thống kê, câu hỏi mới nhất |
| Bài viết & Tin tức | `/admin/bai-viet` | Soạn Markdown, ảnh bìa, SEO, nháp/xuất bản |
| Dịch vụ | `/admin/dich-vu` | Sắp xếp kéo-thả, icon, màu, bật/tắt |
| Đối tác | `/admin/doi-tac` | Logo theo nhóm, link website |
| Đội ngũ | `/admin/doi-ngu` | Họ tên, chức danh, ảnh, tiểu sử |
| Nội dung tĩnh | `/admin/noi-dung` | Hero, tầm nhìn, sứ mệnh, giá trị, liên hệ, footer |
| Banner (Slider) | `/admin/slider` | CRUD slide, crop ảnh 16:7 |
| Giao diện | `/admin/giao-dien` | Đổi hệ màu, áp dụng cho toàn site |
| Quản lý ảnh | `/admin/anh` | Upload Storage, chuẩn hoá link ngoài |
| Câu hỏi liên hệ | `/admin/cau-hoi` | Xem / đánh dấu đã trả lời |
| Newsletter | `/admin/newsletter` | Danh sách, xuất CSV |
| Tài khoản & vai trò | `/admin/tai-khoan` | Tạo user, đổi vai trò, khoá |
| Hồ sơ cá nhân | `/admin/ho-so` | Avatar, tên đăng nhập, mật khẩu |

---

## Công nghệ sử dụng

| Thành phần | Lựa chọn |
| --- | --- |
| Framework | **Next.js 16** (App Router, Turbopack, React Compiler) |
| Ngôn ngữ | **TypeScript** |
| Giao diện | **Tailwind CSS v4** |
| Font | **Be Vietnam Pro** (Google Fonts) |
| Database / Auth / Storage | **Supabase** (PostgreSQL, Supabase Auth, Storage) |
| Markdown | **react-markdown** + **remark-gfm** |
| Crop ảnh | **react-easy-crop** |
| Icon | **lucide-react** |
| Triển khai | **Vercel** |
| Bản đồ | Google Maps embed (iframe) |

---

## Kiến trúc tổng quan

```
        Khách truy cập ──►  Vercel (Next.js 16, SSR/ISR)
                              ├─ /            Trang chủ
                              ├─ /tin-tuc     Tin tức + chi tiết
                              ├─ /lien-he     Liên hệ
                              ├─ /admin       CMS (bảo vệ bởi proxy.ts)
                              └─ /api/*       API route
                                     │
                ┌────────────────────┼────────────────────┐
                ▼                    ▼                    ▼
          Supabase             Google Sheets         (Storage ảnh)
       PostgreSQL · Auth      (bản sao form,        bucket site-assets
       · Storage · RLS         qua Apps Script)
```

**Luồng form liên hệ:** `Form → POST /api/contact → INSERT vào Supabase (bản chính) → đẩy sang
Google Sheets (bản sao) → trả về thành công`.

---

## Cấu trúc thư mục

```
web/
├─ app/
│  ├─ layout.tsx                 # Font, theme, metadata
│  ├─ globals.css                # Biến CSS của hệ màu
│  ├─ page.tsx                   # Trang chủ (một trang cuộn)
│  ├─ tin-tuc/                   # Danh sách + chi tiết bài viết
│  ├─ lien-he/                   # Liên hệ + form + bản đồ
│  ├─ admin/                     # CMS
│  │  ├─ login/                  # Đăng nhập
│  │  └─ (protected)/            # Các màn hình sau đăng nhập
│  └─ api/                       # contact, newsletter, newsletter-csv
├─ components/
│  ├─ site/                      # Header, Hero, HeroSlider, Footer, Form…
│  └─ admin/                     # Editor, form, bảng, ImageCropper, ui.tsx…
├─ lib/
│  ├─ supabase/                  # client, server, admin, update-session
│  ├─ auth.ts                    # requireRole(), getUser()
│  ├─ content.ts                 # Truy vấn nội dung + dữ liệu mặc định
│  ├─ settings.ts                # Đọc site_settings (theme, hero, footer…)
│  ├─ theme.ts                   # Ghép hệ màu động
│  ├─ sheets.ts                  # Gửi Apps Script
│  └─ drive-link.ts              # Chuẩn hoá link ảnh ngoài
├─ supabase/
│  ├─ migrations/                # File SQL (đánh số theo thời gian)
│  └─ seed.sql                   # Dữ liệu khởi tạo
├─ public/                       # favicon, ảnh tĩnh (brand, partners)
├─ docs/                         # Tài liệu dự án đầy đủ (tiếng Việt)
├─ proxy.ts                      # Thay middleware: refresh session + bảo vệ /admin
└─ next.config.ts
```

> **Lưu ý Next.js 16:** `middleware` đã được đổi tên thành **`proxy`** — xem `proxy.ts`.

---

## Bắt đầu

### 1. Yêu cầu

- Node.js **20+**
- Một project **Supabase** (đã tạo)
- (Tuỳ chọn) Google Apps Script Web App cho form → Google Sheets

### 2. Cài đặt

```bash
npm install
```

### 3. Biến môi trường

Sao chép `.env.example` thành `.env.local` rồi điền giá trị:

```bash
cp .env.example .env.local
```

| Biến | Bắt buộc | Ghi chú |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Project URL (Supabase → Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | `anon` public key (an toàn nhờ RLS) |
| `SUPABASE_SECRET_KEY` | ✅ | Secret/`service_role` key — **chỉ dùng phía server** |
| `NEXT_PUBLIC_SITE_URL` | ✅ | URL site (dev: `http://localhost:3000`) |
| `NEXT_PUBLIC_SITE_NAME` | ❌ | Mặc định `CBO Sát Cánh` |
| `NEXT_PUBLIC_DEFAULT_HOTLINE` | ❌ | Hotline mặc định |
| `GOOGLE_SHEETS_WEBHOOK` | ❌ | URL Apps Script (bản sao form) |
| `GOOGLE_SHEETS_SECRET` | ❌ | Chuỗi bí mật xác thực webhook |

> `SUPABASE_SECRET_KEY` chỉ chạy ở server, **không bao giờ** lộ ra trình duyệt.
> `.env.local` đã nằm trong `.gitignore`.

### 4. Cơ sở dữ liệu

Chạy các file trong `supabase/migrations/` (theo thứ tự tên) bằng **SQL Editor** của Supabase
hoặc Supabase CLI:

```bash
npm i -g supabase
supabase login
supabase link --project-ref <PROJECT_REF>
supabase db push
```

Sau đó tạo bucket Storage tên **`site-assets`** và bật **Public bucket**.

### 5. Chạy

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000). Trang quản trị: `/admin/login`.

---

## Phân quyền

Ba vai trò, gán trong `/admin/tai-khoan`:

| Vai trò | Quyền |
| --- | --- |
| `admin` | Toàn quyền: nội dung, thiết lập, tài khoản |
| `editor` | Đăng/sửa bài viết, ảnh bài viết |
| `collaborator` | Chỉ xem câu hỏi liên hệ và newsletter |

Bảo vệ theo **3 lớp**: component (`CanAccess`) → `proxy.ts` (server) → **RLS** (database).

---

## Lệnh npm

```bash
npm run dev      # Chạy môi trường phát triển
npm run build    # Build production
npm run start    # Chạy bản đã build
npm run lint     # Kiểm tra ESLint

npx tsc --noEmit # Kiểm tra kiểu TypeScript
```

---

## Triển khai (Vercel)

1. Vào [vercel.com/new](https://vercel.com/new) → chọn repo GitHub → Framework **Next.js**.
2. `Settings → Environment Variables` → nhập toàn bộ biến môi trường cho cả
   `Production`, `Preview`, `Development`.
3. `Deploy`.
4. Sau khi deploy, cập nhật `NEXT_PUBLIC_SITE_URL` cho khớp domain thật và thêm domain vào
   **Supabase → Authentication → URL Configuration**.

Quy trình: `chỉnh mã → lint → typecheck → build → commit → push → Vercel build Preview → merge main`.

---

## Bảo mật

- Mọi thao tác ghi đi qua API route có kiểm tra phiên + vai trò; `anon key` không ghi trực tiếp.
- **RLS** là lớp bảo vệ cuối ở database.
- CSRF: kiểm tra `Origin`/`Host` ở mọi POST; chống spam bằng honeypot + rate limit.
- Markdown không cho HTML thô (chống XSS); ảnh upload chỉ nhận ảnh ≤ 5MB.

---

## Tài liệu

Tài liệu dự án đầy đủ nằm trong thư mục [`docs/`](./docs/README.md):

| # | File | Nội dung |
| --- | --- | --- |
| 1 | [01-tong-quan-du-an.md](./docs/01-tong-quan-du-an.md) | Tổng quan, mục tiêu, phạm vi |
| 2 | [02-yeu-cau-chi-tiet.md](./docs/02-yeu-cau-chi-tiet.md) | Yêu cầu chi tiết |
| 3 | [03-kien-truc-he-thong.md](./docs/03-kien-truc-he-thong.md) | Kiến trúc hệ thống |
| 4 | [04-co-so-du-lieu.md](./docs/04-co-so-du-lieu.md) | Cơ sở dữ liệu |
| 5 | [05-trang-khach.md](./docs/05-trang-khach.md) | Trang khách |
| 6 | [06-trang-admin-cms.md](./docs/06-trang-admin-cms.md) | Trang quản trị |
| 7 | [07-he-mau-giao-dien.md](./docs/07-he-mau-giao-dien.md) | Hệ màu giao diện |
| 8 | [08-anh-va-noi-dung.md](./docs/08-anh-va-noi-dung.md) | Ảnh & nội dung |
| 9 | [09-api-form-va-tin.md](./docs/09-api-form-va-tin.md) | API form & tin tức |
| 10 | [10-phan-quyen-va-bao-mat.md](./docs/10-phan-quyen-va-bao-mat.md) | Phân quyền & bảo mật |
| 11 | [11-deploy-va-moi-truong.md](./docs/11-deploy-va-moi-truong.md) | Deploy & môi trường |
| 12 | [12-kenh-lam-viec-roadmap.md](./docs/12-kenh-lam-viec-roadmap.md) | Roadmap |

---

## Contributors

Xem chi tiết tại [CONTRIBUTORS.md](./CONTRIBUTORS.md).

- **ThanhBinhITDev** — tác giả, thiết kế & phát triển
- **OpenCode** — trợ lý lập trình AI (CLI)
- **Claude** (Anthropic)
- **ChatGPT** (OpenAI)
- **Gemini** (Google)
- **GitHub Copilot**

---

<p align="center">Made with ❤️ vì cộng đồng — <strong>CBO SÁT CÁNH</strong></p>
