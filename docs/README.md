# TÀI LIỆU DỰ ÁN — WEBSITE CBO SÁT CÁNH

Thư mục này chứa toàn bộ mô tả, yêu cầu và quyết định thiết kế của dự án.
Đọc theo thứ tự số đầu tên file.

## Mục lục

| # | File | Nội dung |
|---|------|----------|
| 1 | [01-tong-quan-du-an.md](./01-tong-quan-du-an.md) | Tổng quan, mục tiêu, phạm vi, các bên liên quan |
| 2 | [02-yeu-cau-chi-tiet.md](./02-yeu-cau-chi-tiet.md) | Yêu cầu chi tiết (nội dung gốc từ Word + yêu cầu bổ sung) |
| 3 | [03-kien-truc-he-thong.md](./03-kien-truc-he-thong.md) | Kiến trúc, stack công nghệ, cấu trúc thư mục |
| 4 | [04-co-so-du-lieu.md](./04-co-so-du-lieu.md) | Cấu trúc bảng (schema), khóa chính, quan hệ, index |
| 5 | [05-trang-khach.md](./05-trang-khach.md) | Các trang hiển thị cho khách, thành phần từng section |
| 6 | [06-trang-admin-cms.md](./06-trang-admin-cms.md) | Trang quản trị `/admin`, các màn hình, luồng thao tác |
| 7 | [07-he-mau-giao-dien.md](./07-he-mau-giao-dien.md) | Hệ màu (theme) động: admin sửa → áp dụng cho mọi khách |
| 8 | [08-anh-va-noi-dung.md](./08-anh-va-noi-dung.md) | Quản lý ảnh, asset, quy tắc đổi tên và tối ưu ảnh |
| 9 | [09-api-form-va-tin.md](./09-api-form-va-tin.md) | API form liên hệ, newsletter, tích hợp Google Sheets |
| 10 | [10-phan-quyen-va-bao-mat.md](./10-phan-quyen-va-bao-mat.md) | 3 vai trò, chính sách RLS, kiểm tra truy cập |
| 11 | [11-deploy-va-moi-truong.md](./11-deploy-va-moi-truong.md) | Supabase, Vercel, biến môi trường, quy trình triển khai |
| 12 | [12-kenh-lam-viec-roadmap.md](./12-kenh-lam-viec-roadmap.md) | Các bước triển khai theo thứ tự (roadmap) |
| 13 | [13-danh-sach-can-cung-cap.md](./13-danh-sach-can-cung-cap.md) | Danh sách thông tin cần khách hàng cung cấp |

## Phụ lục

| File | Nội dung |
|------|----------|
| [appendix/noi-dung-tu-docx.txt](./appendix/noi-dung-tu-docx.txt) | Toàn bộ văn bản trích xuất từ file `THÔNG TIN LÀM Website.docx` |
| [appendix/nhom-doi-tac.md](./appendix/nhom-doi-tac.md) | Phân nhóm logo đối tác theo file Word |

## Quyết định đã chốt (không thay đổi khi chưa có đồng thuận)

- **Stack**: Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- **Cơ sở dữ liệu**: Supabase (PostgreSQL, Auth, Storage)
- **Triển khai**: Vercel
- **Ngôn ngữ**: Tiếng Việt
- **Form liên hệ**: lưu vào Supabase **và** đẩy sang Google Sheets
- **Ảnh bài viết**: dán URL bên ngoài (Google Drive / dịch vụ lấy link)
- **Ảnh banner, hero, trang trí**: lưu trong Supabase Storage, admin sửa qua CMS
- **Phân quyền**: `admin`, `editor`, `collaborator`
- **Bộ màu mặc định**: `#279CD7`, `#1C4592`, `#454C56`
