# 13 — DANH SÁCH THÔNG TIN CẦN CUNG CẤP

## 13.1. Bắt buộc trước khi làm

| # | Thông tin | Dùng để | Trạng thái |
|---|---|---|---|
| 1 | **Supabase**: `Project URL`, `anon key`, `service role key` | Kết nối database | ⬜ Chờ |
| 2 | **Google Sheets**: link file + tên sheet nhận form (ví dụ `Form`) | Cấu hình Apps Script | ⬜ Chờ |
| 3 | **Địa chỉ / bản đồ**: địa chỉ trụ sở hoặc mã nhúng Google Maps | Mục Bản đồ & Liên hệ | ⬜ Chờ |
| 4 | **Link Fanpage** `https://facebook.com/...` | Nút Messenger | ⬜ Chờ |
| 5 | **Link Zalo** (mã QR hoặc URL `https://zalo.me/0967206095`) | Nút Zalo | ⬜ Chờ |
| 6 | **Email admin đầu tiên** + họ tên | Tạo tài khoản CMS | ⬜ Chờ |
| 7 | **Tên miền** (nếu có) | Cấu hình Vercel Domains | ⬜ Chờ |

## 13.2. Cần cho nội dung đẹp hơn

| # | Thông tin | Trạng thái |
|---|---|---|
| 8 | Ảnh hoạt động thực tế (nghỉ ít nhất 6 tấm, ≥ 1600px) | ⬜ Chờ |
| 9 | Chân dung Ban điều hành + chức danh + 1 dòng tiểu sử | ⬜ Chờ |
| 10 | Danh sách địa điểm/điểm hoạt động (nếu nhiều) | ⬜ Chờ |
| 11 | Số liệu nổi bật (số lượt xét nghiệm, số người hỗ trợ…) để làm thẻ thống kê | ⬜ Chờ |
| 12 | Logo chính thức bản cuối (nếu có bản PNG/SVG gọn hơn 6753px) | ⬜ Chờ |

## 13.3. Cần cho giai đoạn sau

| # | Thông tin | Trạng thái |
|---|---|---|
| 13 | Turnstile / hCaptcha key (nếu bị spam form) | ⬜ Chờ |
| 14 | Google Analytics / Search Console ID | ⬜ Chờ |
| 15 | Nội dung chính sách bảo mật & điều khoản (nếu bắt buộc) | ⬜ Chờ |

## 13.4. Hướng dẫn lấy thông tin

### Supabase

```
supabase.com/dashboard → chọn project → Project Settings (⚙) → API
  → Project URL          → dán vào NEXT_PUBLIC_SUPABASE_URL
  → anon public          → dán vào NEXT_PUBLIC_SUPABASE_ANON_KEY
  → service_role         → dán vào SUPABASE_SERVICE_ROLE_KEY   (giữ bí mật!)
```

### Google Apps Script → lấy webhook

```
Google Sheets → tiện ích mở rộng (Extensions) → Apps Script
  → dán đoạn code trong docs/09-api-form-va-tin.md §9.3
  → Deploy → New deployment → Web app
      Execute as: Me          Who has access: Anyone
  → Copy URL …/exec           → dán vào GOOGLE_SHEETS_WEBHOOK
```

### Link Fanpage

Mở Fanpage trên máy tính → địa chỉ trình duyệt
`https://www.facebook.com/TenTrang` → dán nguyên.

### Link Zalo

Mở Zalo cá nhân/nhóm → Cài đặt → chia sẻ mã QR → chụp ảnh, hoặc dùng
`https://zalo.me/0967206095`.

## 13.5. Cách gửi thông tin

Chạy trong terminal phiên này (để không dán khoá vào chat):

```bash
# ví dụ
! touch .env.local
```

hoặc tự mở `.env.local` rồi điền các biến theo
[11-deploy-va-moi-truong.md §11.2](./11-deploy-va-moi-truong.md).

> **Không** gửi `service_role key` qua GitHub Issues, chat công khai hoặc commit vào repo.
