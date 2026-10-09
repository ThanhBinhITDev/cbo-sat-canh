const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"];

/** null = hợp lệ. */
export function validateAvatarFile(file: File): string | null {
  if (!AVATAR_TYPES.includes(file.type)) {
    return "Chỉ nhận ảnh PNG, JPG, WEBP, GIF hoặc AVIF.";
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return "Ảnh lớn hơn 5MB.";
  }
  return null;
}

/** Đường dẫn object trong bucket site-assets: avatars/<userId>/<ts>-<ten>. */
export function avatarPath(userId: string, fileName: string): string {
  const safe =
    fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .slice(-60) || "avatar";
  return `avatars/${userId}/${Date.now()}-${safe}`;
}

/** Lấy path object từ public URL của site-assets. null nếu không phải URL này. */
export function storagePathFromPublicUrl(url: string): string | null {
  const marker = "/storage/v1/object/public/site-assets/";
  const i = url.indexOf(marker);
  if (i < 0) return null;
  return decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}
