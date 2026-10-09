import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/types";

export type SessionUser = {
  id: string;
  email: string;
  profile: Profile | null;
};

/**
 * TODO(PROBE): bypass đăng nhập tạm — chỉ chạy khi khởi động dev với
 * `PROBE_NO_AUTH=1`. GỠ dòng này + nhánh trong getSessionUser sau khi dò xong UI.
 */
const PROBE_USER: SessionUser | null =
  process.env.PROBE_NO_AUTH === "1"
    ? {
        id: "probe-session",
        email: "thanhbinhit@gmail.com",
        profile: {
          id: "probe-session",
          full_name: "Thanh Bình",
          username: null,
          email: "thanhbinhit@gmail.com",
          role: "admin",
          avatar_url: null,
          is_active: true,
          created_at: "",
          updated_at: "",
        },
      }
    : null;

/** Lấy người dùng hiện tại kèm hồ sơ. Null nếu chưa đăng nhập / chưa cấu hình. */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (PROBE_USER) return PROBE_USER;

  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profile && profile.is_active === false) return null;

  // Đồng bộ email sau khi người dùng xác nhận đổi email ở auth
  // (profiles.email chỉ cập nhật khi họ bấm link xác nhận).
  if (profile && user.email && profile.email !== user.email) {
    const { error: syncErr } = await supabase
      .from("profiles")
      .update({ email: user.email })
      .eq("id", user.id);
    if (!syncErr) (profile as { email: string }).email = user.email;
  }

  return {
    id: user.id,
    email: user.email ?? "",
    profile: (profile as Profile) ?? null,
  };
}

/** Chặn khi vai trò không đủ. Gọi trong Server Component / Server Action. */
export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || !user.profile) throw new AuthError("unauthenticated");
  if (!roles.includes(user.profile.role)) throw new AuthError("forbidden");
  return user;
}

export class AuthError extends Error {
  constructor(public code: "unauthenticated" | "forbidden") {
    super(code);
    this.name = "AuthError";
  }
}

export { ROLE_LABELS } from "@/lib/types";
