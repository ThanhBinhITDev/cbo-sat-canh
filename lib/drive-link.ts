/**
 * Chuyển link ảnh ngoài (Google Drive, imgur...) sang dạng hiển thị trực tiếp.
 * Drive phải đặt quyền "Ai có đường liên kết cũng xem được" mới hiển thị được.
 */

const DRIVE_PATTERNS = [
  /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/folders\/([a-zA-Z0-9_-]+)/,
];

/** Trả về URL ảnh ổn định, hoặc null nếu không nhận diện được. */
export function toDirectImageUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;

  // Ảnh nhúng sẵn (imgur, supabase, unsplash, lh3...) → giữ nguyên
  if (/^https:\/\//i.test(url)) {
    if (/drive\.google\.com/i.test(url)) {
      for (const pattern of DRIVE_PATTERNS) {
        const match = url.match(pattern);
        if (match?.[1]) {
          return `https://lh3.googleusercontent.com/d/${match[1]}=w1600`;
        }
      }
      return null;
    }
    return url;
  }

  // Dán kèm nhúng <img src="...">
  const srcMatch = url.match(/src=["']([^"']+)["']/i);
  if (srcMatch?.[1]) return toDirectImageUrl(srcMatch[1]);

  return null;
}

/** CẢNH BÁO khi link Drive nhiều khả năng không chia sẻ công khai. */
export function looksLikePrivateDrive(raw: string): boolean {
  return /drive\.google\.com/i.test(raw);
}
