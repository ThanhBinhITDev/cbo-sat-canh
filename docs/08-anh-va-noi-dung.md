# 08 — ẢNH VÀ NỘI DUNG HÌNH ẢNH

## 8.1. Phân loại ảnh

| Loại | Ví dụ | Nơi lưu | Cách thêm trong CMS |
|---|---|---|---|
| Ảnh bìa bài viết | ảnh tiêu đề tin tức | URL ngoài (Google Drive, ImgBB…) | Dán link |
| Ảnh trong bài | ảnh minh họa markdown | URL ngoài | Dán link |
| Hero trang chủ | ảnh banner lớn | **Supabase Storage** | Kéo-thả |
| Ảnh section trang chủ | CTA, đối tác, background | **Supabase Storage** | Kéo-thả |
| Logo | logo dài, logo không chữ | **Supabase Storage** | Kéo-thả |
| Ảnh trang trí | cây quạt, hoa văn | **Supabase Storage** | Kéo-thả |
| Ảnh đội ngũ | chân dung | **Supabase Storage** hoặc URL | Kéo-thả / dán link |
| Logo đối tác | 10 logo từ Word | **Supabase Storage** (đã nén sẵn) | Chọn trong `/admin/anh` |
| Avatar admin | ảnh cá nhân | URL | Ô URL |

## 8.2. Asset hiện có trên máy

Thư mục `web/`:

| Đường dẫn | Kích thước | Dùng cho |
|---|---|---|
| `logo /logo dài/logodai.png` | 6753 × 1728 | Logo chính (header, footer) |
| `logo /logo không có chữ/logokhongcochu.png` | 3456 × 3455 | Favicon, avatar mạng xã hội |
| `đối tác/*.jpg` (8 file) | 182–2047px | Logo đối tác |

Thư mục cha `CBO SAT CANH/`:

| Đường dẫn | Kích thước | Dùng cho |
|---|---|---|
| `BONHANDIENLOGO.png` | 3508 × 2481 | Ảnh / banner |
| `POSTER.png` | 4961 × 3508 | Ảnh hoạt động |
| `final1-01.png` | 4961 × 3508 | Ảnh nền |
| `final1-02.png` | 3600 × 3600 | Ảnh vuông |
| `PNG/cayquatcuatbArtboard 5@4x.png` | 6753 × 1728 | Ảnh trang trí dạng banner |
| `PNG/cayquatcuatbArtboard 11@4x.png` | 3456 × 3455 | Ảnh trang trí vuông |
| `1x/`, `2x/`, `PDF/` | — | Bản logo màu nền trong suốt (chọn 1–2 bản dùng) |

> Ảnh ở đây rất lớn (5000px+). **Bắt buộc nén trước khi đưa lên web.**

## 8.3. Quy tắc đổi tên file

File hiện tại đang là tên tải từ Facebook, rất khó đọc.
Chuyển về tên không dấu, không khoảng trắng, có số thứ tự:

```
1790989938582_80028..._b0354884ebaa4bd42c23c11e421cc0fb.jpg  →  doi-tac-01.jpg
1790990011789_80028..._dfae3d90478d411e220639249353908f.jpg  →  doi-tac-02.jpg
...
1790990759538_80028..._125c8d84c60df5ea62526ae81f1098af.jpg  →  doi-tac-08.jpg

logo /logo dài/logodai.png               →  logo-cau.png        (còn "logo " có khoảng trắng thừa → đổi)
logo /logo không có chữ/logokhongcochu.png →  logo-vong-tron.png
```

Thứ tự file `doi-tac-01..10` phải khớp với phân nhóm ở
[appendix/nhom-doi-tac.md](./appendix/nhom-doi-tac.md).

## 8.4. Quy tắc nén

| Loại | Chiều rộng mục tiêu | Định dạng | Chất lượng |
|---|---|---|---|
| Hero/banner ngang | 1920px | WebP / AVIF | 80 |
| Ảnh section | 1280px | WebP | 80 |
| Ảnh bìa bài | 1200px (4:3) | WebP | 80 |
| Logo | 512px | PNG (giữ trong suốt) | — |
| Logo đối tác | 320px | WebP/PNG | 90 |
| Chân dung | 640px (vuông) | WebP | 80 |

Dụng cụ: script `scripts/optimize-images.mjs` (sharp) — quét `assets/` và nén vào `public/img/`.

## 8.5. Trong Supabase Storage

```
Bucket: site-assets        (public đọc)
├─ hero/hero-01.webp
├─ logo/logo-cau.webp
├─ logo/logo-vong-tron.png
├─ decoration/cay-quat-banner.webp
├─ partners/doi-tac-01.webp ... doi-tac-10.webp
└─ team/avatar-01.webp
```

Quyền bucket: `SELECT` cho mọi người, `INSERT/UPDATE/DELETE` chỉ cho người đã đăng nhập
(đồng thời kiểm tra `role = 'admin'` ở tầng giao diện).

## 8.6. Chuyển link Google Drive

Người dùng dán 1 trong 4 kiểu link:

| Link dán vào | Chuyển thành |
|---|---|
| `https://drive.google.com/file/d/ID/view?usp=sharing` | `https://lh3.googleusercontent.com/d/ID=w1200` |
| `https://drive.google.com/open?id=ID` | `https://lh3.googleusercontent.com/d/ID=w1200` |
| `https://drive.google.com/uc?id=ID` | `https://lh3.googleusercontent.com/d/ID=w1200` |
| `https://i.imgur.com/xxxx.jpg` | giữ nguyên |

Lưu ý quan trọng cho người dùng: file Drive phải đặt
**"Ai có đường liên kết cũng xem được"**, nếu không ảnh sẽ trắng.
CMS có cảnh báo khi phát hiện link Drive chưa chuyển được.

## 8.7. alt text

- Mọi ảnh bắt buộc có `alt` khi lưu trong CMS (cảnh báo nếu để trống).
- Ảnh trang trí thuần → `alt = ""` (để trình đọc màn hình bỏ qua).
- Logo → `alt = "Logo CBO Sát Cánh"` / `alt = "Logo <tên đối tác>"`.

## 8.8. Tích hợp với `next/image`

- Khai báo `remotePatterns` cho `lh3.googleusercontent.com`, `i.imgur.com`,
  `drive.google.com`, `zepcevn.com` (nếu có), và domain Supabase Storage.
- Hero dùng `priority` + `sizes="100vw"`.
- Ảnh bài dùng `sizes="(max-width: 768px) 100vw, 66vw"`.
- Không dùng `next/image` cho ảnh trong markdown render nội bộ (dùng thẻ `<img>`
  có `loading="lazy"` để tránh lỗi cấu hình).
