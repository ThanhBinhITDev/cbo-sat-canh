import type { HeaderContent, HeaderNavItem } from "@/lib/types";

export const DEFAULT_HEADER_SLOGAN = "Không kỳ thị, không ai bị bỏ lại phía sau";

export const DEFAULT_HEADER_ADDRESS =
  "92 Yên Thế, Phường Tân Sơn Hoà, Thành phố Hồ Chí Minh";

/** Màu chữ mặc định tầng trên (nền mặc định là màu chính nhận diện). */
export const DEFAULT_TOPBAR_TEXT_COLOR = "#ffffff";

/** Màu hex hợp lệ (#rgb hoặc #rrggbb); rỗng nếu không hợp lệ. */
function asColor(value: unknown): string {
  if (typeof value !== "string") return "";
  const s = value.trim();
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s) ? s : "";
}

/** Menu mặc định khi admin chưa cấu hình (giống bản đầu). */
export const DEFAULT_HEADER_NAV: HeaderNavItem[] = [
  { href: "/", label: "Trang chủ" },
  { href: "/#gioi-thieu", label: "Giới thiệu" },
  { href: "/#dich-vu", label: "Dịch vụ" },
  { href: "/tin-tuc", label: "Tin tức" },
  { href: "/#doi-ngu", label: "Đội ngũ" },
  { href: "/#doi-tac", label: "Đối tác" },
  { href: "/lien-he", label: "Liên hệ" },
];

const MAX_NAV = 12;
const MAX_LABEL = 40;
const MAX_HREF = 200;

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Chuẩn hoá danh sách menu: bỏ mục thiếu nhãn/liên kết, giới hạn số lượng. */
export function normalizeNav(input: unknown): HeaderNavItem[] {
  if (!Array.isArray(input)) return DEFAULT_HEADER_NAV;

  const items = input
    .map((raw) => {
      const obj =
        raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
      return {
        label: asString(obj.label).slice(0, MAX_LABEL),
        href: asString(obj.href).slice(0, MAX_HREF),
      };
    })
    .filter((item) => item.label && item.href)
    .slice(0, MAX_NAV);

  return items.length ? items : DEFAULT_HEADER_NAV;
}

/**
 * Chuẩn hoá cấu hình thanh điều hướng. `fallback` là giá trị lấy từ Liên hệ
 * để thanh trên vẫn hiển thị khi admin chưa nhập gì riêng.
 */
export function normalizeHeader(
  input: unknown,
  fallback: { address: string; phone: string },
): HeaderContent {
  const obj =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  return {
    address: asString(obj.address) || fallback.address || DEFAULT_HEADER_ADDRESS,
    phone: asString(obj.phone) || fallback.phone,
    slogan: asString(obj.slogan) || DEFAULT_HEADER_SLOGAN,
    show_language: obj.show_language === undefined ? true : obj.show_language !== false,
    nav: normalizeNav(obj.nav),
    cta_label: asString(obj.cta_label) || "Liên hệ",
    cta_href: asString(obj.cta_href) || "/lien-he",
    top_color: asColor(obj.top_color),
    top_text_color: asColor(obj.top_text_color) || DEFAULT_TOPBAR_TEXT_COLOR,
  };
}
