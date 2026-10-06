# 09 — API, FORM LIÊN HỆ VÀ GOOGLE SHEETS

## 9.1. Các endpoint

| Method | Đường dẫn | Vai trò | Việc làm |
|---|---|---|---|
| `POST` | `/api/contact` | Khách (anon) | Lưu câu hỏi → đẩy Google Sheets |
| `GET` | `/api/contact` | admin, editor, collaborator | Danh sách câu hỏi (phân trang, lọc) |
| `PATCH` | `/api/contact/:id` | admin, editor | Đổi trạng thái, ghi người trả lời |
| `POST` | `/api/newsletter` | Khách (anon) | Đăng ký nhận tin |
| `GET` | `/api/newsletter` | admin, collaborator | Danh sách |
| `DELETE` | `/api/newsletter/:id` | admin | Xoá đăng ký |
| `GET` | `/api/theme` | Mọi người | Lấy theme hiện tại |
| `POST` | `/api/posts` | admin, editor | Tạo bài |
| `PATCH` | `/api/posts/:id` | admin, editor | Sửa bài |
| `DELETE` | `/api/posts/:id` | admin | Xoá bài |

Mọi endpoint ghi dữ liệu bắt buộc kiểm tra `Authorization` phiên Supabase
và vai trò — không dựa vào mỗi giao diện.

## 9.2. Form liên hệ — chi tiết

### Dữ liệu nhận

```jsonc
{
  "name": "Nguyễn Văn A",
  "phone": "0912345678",
  "email": "a@example.com",          // tùy chọn
  "service_interest": "prep",         // prep | pep | arv | test | other
  "message": "Tôi muốn tư vấn về PrEP",
  "website": ""                       // honeypot, phải rỗng
}
```

### Kiểm tra trước khi ghi

1. `name` 2–100 ký tự; `phone` khớp `^0\d{9,10}$`; `message` 10–2000 ký tự.
2. Honeypot `website` phải rỗng (bot thường điền ô ẩn).
3. Rate limit theo IP: tối đa 3 lần / 10 phút.
4. Chuyển hướng, mã hóa văn bản (không HTML) để tránh chèn script.

### Luồng

```
validate → INSERT contact_messages → trả Sheets → trả { ok: true }
                     │                     │
                     │ không chặn          │ lỗi → log + giữ bản Supabase
                     ▼                     ▼
                 (bản chính)          (bản sao)
```

> Quy tắc: **Supabase là bản chính.** Sheets chỉ là bản sao để nhân viên tiện theo dõi.
> Nếu Apps Script lỗi, câu hỏi không bị mất.

### Phản hồi cho khách

- Thành công → bảng xanh: *"Đã gửi. Chúng tôi sẽ liên hệ với bạn sớm nhất."*
- Rate limit → *"Bạn gửi quá nhanh. Vui lòng thử lại sau ít phút."*
- Lỗi khác → *"Có lỗi xảy ra. Vui lòng thử lại hoặc gọi 0967.206.095."*
  (không lộ chi tiết kỹ thuật)

## 9.3. Google Apps Script

Người dùng dán đoạn sau vào **Extensions → Apps Script** của file Google Sheets,
rồi **Deploy → Web app** và lấy URL `exec`.

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Form');
  const b = JSON.parse(e.postData.contents);
  sheet.appendRow([
    new Date(),
    b.name, b.phone, b.email || '', b.service_interest, b.message
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Cấu hình Web app:

- *Execute as*: **Me**
- *Who has access*: **Anyone**
- Lấy URL `https://script.google.com/macros/s/<ID>/exec` →
  đặt vào biến `GOOGLE_SHEETS_WEBHOOK` trong `.env.local`.

Cột của sheet `Form`: `Thời gian | Họ tên | SĐT | Email | Dịch vụ | Nội dung`.

Nếu muốn chặn site lạ gọi vào script, kiểm tra header `Origin` hoặc một khoá bí mật
trong query string (`?k=<GOOGLE_SHEETS_SECRET>`).

## 9.4. Newsletter

- Tương tự form: ghi `newsletters` + đẩy 2 cột (`Thời gian`, `Email`)
  sang sheet `Newsletter`.
- Email trùng → trả `{ ok: true, duplicate: true }` (không báo lỗi lộ thông tin).
- Nút Huỷ đăng ký: link `api/newsletter/unsubscribe?email=...` trong mail sau.

## 9.5. Chống spam

| Biện pháp | Mức |
|---|---|
| Honeypot field | Ô ẩn, bot tự điền |
| Rate limit theo IP | 3 lần / 10 phút cho form liên hệ; 5 lần / 10 phút cho newsletter |
| Giới hạn độ dài | Ngay ở server, không tin client |
| Turnstile / hCaptcha | Giai đoạn 2 nếu spam tăng |
| Loại bỏ URL trong message | Chặn link quảng cáo |

## 9.6. Ghi log

Mọi request ghi vào Supabase `audit_log` hoặc log của Vercel:

```
[2026-10-06T10:00:00Z] POST /api/contact 200 ip=... service=prep
[2026-10-06T10:00:01Z] sheets webhook 200
```

Không bao giờ ghi nội dung nhạy cảm (số CCCD, thông tin bệnh) — form không có ô đó.
