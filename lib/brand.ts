export type Brand = {
  logoWide: string | null;
  logoSquare: string | null;
  faviconLight: string | null;
  faviconDark: string | null;
};

export const BRAND_FIELDS = ["logoWide", "logoSquare", "faviconLight", "faviconDark"] as const;
export type BrandField = (typeof BRAND_FIELDS)[number];

export const FALLBACK_LOGO_WIDE = "/images/brand/logo-cau.png";
export const FALLBACK_LOGO_SQUARE = "/images/brand/logo-vong-tron.png";

const MAX_BRAND_BYTES = 5 * 1024 * 1024;
const BRAND_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"];

/** null = hợp lệ. */
export function validateBrandImageFile(file: File): string | null {
  if (!BRAND_TYPES.includes(file.type)) {
    return "Chỉ nhận ảnh PNG, JPG, WEBP, GIF hoặc AVIF.";
  }
  if (file.size > MAX_BRAND_BYTES) {
    return "Ảnh lớn hơn 5MB.";
  }
  return null;
}

/** Chỉ nhận URL tuyệt đối (http/https) hoặc path nội bộ bắt đầu bằng "/". */
export function brandImageUrl(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^https?:\/\/\S+$/i.test(s)) return s;
  if (/^\/\S*$/.test(s)) return s;
  return null;
}

export function normalizeBrand(input: unknown): Brand {
  const obj = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const out: Brand = {
    logoWide: null,
    logoSquare: null,
    faviconLight: null,
    faviconDark: null,
  };
  for (const field of BRAND_FIELDS) {
    out[field] = typeof obj[field] === "string" ? brandImageUrl(obj[field]) : null;
  }
  // Key cũ "favicon" (trước khi tách sáng/tối) → dùng chung cho cả 2 ô.
  if (!out.faviconLight && !out.faviconDark && typeof obj.favicon === "string") {
    const legacy = brandImageUrl(obj.favicon);
    out.faviconLight = legacy;
    out.faviconDark = legacy;
  }
  return out;
}

/** Đường dẫn object trong bucket site-assets: brand/<truong>-<ts>-<ten>. */
export function brandPath(field: BrandField, fileName: string): string {
  const safe =
    fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .slice(-60) || "image";
  return `brand/${field}-${Date.now()}-${safe}`;
}
