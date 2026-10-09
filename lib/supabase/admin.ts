import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SECRET_KEY, hasServiceRole } from "@/lib/env";

/**
 * Client service-role — CHỈ dùng trong Server Action / code phía máy chủ
 * (auth.admin.*, ghi không qua RLS). Không bao giờ import sang client.
 * Trả về null khi chưa cấu hình SUPABASE_SECRET_KEY.
 */
export function createAdminClient() {
  if (!hasServiceRole) return null;
  return createSupabaseClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
