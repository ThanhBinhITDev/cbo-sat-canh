"use client";

import { createClient } from "@/lib/supabase/client";
import { toDirectImageUrl } from "@/lib/drive-link";

const MAX_BYTES = 5 * 1024 * 1024;

function safeName(name: string) {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .slice(-60) || "anh"
  );
}

/**
 * Tải ảnh nội dung bài viết lên bucket `site-assets` và trả về URL công khai.
 * Dùng chung cho hộp thoại chèn ảnh, kéo-thả và ảnh bìa.
 */
export async function uploadArticleImage(file: File): Promise<string> {
  return uploadToFolder(file, "uploads", "article");
}

/**
 * Tải ảnh đính kèm nhiệm vụ lên thư mục `uploads/tasks/<uid>/` của bucket
 * `site-assets` (chỉ người có quyền quản lý cộng tác được tải lên).
 */
export async function uploadTaskImage(file: File): Promise<string> {
  return uploadToFolder(file, "uploads/tasks", "task");
}

async function uploadToFolder(file: File, folder: string, prefix: string): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Tệp đã chọn không phải là ảnh.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Ảnh lớn hơn 5MB.");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Phiên đăng nhập không hợp lệ. Hãy đăng nhập lại.");

  const path = `${folder}/${user.id}/${Date.now()}-${prefix}-${safeName(file.name)}`;
  const { error } = await supabase.storage
    .from("site-assets")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw new Error(`Tải ảnh thất bại: ${error.message}`);

  const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Nhận diện URL ảnh khi dán: trả về URL ảnh trực tiếp hoặc null.
 * Chỉ nhận khi là một liên kết duy nhất (không có khoảng trắng).
 */
export function imageUrlFromPaste(raw: string): string | null {
  const text = raw.trim();
  if (!text || /\s/.test(text)) return null;

  const direct = toDirectImageUrl(text);
  if (!direct) return null;

  if (
    /drive\.google\.com/i.test(text) ||
    /\.(png|jpe?g|gif|webp|avif|svg)([?#].*)?$/i.test(text)
  ) {
    return direct;
  }
  return null;
}
