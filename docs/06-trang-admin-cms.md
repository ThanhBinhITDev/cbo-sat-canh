# 06 — TRANG QUẢN TRỊ `/ADMIN`

## 6.1. Đăng nhập `/admin/login`

- Ô: **Email**, **Mật khẩu** → nút Đăng nhập.
- Đăng nhập qua Supabase Auth.
- Sai thông tin → thông báo chung: *"Email hoặc mật khẩu không đúng"* (không nói rõ email có tồn tại).
- Sau khi vào, middleware kiểm tra `profiles.is_active` và lấy `role`.
- Người chưa có tài khoản → trang *"Tài khoản chưa được cấp quyền. Vui lòng liên hệ quản trị viên."*
- Nút "Quên mật khẩu" gửi email đặt lại (Supabase Auth).

## 6.2. Bố cục sau đăng nhập

```
┌─────────────┬──────────────────────────────────────────────┐
│ CBO SÁT CÁNH│  Thanh tìm kiếm    [Thông báo] [👤 Tên · role]│
├─────────────┼──────────────────────────────────────────────┤
│ 📊 Dashboard│                                              │
│ 📝 Bài viết │            Nội dung màn hình                │
│ 🩺 Dịch vụ  │                                              │
│ 🤝 Đối tác  │                                              │
│ 👥 Đội ngũ  │                                              │
│ 🖼 Nội dung  │                                              │
│ 🎨 Giao diện│                                              │
│ 📸 Ảnh      │                                              │
│ ❓ Câu hỏi  │                                              │
│ ✉ Newsletter│                                              │
│ 👤 Tài khoản│                                              │
│ ─────────── │                                              │
│ ⚙ Cài đặt  │                                              │
│ ↩ Đăng xuất │                                              │
└─────────────┴──────────────────────────────────────────────┘
```

Mobile: sidebar ẩn, mở bằng nút ☰, trượt từ trái.

## 6.3. Ma trận màn hình × vai trò

| Màn hình | URL | admin | editor | collaborator |
|---|---|---|---|---|
| Dashboard | `/admin` | ✅ | ✅ | ✅ (chỉ xem) |
| Bài viết & Tin tức | `/admin/bai-viet` | ✅ | ✅ | ❌ |
| Dịch vụ | `/admin/dich-vu` | ✅ | ❌ | ❌ |
| Đối tác | `/admin/doi-tac` | ✅ | ❌ | ❌ |
| Đội ngũ | `/admin/doi-ngu` | ✅ | ❌ | ❌ |
| Nội dung tĩnh | `/admin/noi-dung` | ✅ | ❌ | ❌ |
| Giao diện / màu | `/admin/giao-dien` | ✅ | ❌ | ❌ |
| Quản lý ảnh | `/admin/anh` | ✅ | ✅ (chỉ ảnh bài viết) | ❌ |
| Câu hỏi liên hệ | `/admin/cau-hoi` | ✅ | ✅ | ✅ (chỉ xem) |
| Newsletter | `/admin/newsletter` | ✅ | ❌ | ✅ (chỉ xem) |
| Tài khoản & vai trò | `/admin/tai-khoan` | ✅ | ❌ | ❌ |

Cách kiểm tra: component `CanAccess role={["admin"]}` chặn phía client **và**
middleware chặn phía server **và** RLS chặn phía database (3 lớp).

## 6.4. Chi tiết từng màn hình

### Dashboard `/admin`

- 4 thẻ: Câu hỏi mới (`status = new`), Bài đã xuất bản, Bài nháp, Người đăng ký nhận tin.
- Bảng **Câu hỏi mới nhất** (5 dòng): tên, SĐT, dịch vụ, thời gian, nút *Đã trả lời*.
- **Hoạt động gần đây**: ai sửa gì lúc nào (dùng `audit_log`, giai đoạn 2).

### Bài viết `/admin/bai-viet`

- Bảng: Tiêu đề · Danh mục · Trạng thái · Tác giả · Ngày cập nhật · thao tác.
- Bộ lọc: danh mục, trạng thái. Ô tìm kiếm theo tiêu đề.
- Nút **+ Bài viết mới** → `/admin/bai-viet/moi`.

**Trình soạn thảo**

| Ô | Bắt buộc | Ghi chú |
|---|---|---|
| Tiêu đề | ✅ | Tự sinh `slug` khi gõ, sửa được tay |
| Danh mục | ✅ | Tin tức / Hoạt động |
| Ảnh bìa | ❌ | Dán URL hoặc chọn từ `media` |
| Tóm tắt | ❌ | Tối đa 200 ký tự, hiện ở thẻ danh sách |
| Nội dung | ✅ | Markdown + thanh công cụ (đậm, nghiêng, heading, list, ảnh, link, bảng) |
| Xuất bản nổi bật | ❌ | Đưa lên trang chủ |
| SEO title / description | ❌ | Ô riêng, có bộ đếm ký tự |
| Trạng thái | ✅ | Nháp / Xuất bản |

Nút: **Lưu nháp** · **Xuất bản** · **Xem trước**.
Xoá bài nằm ở **danh sách** `/admin/bai-viet`, chỉ `admin` thấy nút này.

### Dịch vụ `/admin/dich-vu`

Danh sách kéo-thả sắp xếp. Mỗi dòng: tiêu đề, mô tả, icon (chọn từ danh sách),
màu thẻ, công tắc bật/tắt. Thêm/sửa trong bảng trượt (drawer) bên phải.

### Đối tác `/admin/doi-tac`

Ba tab theo nhóm. Thêm: tên, logo (URL), link website, thứ tự, bật/tắt.

### Đội ngũ `/admin/doi-ngu`

Thêm: họ tên, chức danh, ảnh đại diện (URL hoặc upload), tiểu sử ngắn.

### Nội dung tĩnh `/admin/noi-dung`

Các thẻ accordion, mỗi thẻ một phần:

| Thẻ | Trường |
|---|---|
| Giới thiệu | 2 đoạn văn |
| Tầm nhìn | 1 đoạn |
| Sứ mệnh | 1 đoạn |
| Giá trị cốt lõi | Danh sách thêm/xoá được (mỗi mục 1 dòng) |
| Liên hệ | Hotline (nhiều số), email, link Fanpage, link Zalo, địa chỉ |
| Bản đồ | Mã nhúng Google Maps |
| Footer | Câu bản quyền, menu phụ |

Mỗi thẻ có nút **Lưu**, có cảnh báo chưa lưu khi rời trang.

### Giao diện `/admin/giao-dien` (chi tiết ở [07](./07-he-mau-giao-dien.md))

- 6 ô màu: Chính, Đậm, Chữ, Nền, Nền phụ, Màu nhấn.
- Than trượt: bo góc (0–32px), cỡ chữ (90%–120%).
- **Xem thử** ngay trên trang admin.
- Nút **Khôi phục màu nhận diện** (`#279CD7`, `#1C4592`, `#454C56`).
- Nút **Lưu áp dụng cho toàn bộ trang**.

### Quản lý ảnh `/admin/anh`

- Lưới thumbnail, lọc theo `kind`.
- **Tải lên**: kéo-thả → Supabase Storage bucket `site-assets` → lưu `media`.
- **Thêm URL**: dán link Google Drive / dịch vụ lấy link (tự chuyển sang link ảnh).
- Nhấp vào ảnh → hộp thoại: preview, ô `alt`, nút **Copy URL**.
- Biên tập viên chỉ sửa được `alt` của ảnh do mình tải lên; đổi loại ảnh
  (banner/logo/trang trí) và **Xoá** chỉ dành cho `admin`.

### Câu hỏi liên hệ `/admin/cau-hoi`

- Bảng: Tên · SĐT · Dịch vụ · Nội dung (cắt bớt) · Trạng thái · Thời gian.
- Bộ lọc: Tất cả / Mới / Đã trả lời / Đã lưu trữ.
- Dòng mới có chấm xanh.
- Click dòng → panel chi tiết: toàn bộ nội dung, nút **Gọi** (tel:), **Nhắn Zalo**,
  **Đánh dấu đã trả lời**, **Lưu trữ**.

### Newsletter `/admin/newsletter`

- Danh sách email + ngày đăng ký + nguồn.
- Nút **Xuất CSV**, **Xoá đã chọn**.
- Chỉ `admin` xoá được; `collaborator` chỉ xem và xuất.

### Tài khoản `/admin/tai-khoan` (chỉ admin)

- Bảng: Tên · Email · Vai trò · Trạng thái · Ngày tạo.
- Thêm thành viên: nhập tên, email, mật khẩu tạm → tạo user Supabase + `profiles`.
- Đổi vai trò ngay trong bảng (hộp chọn).
- Khóa tài khoản: `is_active = false` → bị đá ra lần đăng nhập sau.
- Không cho tự đổi vai trò của chính mình.

## 6.5. Hành vi chung của admin

| Hạng mục | Quy tắc |
|---|---|
| Chưa đăng nhập | Chuyển về `/admin/login` |
| Vai trò không đủ | Trang 403: *"Bạn không có quyền thực hiện thao tác này"* |
| Hành động nguy hiểm | Hộp thoại xác nhận 2 bước (Xoá, Xuất bản loạt) |
| Tự động lưu nháp | Form dài lưu local mỗi 30 giây, khôi phục khi quay lại |
| Toast | Thành công / lỗi hiện góc dưới phải, tự biến mất sau 4 giây |
| Tải trang | Nút bấm hiện trạng thái đang tải, không bấm hai lần |
