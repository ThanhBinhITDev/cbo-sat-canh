import { brandImageUrl } from "@/lib/brand";

export type LoaderConfig = {
  enabled: boolean;
  imageUrl: string | null;
  background: string | null;
  minDurationMs: number;
  oncePerSession: boolean;
  /** Có hiện dòng chữ kèm loader hay không. */
  showText: boolean;
  /** Nội dung dòng chữ (admin tự nhập), hiện khi showText = true. */
  text: string;
};

export const DEFAULT_LOADER: LoaderConfig = {
  enabled: false,
  imageUrl: null,
  background: null,
  minDurationMs: 600,
  oncePerSession: false,
  showText: true,
  text: "Đang tải…",
};

const MAX_TEXT_LEN = 120;

const MAX_GIF_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const LOADER_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"];

const HEX = /^#[0-9a-fA-F]{6}$/;

/** null = hợp lệ. */
export function validateLoaderFile(file: File): string | null {
  if (!LOADER_TYPES.includes(file.type)) {
    return "Chỉ nhận ảnh PNG, JPG, WEBP, GIF hoặc AVIF.";
  }
  // GIF động thường nặng hơn nên cho hạn mức riêng.
  const max = file.type === "image/gif" ? MAX_GIF_BYTES : MAX_IMAGE_BYTES;
  if (file.size > max) {
    return `Ảnh lớn hơn ${Math.round(max / (1024 * 1024))}MB.`;
  }
  return null;
}

/** Chỉ nhận URL tuyệt đối (http/https) hoặc path nội bộ bắt đầu bằng "/". */
export function loaderImageUrl(raw: string): string | null {
  return brandImageUrl(raw);
}

/** Đường dẫn object trong bucket site-assets: loader/<ts>-<ten>. */
export function loaderPath(fileName: string): string {
  const safe =
    fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .slice(-60) || "loader";
  return `loader/${Date.now()}-${safe}`;
}

export function normalizeLoader(input: unknown): LoaderConfig {
  const out: LoaderConfig = { ...DEFAULT_LOADER };
  if (!input || typeof input !== "object") return out;

  const raw = input as Record<string, unknown>;

  out.enabled = raw.enabled === true;

  if (typeof raw.imageUrl === "string") {
    out.imageUrl = loaderImageUrl(raw.imageUrl);
  }

  if (typeof raw.background === "string" && HEX.test(raw.background.trim())) {
    out.background = raw.background.trim();
  }

  if (
    typeof raw.minDurationMs === "number" &&
    raw.minDurationMs >= 0 &&
    raw.minDurationMs <= 5000
  ) {
    out.minDurationMs = Math.round(raw.minDurationMs);
  }

  out.oncePerSession = raw.oncePerSession === true;

  if (typeof raw.showText === "boolean") out.showText = raw.showText;

  if (typeof raw.text === "string") {
    out.text = raw.text.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_LEN);
  }

  return out;
}
