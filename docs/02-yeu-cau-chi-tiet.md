# 02 — YÊU CẦU CHI TIẾT

Nguồn: file `THÔNG TIN LÀM  Website.docx` + trao đổi với khách hàng.
Bản gốc trích xuất tại [appendix/noi-dung-tu-docx.txt](./appendix/noi-dung-tu-docx.txt).

## 2.1. Nội dung bắt buộc (lấy nguyên từ Word)

### Giới thiệu tổ chức

> Tổ chức Dựa vào Cộng đồng CBO Sát Cánh được thành lập ngày 04/12/2022, hoạt động trong
> lĩnh vực y tế cộng đồng và thiện nguyện xã hội. Với tinh thần sẻ chia, trách nhiệm và nhân ái,
> CBO Sát Cánh luôn nỗ lực kết nối nguồn lực, đồng hành cùng cộng đồng trong công tác chăm sóc
> sức khỏe, phòng chống HIV/AIDS, hỗ trợ những người có hoàn cảnh khó khăn và lan tỏa những giá
> trị tích cực đến xã hội.
>
> CBO Sát Cánh tin rằng mỗi hành động yêu thương, dù nhỏ bé, đều có thể tạo nên những thay đổi
> ý nghĩa cho cộng đồng.

### Tầm nhìn

> Tổ chức hoạt động hiệu quả, uy tín và bền vững trong lĩnh vực y tế cộng đồng và thiện nguyện
> xã hội; góp phần xây dựng một cộng đồng khỏe mạnh, bình đẳng, nhân ái, không kỳ thị và không
> ai bị bỏ lại phía sau.

### Sứ mệnh

> Nâng cao sức khỏe cộng đồng, đồng hành cùng người yếu thế và lan tỏa yêu thương thông qua
> các hoạt động y tế và thiện nguyện xã hội.

### Giá trị cốt lõi

1. Lắng nghe, đồng hành
2. Quan tâm, thấu hiểu

### Dịch vụ

| # | Tên dịch vụ |
|---|---|
| 1 | Xét nghiệm nhanh HIV/STIs |
| 2 | Dự phòng trước phơi nhiễm HIV (PrEP) |
| 3 | Dự phòng sau phơi nhiễm HIV (PEP) |
| 4 | Chuyển gửi điều trị HIV (ARV) |

### Liên hệ

| Loại | Giá trị |
|---|---|
| Fanpage | CBO SÁT CÁNH |
| Hotline | 0967.206.095 – 0396.433.095 |
| Email | satcanhkg68@gmail.com |

### Đối tác (3 nhóm, xem [appendix/nhom-doi-tac.md](./appendix/nhom-doi-tac.md))

1. **ĐỐI TÁC CHIẾN LƯỢC CHÍNH** — phụ đề "Nền tảng thành công của CBO SÁT CÁNH" — 6 logo
2. **PHÒNG KHÁM NHÀ MÌNH** — 3 logo
3. **MẠNG LƯỚI CBO ĐỒNG BẰNG SÔNG CỬU LONG** — 1 logo

## 2.2. Yêu cầu bổ sung do khách hàng đề xuất

### Yêu cầu 1 — Form cho khách hỏi thêm

Trong Word có câu: *"Mình làm kiểu này đc ko, cho khách muốn hỏi thêm về thông tin"*
kèm một ảnh mẫu form.

**Quyết định:** làm form với các trường

| Trường | Bắt buộc | Kiểu |
|---|---|---|
| Họ và tên | Có | Text |
| Số điện thoại | Có | Tel, 10-11 số |
| Email | Không | Email |
| Dịch vụ quan tâm | Có | Dropdown: Xét nghiệm nhanh HIV/STIs · PrEP · PEP · Chuyển gửi điều trị ARV · Hợp tác / Đề xuất khác |
| Nội dung câu hỏi | Có | Textarea |

Kèm nút chuyển tiếp nhanh sang **Messenger Facebook** và **Zalo** để khách nhắn trực tiếp.

### Yêu cầu 2 — Công nghệ

Đã chốt: **Next.js + Tailwind CSS**, cơ sở dữ liệu **Supabase**, deploy **Vercel**.

### Yêu cầu 3 — Form gửi đi đâu

Đã chốt: **Lưu vào Google Sheets**.
Bản sao lưu tại Supabase để hiển thị trong trang quản trị.

### Yêu cầu 4 — Trang quản trị CMS

> *"Tôi muốn trang này có cơ sở dữ liệu để thành một trang admin CMS có thể tuỳ chỉnh mọi
> chức năng, csdl tôi muốn dùng Supabase và deploy bằng Vercel."*

**Màn hình quản trị (đã chốt)**

1. Bài viết & Tin tức
2. Dịch vụ + Đối tác + Đội ngũ
3. Banner / Ảnh trang chủ + nội dung tĩnh (tầm nhìn, sứ mệnh, liên hệ)
4. Newsletter + form liên hệ (xem và theo dõi)

### Yêu cầu 5 — Vai trò người dùng

Ba vai trò, không chỉ một admin:

| Vai trò | Quyền |
|---|---|
| `admin` | Toàn quyền: mọi nội dung, thiết lập, tài khoản |
| `editor` | Chỉ viết/sửa bài viết, tin tức, ảnh bài viết |
| `collaborator` | Chỉ xem bảng câu hỏi liên hệ và danh sách đăng ký nhận tin |

### Yêu cầu 6 — Hệ màu tùy chỉnh

> *"Bộ màu nhận diện: `#279CD7`, `#1C4592`, `#454C56`. Mặc định là bộ này, nhưng trang cần
> chỉnh được giao diện màu sắc. Khách thì lưu trên máy họ, còn admin thì chỉnh lưu ở cơ sở dữ
> liệu áp dụng cho tất cả user."*

**Ba lớp màu:**

1. **Mặc định** — bảng màu nhận diện, nằm trong mã nguồn.
2. **Toàn cục (admin)** — admin đổi màu trong CMS, lưu vào Supabase, áp dụng cho mọi khách.
3. **Cá nhân (khách)** — khách tự chỉnh, lưu trong `localStorage`, chỉ áp dụng trên máy người đó.

Chi tiết ở [07-he-mau-giao-dien.md](./07-he-mau-giao-dien.md).

### Yêu cầu 7 — Nơi lưu ảnh

> *"Riêng các ảnh không phải bài viết thì lưu ở cơ sở dữ liệu hoặc bộ nhớ Supabase, admin có thể
> tuỳ chỉnh ảnh đó thông qua trang admin CMS."*

**Chia hai loại:**

| Loại ảnh | Nơi lưu | Cách admin thêm |
|---|---|---|
| Ảnh bìa bài viết, ảnh trong bài | URL bên ngoài (Google Drive, dịch vụ lấy link) | Dán link vào ô |
| Hero, banner, logo, ảnh trang trí, ảnh đội ngũ | **Supabase Storage** | Kéo-thả trong CMS |

Chi tiết ở [08-anh-va-noi-dung.md](./08-anh-va-noi-dung.md).

### Yêu cầu 8 — Mục bổ sung trên trang

Đã chốt thêm:

- Tin tức / Hoạt động
- Đội ngũ (Ban điều hành)
- Đăng ký nhận tin (Newsletter)
- Bài viết (blog) — nền tảng cho CMS
- Bản đồ / Địa chỉ hoạt động

## 2.3. Câu hỏi còn mở

| # | Câu hỏi | Cần ai trả lời | Ảnh hưởng |
|---|---|---|---|
| 1 | Địa chỉ / các điểm hoạt động để nhúng Google Maps? | Khách hàng | Mục Bản đồ |
| 2 | Đường link Fanpage và link Zalo? | Khách hàng | Nút liên hệ nhanh |
| 3 | Danh sách email admin đầu tiên? | Khách hàng | Tạo tài khoản CMS |
| 4 | URL Supabase, anon key, service role key? | Khách hàng | Kết nối database |
| 5 | Tên file Google Sheets và tên sheet nhận form? | Khách hàng | Kết nối Apps Script |
| 6 | Nội dung chi tiết trong ảnh mẫu form? | Khách hàng | Câu hỏi 1 đã chốt phần lớn |
