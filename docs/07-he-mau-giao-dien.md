# 07 — HỆ MÀU GIAO DIỆN (THEME) ĐỘNG

## 7.1. Yêu cầu từ khách hàng

> *"Bộ màu nhận diện: `#279CD7`, `#1C4592`, `#454C56`. Mặc định là bộ này, nhưng trang cần
> chỉnh được giao diện màu sắc. Khách thì lưu trên máy họ, còn admin thì chỉnh lưu ở cơ sở dữ
> liệu áp dụng cho tất cả user."*

**Ba lớp màu, thứ tự ưu tiên từ cao đến thấp:**

| Ưu tiên | Láp | Nơi lưu | Ai sửa | Phạm vi |
|---|---|---|---|---|
| 1 (cao nhất) | Cá nhân | `localStorage` (máy khách) | Chính khách đó | Chỉ người đó |
| 2 | Toàn cục | Supabase `site_settings` key `theme` | `admin` | Mọi người |
| 3 | Mặc định | Mã nguồn (`lib/theme-default.ts`) | Lập trình viên | Mọi người khi chưa có gì được lưu |

Nghĩa là: khách tự chỉnh màu sẽ thấy màu mình chọn dù admin có đổi sau đó,
cho tới khi khách bấm **Khôi phục mặc định**.

## 7.2. Các biến màu

| Biểu tượng CSS | Khóa JSON | Mặc định | Dùng ở đâu |
|---|---|---|---|
| `--color-primary` | `primary` | `#279CD7` | Nút chính, link, tiêu đề nhấn, icon |
| `--color-primary-dark` | `dark` | `#1C4592` | Nút hover, tiêu đề lớn, footer |
| `--color-ink` | `ink` | `#454C56` | Toàn bộ chữ thân bài |
| `--color-surface` | `surface` | `#FFFFFF` | Nền thẻ, nền header |
| `--color-muted` | `muted` | `#F5F8FA` | Nền section xen kẽ |
| `--color-accent` | `accent` | `#FFB020` | Nút kêu gọi, badge, dấu chấm báo mới |
| `--color-border` | `border` | `#E3EAF0` | Viền, đường kẻ |
| `--color-radius` | `radius` | `16px` | Bo góc thẻ, nút, ô input |
| `--color-font-scale` | `fontScale` | `1` | Cỡ chữ toàn trang |

Chữ màu chữ tiêu đề (heading) dùng `primary-dark`, chữ thân dùng `ink`.

## 7.3. Luồng dữ liệu

### Khi trang được tải (Server)

```
app/layout.tsx (server)
  → đọc site_settings WHERE key = 'theme'   (nếu không có → mặc định)
  → nhúng biến vào thẻ <html style="--color-primary:#279CD7; ...">
  → khách thấy màu đúng ngay, không nhấp nháy
```

### Khi khách tự chỉnh (Client)

```
Nút 🎨 "Tùy chỉnh giao diện" (trái dưới, hoặc ở header)
  → bảng chọn màu / chọn mẫu có sẵn
  → ghi localStorage key = 'cbosc.theme.override' = { primary: '#...' }
  → áp dụng ngay bằng element.style.setProperty('--color-primary', ...)
  → trang ghi nhớ màu này cho lần sau
  → nút "Khôi phục mặc định" → xóa localStorage → màu admin về lại
```

### Khi admin lưu (CMS → database)

```
/admin/giao-dien
  → chọn màu → xem thử ngay
  → "Lưu áp dụng cho toàn bộ trang"
  → UPDATE site_settings SET value = $1 WHERE key = 'theme'
  → mọi khách reload trang nhận màu mới từ server
```

## 7.4. Mẫu màu gợi ý (đặt sẵn trong admin)

| Tên mẫu | primary | dark | ink | accent |
|---|---|---|---|---|
| **Nhận diện CBO (mặc định)** | `#279CD7` | `#1C4592` | `#454C56` | `#FFB020` |
| Chuyên nghiệp | `#0EA5E9` | `#0C4A6E` | `#334155` | `#F97316` |
| Sức khỏe | `#10B981` | `#065F46` | `#3F3F46` | `#F59E0B` |
| Ấm áp | `#EF4444` | `#7F1D1D` | `#44403C` | `#FACC15` |

## 7.5. Quy tắc triển khai

1. **Không dùng màu hard-code trong component.** Luôn là `bg-primary`, `text-ink`,
   `rounded-[var(--color-radius)]` qua Tailwind theme keys.
2. **Màu phải đạt tương phản**: chữ trắng trên nền `primary` → kiểm tra tỉ lệ ≥ 4.5:1.
   Nếu admin chọn màu nhạt, hệ thống tự chuyển chữ tiêu đề sang `dark`.
3. **Logo vẫn giữ nguyên màu** — có 2 bản (nền sáng / nền tối) nếu cần.
4. **Ảnh không đổi màu theo theme.**
5. Admin cũng thấy màu mình đang chỉnh ngay trên trang CMS (xem thử trước khi lưu).
6. Ghi đè theo cặp: nếu admin đổi `primary`, hệ thống tự gợi ý `dark` cùng tông
   (sáng/giảm độ đậm), vẫn cho phép chỉnh tay.
