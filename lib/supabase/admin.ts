import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, hasServiceRole } from "@/lib/env";

/**
 * Client dùng service role — CHỈ dùng trong Route Handler phía máy chủ
 * (ghi contact_messages / newsletters, không lộ ra trình duyệt).
 */
export function createAdminClient() {
  if (!hasServiceRole) return null;
  return createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
