# 05 — TRANG KHÁCH (PUBLIC)

Toàn bộ chữ hiển thị lấy từ `site_settings` và các bảng dữ liệu.
Sửa trong CMS → cập nhật ngay trên trang.

## 5.1. Điều hướng

**Header (bám trên đỉnh trang)**

```
[Logo]    Trang chủ · Giới thiệu · Dịch vụ · Tin tức · Đội ngũ · Đối tác · Liên hệ
                                                          [Hotline] [Nhắn tin hỏi thêm]
```

| Breakpoint | Hành vi |
|---|---|
| ≥ 1024px | Hiện đủ menu trên một dòng |
| < 1024px | Nút hamburger → menu trượt từ trái, kèm nút gọi và Zalo |

Logo lấy từ `media` kind = `logo` (chuẩn bị 2 bản: logo dài, logo không chữ).
Header trong suốt ở đầu trang, có nền trắng + đổ bóng sau khi cuộn.

## 5.2. Trang chủ `/` — một trang cuộn

| # | Section | Nguồn dữ liệu | Thành phần |
|---|---|---|---|
| 1 | **Hero** | `site_settings.hero` | Ảnh nền + tiêu đề + phụ đề + 2 nút (Nhận tư vấn / Xem dịch vụ) |
| 2 | **Giới thiệu** | `site_settings.about` | 2 đoạn văn + số liệu nổi bật (2022, 4 dịch vụ, …) |
| 3 | **Tầm nhìn · Sứ mệnh · Giá trị** | `vision`, `mission`, `values` | 3 thẻ, icon khác nhau |
| 4 | **Dịch vụ** | bảng `services` | 4 card, icon + tên + mô tả, hover nổi |
| 5 | **Tin tức & Hoạt động nổi bật** | `posts` where `is_featured` | 3 thẻ: ảnh bìa, ngày, tiêu đề, tóm tắt |
| 6 | **Đối tác** | bảng `partners` | 3 khối theo nhóm, slider logo trượt |
| 7 | **Đội ngũ** | bảng `team_members` | Carousel avatar + tên + chức danh |
| 8 | **Câu hỏi?** | — | Khung CTA lớn → form liên hệ, 2 nút Messenger / Zalo |
| 9 | **Bản đồ & Liên hệ** | `site_settings.map`, `contact` | Google Maps nhúng + hotline + email |
| 10 | **Footer** | `site_settings.footer` | Logo, liên hệ, menu, dòng bản quyền |

**Nút nổi cố định (cả desktop lẫn mobile)**

```
        ┌──────────────────┐
        │ ☎ 0967.206.095   │  ← bấm là gọi
        │ 💬 Zalo           │
        │ 𝐅 Messenger       │
        │ ✉ Hỏi thêm (form) │
        └──────────────────┘
```

Cột phải, giữa màn hình trên desktop; thanh ngang dưới đáy trên mobile (tránh che nội dung).

## 5.3. `/tin-tuc` — Danh sách bài viết

- Bộ lọc theo `category`: `Tất cả · Tin tức · Hoạt động`.
- Thẻ bài viết: ảnh bìa (4:3), ngày đăng, danh mục, tiêu đề, tóm tắt.
- Phân trang 12 bài/trang, URL `?trang=2`.
- Không có bài → trạng thái rỗng thân thiện: *"Chưa có bài viết nào. Hãy quay lại sau."*

## 5.4. `/tin-tuc/[slug]` — Chi tiết bài

- Breadcrumb: `Trang chủ / Tin tức / [Tiêu đề]`
- Ảnh bìa lớn, tiêu đề, ngày, tác giả (tên trong `profiles`)
- Nội dung markdown render (tiêu đề h2/h3, đoạn, danh sách, ảnh, bảng)
- Nút chia sẻ Facebook + copy link
- 3 bài liên quan cùng danh mục ở cuối
- SEO: `title`, `description`, OG image (ảnh bìa), JSON-LD `Article`

Đường dẫn không dấu, không khoảng trắng: `"Xét nghiệm nhanh HIV" → /tin-tuc/xet-nhanh-nhanh-hiv`.

## 5.5. `/lien-he`

Bố cục 2 cột (1 cột trên mobile):

| Cột trái | Cột phải |
|---|---|
| Tiêu đề + mô tả | **Form**: Họ tên · SĐT · Email · Dịch vụ (dropdown) · Nội dung · nút Gửi |
| Hotline, Email, Fanpage | Nút "Nhắn qua Messenger" và "Nhắn qua Zalo" |
| Thời gian hoạt động | |
| Bản đồ nhúng | |

Trạng thái form:

1. **Đang gửi** → nút quay vòng, các ô bị khóa.
2. **Thành công** → bảng xanh: *"Đã gửi. Chúng tôi sẽ liên hệ lại với bạn sớm nhất."*
3. **Thất bại** → bảng đỏ + nút gửi lại.
4. **Chống gửi trùng** — nút khóa 20 giây sau lần gửi đầu.

## 5.6. Đăng ký nhận tin (Newsletter)

Ô email nhỏ ở footer và ở section CTA.

```
Email của bạn  [Đăng ký]
```

- Bắt buộc đúng định dạng email.
- Trùng email → trả lời *"Bạn đã đăng ký rồi"* (không lộ lỗi).
- Không hiển thị danh sách người đăng ký.

## 5.7. Yêu cầu kỹ thuật chung

| Hạng mục | Yêu cầu |
|---|---|
| Responsive | Kiểm tra ở 360px, 768px, 1280px, 1920px |
| Tốc độ | LCP < 2.5s trên 4G; ảnh bìa ≤ 300KB |
| SEO | Một H1 mỗi trang, title < 60 ký tự, description < 160 ký tự |
| Truy cập | Đủ màu tương phản 4.5:1, mọi nút bấm được, ảnh có `alt` |
| Bảo mật | Form không lộ lỗi nội bộ; form có honeypot |
| Ngôn ngữ | Tiếng Việt, dấu đầy đủ, font hỗ trợ dấu |
