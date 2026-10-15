import { SITE_NAME } from "@/lib/env";

/** Giới hạn độ dài để ảnh OG không bị tràn. */
const TITLE_MAX = 140;
const DESC_MAX = 200;

function clip(text: string, max: number) {
  const s = text.replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Sinh đường dẫn ảnh OG động (tương đối, để Next tự ghép metadataBase).
 * Dùng khi bài viết không có ảnh bìa hoặc cho ảnh chia sẻ mặc định của trang.
 */
export function ogImageUrl(input: {
  title?: string | null;
  description?: string | null;
  category?: string | null;
  siteName?: string | null;
}) {
  const params = new URLSearchParams();
  const title = clip(input.title ?? SITE_NAME, TITLE_MAX);
  if (title) params.set("title", title);
  const description = clip(input.description ?? "", DESC_MAX);
  if (description) params.set("description", description);
  const category = (input.category ?? "").replace(/\s+/g, " ").trim();
  if (category) params.set("category", category);
  const siteName = (input.siteName ?? SITE_NAME).trim();
  if (siteName) params.set("site", siteName);
  return `/api/og?${params.toString()}`;
}
