# 01 — TỔNG QUAN DỰ ÁN

## 1.1. Chủ đầu tư

**Tổ chức Dựa vào Cộng đồng CBO SÁT CÁNH**

- Thành lập: 04/12/2022
- Lĩnh vực: y tế cộng đồng và thiện nguyện xã hội
- Trọng tâm: chăm sóc sức khỏe, phòng chống HIV/AIDS, hỗ trợ người có hoàn cảnh khó khăn
- Liên hệ:
  - Fanpage: CBO SÁT CÁNH
  - Hotline: 0967.206.095 – 0396.433.095
  - Email: satcanhkg68@gmail.com

## 1.2. Mục tiêu dự án

1. Website giới thiệu tổ chức, dịch vụ và hoạt động, hiển thị trên mọi thiết bị.
2. Trang tin tức / hoạt động để đăng bài, sự kiện, thông báo.
3. Form cho khách hỏi thêm thông tin, dữ liệu ghi vào Google Sheets để nhân viên theo dõi.
4. Hệ quản trị nội dung (CMS) chạy trên web: **admin tự sửa được mọi thứ** — bài viết,
   dịch vụ, đối tác, đội ngũ, banner, màu giao diện — không cần đụng vào code.
5. Cơ sở dữ liệu Supabase làm nơi lưu trung tâm, deploy lên Vercel.

## 1.3. Phạm vi

**Có làm**

- Trang chủ dạng một trang cuộn (anchor) + trang tin tức + trang chi tiết bài + trang liên hệ.
- Trang quản trị `/admin` với 3 vai trò và 9 màn hình.
- Hệ màu động (admin sửa màu → áp dụng cho toàn bộ khách).
- Form liên hệ và form đăng ký nhận tin.
- SEO cơ bản: meta, OG image, sitemap, robots.

**Không làm ở phiên bản đầu**

- Thanh toán, tài khoản thành viên cho khách.
- Bản đa ngôn ngữ (chỉ tiếng Việt).
- Ứng dụng di động riêng.
- Chatbot / AI.

## 1.4. Các bên liên quan

| Vai trò | Người / Nhóm |
|---|---|
| Người ra yêu cầu | Đại diện CBO SÁT CÁNH |
| Người duyệt nội dung | Ban điều hành CBO |
| Người quản trị website | `admin` trong CMS |
| Người đăng bài | `editor` trong CMS |
| Người theo dõi form | `collaborator` trong CMS |
| Kỹ thuật | Lập trình viên triển khai dự án |

## 1.5. Tiêu chí thành công

- Trang hiển thị tốt trên điện thoại (trên 70% lượt truy cập dự kiến).
- Nạp trang chủ dưới 3 giây trên mạng 4G.
- Admin sửa được bài viết, ảnh banner và màu giao diện mà không cần lập trình viên.
- Mỗi câu hỏi trong form hiện ngay trong bảng quản trị và dòng tương ứng trong Google Sheets.
- Website chạy công khai trên miền Vercel, có HTTPS.

## 1.6. Rủi ro đã nhận diện

| Rủi ro | Ảnh hưởng | Cách xử lý |
|---|---|---|
| Ảnh Google Drive bị đổi quyền chia sẻ → ảnh vỡ | Ảnh bài viết không hiện | Chuyển link Drive sang `lh3.googleusercontent.com`, hướng dẫn đặt quyền "ai có đường liên kết cũng xem được" |
| Google Apps Script bị giới hạn tần suất | Mất dòng trong Sheets | Ghi vào Supabase trước (luôn giữ bản chính), Sheets là bản sao; retry đơn giản |
| Quên cấp quyền cho thành viên mới | Không đăng nhập được | Trang admin có màn hình quản lý tài khoản và vai trò |
| Bài viết dài làm chậm trang | Tải trang chậm | Tối ưu ảnh bằng `next/image`, render markdown phía máy chủ |
| Mất dữ liệu khi sửa nhầm | Nội dung sai | Bảng bài viết giữ `status = draft`, có cột `updated_at`, backup định kỳ từ Supabase |
