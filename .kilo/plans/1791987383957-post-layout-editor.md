# Kế hoạch: bố cục bài viết và trình soạn thảo admin

## Mục tiêu

1. Trang chi tiết bài (`app/tin-tuc/[slug]/page.tsx`):
   - Bỏ khối "Về tác giả" ở cuối bài. Tác giả chỉ hiện ở đầu trang (`PostAuthor` hiện có).
   - Ảnh bìa không hiển thị trong thân bài. Ảnh bìa chỉ dùng ở thẻ danh sách và ở ảnh chia sẻ (Open Graph / Twitter, đã có trong `generateMetadata`).
   - Thêm mô tả bài viết: dùng `excerpt` (đã có, tối đa 220 ký tự), hiển thị ngay dưới tiêu đề, làm đoạn dẫn. Không tạo cột mới.
2. Trình soạn thảo admin (`components/admin/RichTextEditor.tsx`):
   - Chỉnh cỡ chữ theo pt.
   - Chỉnh kích thước ảnh trong bài.
   - Thanh định dạng dễ dùng hơn.

## Quyết định đã chốt

- Mô tả bài = `excerpt`. Không đổi tên cột, không thêm migration.
- Ảnh bìa: không render trong `<article>`. Giữ nguyên ở thẻ `PostCard` và metadata chia sẻ.
- Cỡ chữ: đơn vị pt, lưu vào inline style `font-size: Npt`. Tập giá trị cố định: 9, 10, 11, 12, 14, 16, 18, 20, 24, 28 pt. Mặc định (không style) = cỡ đoạn văn hiện tại.
- Kích thước ảnh: 4 mức (25%, 50%, 75%, 100% chiều rộng khung nội dung), lưu `width: N%` trong style của `<img>`. Ảnh mặc định 100%.
- Căn lề ảnh: giữ căn trái / giữa / phải bằng `text-align` của đoạn chứa ảnh, không thêm thuộc tính mới.

## Thay đổi cần làm

### A. Trang chi tiết (`app/tin-tuc/[slug]/page.tsx`)
1. Xóa khối `<aside>` "Về tác giả" (dòng ~182–193).
2. Xóa khối `<Image>` ảnh bìa trong `<article>` (dòng ~156–167). Giữ import `Image` vì còn dùng ở nơi khác nếu cần; nếu không còn dùng thì xóa import.
3. Ngay dưới tiêu đề (trong khối header, sau `<h1>`), thêm đoạn mô tả:
   - Chỉ render khi `post.excerpt` không rỗng.
   - Style: `text-lg`, màu `text-ink/75`, `max-w-3xl`.
4. Giữ `PostAuthor size="md"` ở đầu trang.
5. `generateMetadata` đã dùng `meta_description || excerpt` cho description và `cover_url` cho og:image. Không đổi.

### B. Sanitize (`lib/sanitize.ts`)
1. Mở rộng `allowedStyles` cho `*`:
   - `text-align`: giữ nguyên.
   - `font-size`: regex chỉ cho phép `^\d{1,2}(\.\d)?pt$` và giới hạn 9–28pt (kiểm tra trong regex hoặc dùng danh sách cố định khớp với UI).
2. Cho `img` thêm style `width` với regex `^\d{1,3}%$` (giới hạn 1–100%). Hiện `img` chỉ có attribute `style` qua `"*"`, nên cần khai báo `allowedStyles` theo tag `img` nếu cần khác.
3. Không cho phép `font-family`, `color`, `background` trong bước này (ngoài phạm vi).

### C. Trình soạn thảo (`components/admin/RichTextEditor.tsx`)
1. Thêm extension `TextStyle` và một `FontSize` tùy chỉnh (qua `addGlobalAttributes` trên `textStyle`, đặt `fontSize` theo pt, đọc/ghi `style="font-size:Npt"`).
   - Cần thêm dependency `@tiptap/extension-text-style` (cùng phiên bản `^3.32.0`). Đây là thay đổi `package.json`: implementation agent phải xác nhận với người dùng trước khi cài.
2. Mở rộng `Image`:
   - Thêm attribute `width` (lưu dạng `N%`), render thành `style="width:N%"`.
   - Thêm 4 nút mức kích thước (25/50/75/100) hiện khi ảnh được chọn (`NodeSelection` trên img), hoặc một dropdown "Kích thước ảnh" trong thanh công cụ áp cho ảnh đang chọn.
3. Thanh công cụ được nhóm lại, mỗi nhóm có tiêu đề nhỏ:
   - **Đoạn văn:** dropdown kiểu (Đoạn thường / Tiêu đề lớn H2 / Tiêu đề nhỏ H3).
   - **Cỡ chữ:** dropdown pt (áp cho vùng chọn; bỏ chọn = "Mặc định").
   - **Chữ:** Đậm, Nghiêng, Gạch chân, Gạch ngang.
   - **Đoạn:** Căn trái/giữa/phải, Danh sách, Danh sách số, Trích dẫn, Đường kẻ.
   - **Chèn:** Liên kết, Ảnh, Hoàn tác/Làm lại.
   - Dùng `aria-label` và `title` đầy đủ như hiện tại, giữ `aria-pressed`.
4. Thêm phím tắt: Ctrl/Cmd+K mở hộp nhập liên kết (đã có extension Link của StarterKit qua `setLink`; chỉ cần `addKeyboardShortcuts`).
5. Giữ nguyên `handlePaste` / `handleDrop` ảnh hiện có.

### D. Kiểm tra dữ liệu cũ
- Bài đã lưu không có `font-size` hay `width` vẫn hiển thị như cũ (mặc định không đổi).
- `cleanPostHtml` chạy khi hiển thị (trang chi tiết) và khi lưu (`savePost`). Phải đảm bảo style mới không bị xóa ở cả hai bước.

## Rủi ro và cách xử lý

| Rủi ro | Cách xử lý |
|---|---|
| `sanitize-html` xóa `font-size` hoặc `width` | Mở rộng `allowedStyles` (B.1, B.2) và kiểm tra bằng HTML mẫu. |
| Người dùng dán HTML có `font-size` ngoài danh sách | Regex giới hạn 9–28pt; giá trị ngoài khoảng bị bỏ. |
| Ảnh bìa bị mất khỏi bài cũ | Không xảy ra: chỉ ẩn ở thân bài, dữ liệu `cover_url` không đổi. |
| Admin đang sửa bài cũ có ảnh bìa chèn trong nội dung | Ảnh đó vẫn nằm trong `content_html` và vẫn hiển thị (chỉ ẩn ảnh bìa tách riêng). Cần thông báo cho admin. |
| Thêm dependency TipTap | Cùng phiên bản `^3.32.0`; cần xác nhận trước khi `npm install`. |

## Kiểm tra (validation)

1. `npx tsc --noEmit -p .` phải pass.
2. `npm run build` phải pass (kiểm tra SSR và sanitize).
3. Kiểm tra thủ công trên admin:
   - Chọn đoạn → đổi cỡ 18pt → lưu → xem trang công khai có đúng cỡ.
   - Chèn ảnh → chọn 50% → lưu → xem trang công khai có đúng chiều rộng.
   - Dán HTML có `font-size: 500pt` → sau lưu bị giới hạn/bỏ.
4. Trang chi tiết:
   - Không còn khối "Về tác giả" ở cuối.
   - Không có ảnh bìa trong thân bài; ảnh bìa vẫn hiện ở thẻ danh sách trang Tin tức.
   - Mô tả (excerpt) hiện dưới tiêu đề; bài không có tóm tắt thì khối này không hiện.
   - Kiểm tra meta `og:image` và `og:description` bằng HTML nguồn trang.
5. Chạy `curl` các trang `/tin-tuc`, `/tin-tuc/<slug>` để xác nhận HTTP 200.

## Ngoài phạm vi

- Màu chữ, font chữ, nền đoạn, bảng biểu, video.
- Đổi cấu trúc cột `posts` hay thêm `description`.
- Đa ngôn ngữ.

## Câu hỏi còn mở (không chặn triển khai)

- Mức kích thước ảnh mặc định 25/50/75/100% có đủ không, hay cần thêm nút "Tự do" (nhập %)? Đề xuất: giữ 4 mức.
- Có muốn ảnh bìa vẫn hiện trong thân bài với bài cũ đã chèn sẵn không? Đề xuất: không tự động xóa; admin tự gỡ khỏi nội dung nếu muốn.
