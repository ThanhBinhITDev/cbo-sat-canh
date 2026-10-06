import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type {
  ContactMessage,
  Media,
  Newsletter,
  Partner,
  Post,
  Profile,
  Service,
  TeamMember,
} from "@/lib/types";

export type AdminError = { ok: false; message: string; detail?: string };

/** Kết quả truy vấn danh sách. `rows` luôn là mảng. */
export type AdminResult<T> = { ok: true; rows: T[] } | AdminError;

/** Kết quả truy vấn 1 giá trị (thống kê...). */
export type AdminValue<T> = { ok: true; value: T } | AdminError;

export const NOT_CONFIGURED: AdminError = {
  ok: false,
  message: "Chưa cấu hình Supabase cho dự án này.",
  detail:
    "Tạo file .env.local với NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY rồi chạy lại.",
};

function failWith(message: string, hint?: string): AdminError {
  return { ok: false, message, detail: hint };
}

const failValue = failWith;

async function select<T>(table: string, order?: { col: string; asc?: boolean }) {
  const supabase = await createClient();
  if (!supabase) return NOT_CONFIGURED as AdminResult<T>;

  let query = supabase.from(table).select("*");
  if (order) query = query.order(order.col, { ascending: order.asc ?? true });

  const { data, error } = await query;
  if (error) return failWith(`Không đọc được bảng "${table}".`, error.message);

  return { ok: true as const, rows: (data ?? []) as T[] };
}

/* ------------------------------------------------------------------ *
 * Bài viết
 * ------------------------------------------------------------------ */

export type AdminPostRow = Post & { author_name?: string | null };

export async function getPostsAdmin(): Promise<AdminResult<AdminPostRow>> {
  const supabase = await createClient();
  if (!supabase) return NOT_CONFIGURED;

  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles(full_name)")
    .order("updated_at", { ascending: false });

  if (error) return failWith("Không đọc được bảng posts.", error.message);

  const rows = (
    (data ?? []) as (Post & { profiles: { full_name: string } | null })[]
  ).map((row) => ({ ...row, author_name: row.profiles?.full_name ?? null }));

  return { ok: true, rows };
}

export async function getPostAdmin(id: string) {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
  return (data as Post) ?? null;
}

/* ------------------------------------------------------------------ */

export const getServicesAdmin = () => select<Service>("services", { col: "sort_order" });
export const getPartnersAdmin = () => select<Partner>("partners", { col: "sort_order" });
export const getTeamAdmin = () => select<TeamMember>("team_members", { col: "sort_order" });
export const getMediaAdmin = () => select<Media>("media", { col: "created_at", asc: false });
export const getContactsAdmin = () =>
  select<ContactMessage>("contact_messages", { col: "created_at", asc: false });
export const getNewslettersAdmin = () =>
  select<Newsletter>("newsletters", { col: "created_at", asc: false });
export const getProfilesAdmin = () => select<Profile>("profiles", { col: "created_at" });

/* ------------------------------------------------------------------ *
 * Thống kê dashboard
 * ------------------------------------------------------------------ */

export type DashboardStats = {
  newMessages: number;
  totalMessages: number;
  published: number;
  drafts: number;
  subscribers: number;
};

export async function getDashboardStats(): Promise<AdminValue<DashboardStats>> {
  const supabase = await createClient();
  if (!supabase) return failValue(NOT_CONFIGURED.message, NOT_CONFIGURED.detail);

  const [messages, posts, subs] = await Promise.all([
    supabase.from("contact_messages").select("id, status"),
    supabase.from("posts").select("id, status"),
    supabase.from("newsletters").select("id, is_active"),
  ]);

  if (messages.error || posts.error || subs.error) {
    return failValue(
      "Không tải được số liệu thống kê.",
      messages.error?.message ?? posts.error?.message ?? subs.error?.message ?? "",
    );
  }

  const postRows = (posts.data ?? []) as { status: string }[];
  const msgRows = (messages.data ?? []) as { status: string }[];
  const subRows = (subs.data ?? []) as { is_active: boolean }[];

  return {
    ok: true,
    value: {
      newMessages: msgRows.filter((r) => r.status === "new").length,
      totalMessages: msgRows.length,
      published: postRows.filter((r) => r.status === "published").length,
      drafts: postRows.filter((r) => r.status === "draft").length,
      subscribers: subRows.filter((r) => r.is_active).length,
    },
  };
}

export async function getLatestMessages(
  limit = 5,
): Promise<AdminResult<ContactMessage>> {
  const supabase = await createClient();
  if (!supabase) return NOT_CONFIGURED;

  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return failWith("Không đọc được câu hỏi liên hệ.", error.message);
  return { ok: true, rows: (data ?? []) as ContactMessage[] };
}

/** Cảnh báo khi bảng còn thiếu (chưa chạy migration). */
export async function checkTables(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  if (!supabase) return null;

  const required = ["posts", "services", "partners", "team_members", "site_settings"];
  const missing: string[] = [];

  for (const table of required) {
    // site_settings dùng PK "key" chứ không có cột id → đừng select("id")
    const { error } = await supabase.from(table).select("*").limit(1);
    if (error && /does not exist|schema cache|relation/i.test(error.message)) {
      missing.push(table);
    }
  }

  return missing.length
    ? `Bảng chưa tồn tại (hãy chạy migration): ${missing.join(", ")}`
    : null;
}

/* ------------------------------------------------------------------ *
 * Biểu đồ & lối tắt
 * ------------------------------------------------------------------ */

/** Số câu hỏi theo ngày, 14 ngày gần nhất (index 0 = hôm nay - 13). */
export async function getMessagesPerDay(): Promise<AdminValue<number[]>> {
  const supabase = await createClient();
  if (!supabase) return failValue(NOT_CONFIGURED.message, NOT_CONFIGURED.detail);

  const { data, error } = await supabase
    .from("contact_messages")
    .select("created_at");

  if (error)
    return failValue("Không tải được biểu đồ câu hỏi.", error.message);

  const days: string[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() - 13);
  for (let i = 0; i < 14; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    days.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
      ).padStart(2, "0")}`,
    );
  }

  const counts = new Array(14).fill(0) as number[];
  for (const row of (data ?? []) as { created_at: string }[]) {
    const d = new Date(row.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
    const idx = days.indexOf(key);
    if (idx >= 0) counts[idx] += 1;
  }

  return { ok: true, value: counts };
}

export type LinkCounts = {
  newMessages: number;
  posts: number;
  services: number;
  team: number;
};

export async function getLinkCounts(): Promise<AdminValue<LinkCounts>> {
  const supabase = await createClient();
  if (!supabase) return failValue(NOT_CONFIGURED.message, NOT_CONFIGURED.detail);

  const [messages, posts, services, team] = await Promise.all([
    supabase.from("contact_messages").select("id, status"),
    supabase.from("posts").select("id"),
    supabase.from("services").select("id"),
    supabase.from("team_members").select("id"),
  ]);

  if (messages.error || posts.error || services.error || team.error) {
    return failValue(
      "Không tải được số liệu lối tắt.",
      messages.error?.message ??
        posts.error?.message ??
        services.error?.message ??
        team.error?.message ??
        "",
    );
  }

  return {
    ok: true,
    value: {
      newMessages: ((messages.data ?? []) as { status: string }[]).filter(
        (r) => r.status === "new",
      ).length,
      posts: (posts.data ?? []).length,
      services: (services.data ?? []).length,
      team: (team.data ?? []).length,
    },
  };
}
