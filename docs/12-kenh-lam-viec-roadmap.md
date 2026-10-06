# 12 — LỘ TRÌNH TRIỂN KHAI

## Giai đoạn 0 — Chuẩn bị (cần kết nối Supabase)

| # | Việc | Kết quả |
|---|---|---|
| 0.1 | Kết nối MCP Supabase | Truy cập database từ phiên làm việc |
| 0.2 | Tạo repo GitHub, commit tài liệu | Repo có sẵn bản mô tả |
| 0.3 | Nạp thông tin `.env.local` | Dự án chạy được `npm run dev` |
| 0.4 | Thu thập danh sách cần cung cấp | Xong [13-danh-sach-can-cung-cap.md](./13-danh-sach-can-cung-cap.md) |

## Giai đoạn 1 — Khung dự án

| # | Việc | Kiểm chứng |
|---|---|---|
| 1.1 | `create-next-app` (TS, Tailwind, App Router) | `npm run dev` chạy |
| 1.2 | Cấu hình font Be Vietnam Pro, biến màu mặc định | Trang trống hiện đúng màu |
| 1.3 | Kết nối Supabase (client, server, middleware) | `npm run build` không lỗi |
| 1.4 | Tạo migration đầu tiên (10 bảng + RLS) | Chạy thành công trên Supabase |
| 1.5 | Seed nội dung từ Word + 10 logo đối tác | Bảng có dữ liệu |

## Giai đoạn 2 — Trang khách

| # | Việc | Kiểm chứng |
|---|---|---|
| 2.1 | Header + Footer + nút nổi liên hệ | Responsive 360/768/1280 |
| 2.2 | Hero + Giới thiệu + Tầm nhìn/Sứ mệnh/Giá trị | Chữ lấy từ database |
| 2.3 | Section Dịch vụ (4 card) | Đổi tên dịch vụ trong CMS → trang đổi theo |
| 2.4 | Section Tin tức nổi bật | Lấy 3 bài `is_featured` |
| 2.5 | Section Đối tác (3 nhóm, slider) | 10 logo hiển thị đủ |
| 2.6 | Section Đội ngũ (carousel) | Kéo được trên mobile |
| 2.7 | Section CTA + Bản đồ + Footer | Maps nhúng hiển thị |

## Giai đoạn 3 — Bài viết & SEO

| # | Việc | Kiểm chứng |
|---|---|---|
| 3.1 | Trang `/tin-tuc` (lọc, phân trang) | Lọc theo danh mục đúng |
| 3.2 | Trang `/tin-tuc/[slug]` render markdown | Ảnh trong bài hiển thị |
| 3.3 | SEO: metadata, OG, sitemap, robots, JSON-LD | Kiểm tra bằng validator |
| 3.4 | Trang 404 | Hiện gợi ý bài viết liên quan |

## Giai đoạn 4 — Form & Newsletter

| # | Việc | Kiểm chứng |
|---|---|---|
| 4.1 | `/api/contact` (validate + honeypot + rate limit) | Gửi 6 lần liên tiếp bị chặn ở lần 4 |
| 4.2 | Ghi `contact_messages` | Dòng hiện trong Supabase |
| 4.3 | Đẩy Google Sheets qua Apps Script | Dòng mới hiện trong sheet |
| 4.4 | Form `/lien-he` + trạng thái gửi | Thông báo đúng từng trường hợp |
| 4.5 | Newsletter (footer + CTA) | Email trùng được xử lý khéo |

## Giai đoạn 5 — Hệ màu động

| # | Việc | Kiểm chứng |
|---|---|---|
| 5.1 | Biến CSS từ `site_settings.theme` phía server | Không nhấp nháy khi tải |
| 5.2 | Bảng màu trong admin `/admin/giao-dien` | Lưu → trang khách đổi màu |
| 5.3 | Nút chỉnh màu cho khách + `localStorage` | Đổi màu, reload vẫn giữ |
| 5.4 | Nút "Khôi phục mặc định" | Về lại màu admin |
| 5.5 | Kiểm tra tương phản màu | ≥ 4.5:1 |

## Giai đoạn 6 — Trang quản trị

| # | Việc | Kiểm chứng |
|---|---|---|
| 6.1 | `/admin/login` + middleware | Chưa đăng nhập bị đá ra |
| 6.2 | Bố cục admin (sidebar, header, toast) | Chạy tốt trên mobile |
| 6.3 | Dashboard | 4 thẻ số liệu đúng |
| 6.4 | CRUD Bài viết (editor markdown) | Đăng 1 bài → hiện ở `/tin-tuc` |
| 6.5 | CRUD Dịch vụ / Đối tác / Đội ngũ | Kéo-thả sắp xếp hoạt động |
| 6.6 | Nội dung tĩnh (giới thiệu, tầm nhìn…) | Sửa → trang khách đổi |
| 6.7 | Quản lý ảnh (upload Supabase Storage) | Ảnh hiện ngay sau khi tải |
| 6.8 | Câu hỏi liên hệ | Đánh dấu đã trả lời |
| 6.9 | Newsletter (xem, xuất CSV) | File CSV mở được |
| 6.10 | Tài khoản & vai trò (chỉ admin) | Đổi vai trò có hiệu lực ngay |
| 6.11 | Phân quyền 3 lớp | Kiểm tra theo [10 §10.7](./10-phan-quyen-va-bao-mat.md) |

## Giai đoạn 7 — Nghiệm thu & Triển khai

| # | Việc | Kiểm chứng |
|---|---|---|
| 7.1 | `npm run lint` + `npm run typecheck` | Không lỗi |
| 7.2 | `npm run build` | Build xanh |
| 7.3 | Kiểm thử thủ công theo checklist | Xong checklist bên dưới |
| 7.4 | Nén toàn bộ ảnh (`npm run images`) | Không ảnh > 300KB |
| 7.5 | Push GitHub → Vercel Preview | Site Preview chạy |
| 7.6 | Ghép domain, cấu hình env Production | Site thật chạy HTTPS |
| 7.7 | Bàn giao + hướng dẫn admin | Khách sửa được bài không cần lập trình viên |

## Checklist nghiệm thu

- [ ] Trang chủ hiển thị đủ 10 section
- [ ] Mobile 360px: không tràn ngang, menu mở được
- [ ] Gọi hotline bằng nút trên điện thoại
- [ ] Form liên hệ ghi vào Supabase **và** Google Sheets
- [ ] Đăng 1 bài viết → hiện ở `/tin-tuc` và có link SEO
- [ ] Admin sửa màu → mở tab ẩn danh thấy màu mới
- [ ] Khách chỉnh màu → reload vẫn giữ, bấm khôi phục thì về mặc định
- [ ] `editor` không thấy / không vào được màn hình Giao diện và Tài khoản
- [ ] `collaborator` xem được câu hỏi nhưng không sửa được bài
- [ ] Tải ảnh banner lên CMS → trang chủ hiển thị
- [ ] Lighthouse Performance ≥ 85 trên trang chủ
- [ ] Không có biến bí mật nào trong mã đã commit

## Ước lượng thời gian

| Giai đoạn | Thời gian |
|---|---|
| 0 — Chuẩn bị | 0.5 ngày |
| 1 — Khung dự án | 0.5 ngày |
| 2 — Trang khách | 1.5 ngày |
| 3 — Bài viết & SEO | 0.5 ngày |
| 4 — Form & Newsletter | 0.5 ngày |
| 5 — Hệ màu động | 0.5 ngày |
| 6 — Trang quản trị | 2 ngày |
| 7 — Nghiệm thu & deploy | 1 ngày |
| **Tổng** | **≈ 7 ngày làm việc** |
