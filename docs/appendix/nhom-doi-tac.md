# PHỤ LỤC — PHÂN NHÓM LOGO ĐỐI TÁC

Nguồn: `THÔNG TIN LÀM  Website.docx`.

Tổng 10 logo trong file Word, chia 3 nhóm. Thư mục `web/đối tác/` hiện có **8 file**,
nên còn thiếu 2 logo — xem mục 3.

## 1. ĐỐI TÁC CHIẾN LƯỢC CHÍNH

Phụ đề: **"Nền tảng thành công của CBO SÁT CÁNH"** — 6 logo.

| # | Trong file Word | Ảnh có trong folder |
|---|---|---|
| 1 | `image2.jpeg` 700×400 | ⚠️ chưa khớp chính xác |
| 2 | `image3.jpeg` 284×270 | ✅ `...5ff1535a5dc621a625891eccde93b432.jpg` (284×270) |
| 3 | `image4.jpeg` 424×471 | ⚠️ chưa khớp chính xác |
| 4 | `image5.jpeg` 182×179 | ✅ `...d6a9185796d6a25177db8e5547c73e1f.jpg` (182×179) |
| 5 | `image6.jpeg` 400×400 | ❌ không có file cùng kích thước |
| 6 | `image7.png` 591×591 | ✅ `...125c8d84c60df5ea62526ae81f1098af.jpg` (591×591) |

Nguồn link trong Word (dùng để tải 2 logo còn thiếu):

1. `https://static.ybox.vn/2020/4/2/1588063085896-50f7aa90-9c47-11e7-91af-56c566ee3692.jpg`
2. `https://vusta.vnmediacdn.com/images/2024/04/03/9917-1712137668-hivtuyendung.jpg`
3. `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7p6s1zNFEQ1BcWE0SKb4tI4Tsox7Z8VIEqPRN68R646y3DDcJuEB6Hwxu&s=10`
4. `https://scontent.fsgn2-3.fna.fbcdn.net/v/t39.30808-6/623246419_4340413919610930_9077336027916911327_n.jpg` (182×179)
5. `https://scontent.fsgn2-3.fna.fbcdn.net/v/t39.30808-6/339682460_1060722795316540_4083556728010197736_n.jpg` (400×400)
6. `https://scontent.fsgn2-6.fna.fbcdn.net/v/t39.30808-6/240586927_101191132336596_1701975195214489746_n.png` (591×591)

> ⚠️ Link `scontent…` của Facebook **hết hạn sau vài giờ**, phải tải về ngay.

## 2. PHÒNG KHÁM NHÀ MÌNH — 3 logo

| # | Trong file Word | Ảnh có trong folder |
|---|---|---|
| 1 | `image8.jpeg` 447×447 | ✅ một trong hai file 447×447 |
| 2 | `image9.png` 447×447 | ✅ file còn lại 447×447 |
| 3 | `image10.jpeg` 612×612 | ✅ `...5ecd794eef6e1b086cef73c74db729e3.jpg` (2047×2048, bản nét hơn) |

Hai file 447×447 trong folder:

- `...dfae3d90478d411e220639249353908f.jpg`
- `...d3e98da64ded36fab8245cd961eaf476.jpg`

> Chưa xác định được file nào là `image8`, file nào là `image9` (cùng kích thước).

Link nguồn:

1. `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqLhq7EUVgRV-Z6H_8XeGGg2LhVMBY0H1K4scsTpSBNu6w_y47VQ2xjFU&s=10`
2. `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKC3xfluYSqtz95nMnaPKu-ob-IQwRoB2B3c5EUueYT96ixnL36SksQNSR&s=10`
3. `https://scontent.fsgn2-9.fna.fbcdn.net/v/t39.30808-6/347809320_140737175659867_2122447759370251082_n.jpg` (612×612)

## 3. MẠNG LƯỚI CBO ĐỒNG BẰNG SÔNG CỬU LONG — 1 logo

| Trong file Word | Ảnh có trong folder | Link nguồn |
|---|---|---|
| `image11.jpeg` 303×298 | ❌ chưa có file khớp | `https://scontent.fsgn2-7.fna.fbcdn.net/v/t39.30808-6/471425321_904426868505194_2127509492566835255_n.jpg` |

Các file chưa đối chiếu được trong folder `web/đối tác/`:

| File | Kích thước | Khả năng |
|---|---|---|
| `...b0354884ebaa4bd42c23c11e421cc0fb.jpg` | 516×422 | Nhóm chiến lược |
| `...3c798a61729a393a6abec4e7929096de.jpg` | 450×332 | Nhóm chiến lược |

## 4. Việc cần làm khi bắt tay vào

1. Mở file Word, so từng logo với 8 file trong `web/đối tác/`, xác định đúng thứ tự.
2. Tải 2 logo còn thiếu (link ở mục 1 và mục 3) — tải ngay vì link Facebook hết hạn.
3. Đổi tên lại theo [08-anh-va-noi-dung.md §8.3](../08-anh-va-noi-dung.md): `doi-tac-01.jpg` … `doi-tac-10.jpg`.
4. Nén về 320px, tải lên Supabase Storage `site-assets/partners/`.
5. Seed vào bảng `partners` với đúng `group` và `sort_order`.

## 5. Bản ghi chú kỹ thuật

- File Word có 11 ảnh media: 1 ảnh mẫu form (`image1.png`, 1308×766) + 10 logo đối tác.
- Phần lớn logo trong Word là ảnh nhúng từ URL (nét thấp), bản trong folder có bản nét hơn
  (ví dụ 2047×2048 thay vì 612×612) → nên dùng bản trong folder.
- Ảnh `image1.png` là ảnh chụp mẫu form liên hệ. Người lập trình **không đọc được nội dung ảnh**,
  nên các trường form đã được chốt lại qua trao đổi — xem [02-yeu-cau-chi-tiet.md §2.2](../02-yeu-cau-chi-tiet.md).
