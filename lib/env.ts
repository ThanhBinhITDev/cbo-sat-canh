export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isSupabaseConfigured =
  SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 0;

export const hasServiceRole = SUPABASE_SERVICE_ROLE_KEY.length > 0;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const SITE_NAME =
  process.env.NEXT_PUBLIC_SITE_NAME ?? "CBO Sát Cánh";

export const DEFAULT_HOTLINE =
  process.env.NEXT_PUBLIC_DEFAULT_HOTLINE ?? "0967206095";

/** Trả về false để trang vẫn hiển thị nội dung mặc định khi chưa cấu hình. */
export function assertSupabase(): boolean {
  return isSupabaseConfigured;
}
