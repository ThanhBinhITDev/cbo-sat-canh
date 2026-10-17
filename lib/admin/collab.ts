import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { NOT_CONFIGURED, type AdminResult } from "@/lib/admin/data";
import type {
  CollabMember,
  ContributionEntry,
  ContributionSource,
  LeaderboardRow,
  Medal,
  ProfileMedalWithMedal,
  Task,
  TaskAssignee,
  TaskAssigneeRole,
  TaskAttachment,
  TaskCategory,
  TaskStatus,
  TaskUpdate,
  ProjectWithLeader,
  EventWithProject,
} from "@/lib/types";

export type TaskAssigneeBrief = {
  profile_id: string;
  status: TaskStatus;
  role_in_task: TaskAssigneeRole;
};

export type TaskRow = Task & {
  category_label: string | null;
  assignees: TaskAssigneeBrief[];
};

export type TaskDetail = {
  task: Task;
  category_label: string | null;
  assignees: TaskAssignee[];
  updates: TaskUpdate[];
  attachments: TaskAttachment[];
};

function failWith(message: string, hint?: string) {
  return { ok: false as const, message, detail: hint };
}

/* ------------------------------------------------------------------ *
 * Thành viên
 * ------------------------------------------------------------------ */

export async function getMembers(): Promise<AdminResult<CollabMember>> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const supabase = await createClient();
  if (!supabase) return NOT_CONFIGURED;

  const { data, error } = await supabase.rpc("collab_members");
  if (error) return failWith("Không đọc được danh sách thành viên.", error.message);
  return { ok: true, rows: (data ?? []) as CollabMember[] };
}

/** Bản đồ id → thành viên, để ghép tên/ảnh cho người được giao việc. */
export async function getMembersMap(): Promise<Map<string, CollabMember>> {
  const res = await getMembers();
  const map = new Map<string, CollabMember>();
  if (res.ok) for (const m of res.rows) map.set(m.id, m);
  return map;
}

/* ------------------------------------------------------------------ *
 * Danh mục nhiệm vụ
 * ------------------------------------------------------------------ */

export async function getTaskCategories(
  activeOnly = false,
): Promise<AdminResult<TaskCategory>> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const supabase = await createClient();
  if (!supabase) return NOT_CONFIGURED;

  let query = supabase.from("task_categories").select("*").order("sort_order");
  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) return failWith("Không đọc được danh mục nhiệm vụ.", error.message);
  return { ok: true, rows: (data ?? []) as TaskCategory[] };
}

/* ------------------------------------------------------------------ *
 * Nhiệm vụ
 * ------------------------------------------------------------------ */

export type TaskFilters = {
  status?: TaskStatus | "";
  categoryId?: string;
  assigneeId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type TaskListResult =
  | { ok: true; rows: TaskRow[]; total: number; page: number; pageSize: number }
  | { ok: false; message: string; detail?: string };

/** Ghép nhãn danh mục + danh sách người được giao cho các task đã tải. */
async function decorate(
  tasks: (Task & { task_categories: { label: string } | null })[],
): Promise<TaskRow[]> {
  if (tasks.length === 0) return [];
  const supabase = await createClient();
  if (!supabase) return tasks.map((t) => ({ ...t, category_label: null, assignees: [] }));

  const ids = tasks.map((t) => t.id);
  const { data: assignees } = await supabase
    .from("task_assignees")
    .select("task_id, profile_id, status, role_in_task")
    .in("task_id", ids);

  const byTask = new Map<string, TaskAssigneeBrief[]>();
  for (const a of (assignees ?? []) as (TaskAssigneeBrief & { task_id: string })[]) {
    const list = byTask.get(a.task_id) ?? [];
    list.push({ profile_id: a.profile_id, status: a.status, role_in_task: a.role_in_task });
    byTask.set(a.task_id, list);
  }

  return tasks.map((t) => ({
    ...t,
    category_label: t.task_categories?.label ?? null,
    assignees: byTask.get(t.id) ?? [],
  }));
}

export async function getTasks(filters: TaskFilters = {}): Promise<TaskListResult> {
  if (!isSupabaseConfigured) return failWith(NOT_CONFIGURED.message, NOT_CONFIGURED.detail);
  const supabase = await createClient();
  if (!supabase) return failWith(NOT_CONFIGURED.message, NOT_CONFIGURED.detail);

  const pageSize = Math.min(Math.max(filters.pageSize ?? 20, 1), 100);
  const page = Math.max(filters.page ?? 1, 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Lọc theo người được giao: quy đổi sang danh sách task_id trước.
  let restrictedTaskIds: string[] | null = null;
  if (filters.assigneeId) {
    const { data: assigns, error: assignErr } = await supabase
      .from("task_assignees")
      .select("task_id")
      .eq("profile_id", filters.assigneeId);
    if (assignErr) return failWith("Không lọc được theo người thực hiện.", assignErr.message);
    restrictedTaskIds = (assigns ?? []).map((a) => (a as { task_id: string }).task_id);
    if (restrictedTaskIds.length === 0) {
      return { ok: true, rows: [], total: 0, page, pageSize };
    }
  }

  let query = supabase
    .from("tasks")
    .select("*, task_categories(label)", { count: "exact" });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (restrictedTaskIds) query = query.in("id", restrictedTaskIds);
  if (filters.search?.trim()) query = query.ilike("title", `%${filters.search.trim()}%`);

  const { data, error, count } = await query
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return failWith("Không đọc được danh sách nhiệm vụ.", error.message);

  const rows = await decorate(
    (data ?? []) as (Task & { task_categories: { label: string } | null })[],
  );
  return { ok: true, rows, total: count ?? rows.length, page, pageSize };
}

export async function getTaskDetail(id: string): Promise<
  | { ok: true; data: TaskDetail }
  | { ok: false; message: string; detail?: string }
> {
  if (!isSupabaseConfigured) return failWith(NOT_CONFIGURED.message, NOT_CONFIGURED.detail);
  const supabase = await createClient();
  if (!supabase) return failWith(NOT_CONFIGURED.message, NOT_CONFIGURED.detail);

  const { data: task, error } = await supabase
    .from("tasks")
    .select("*, task_categories(label)")
    .eq("id", id)
    .maybeSingle();

  if (error) return failWith("Không đọc được nhiệm vụ.", error.message);
  if (!task) return failWith("Không tìm thấy nhiệm vụ hoặc bạn không có quyền xem.");

  const [assignees, updates, attachments] = await Promise.all([
    supabase.from("task_assignees").select("*").eq("task_id", id).order("created_at"),
    supabase
      .from("task_updates")
      .select("*")
      .eq("task_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("task_attachments")
      .select("*")
      .eq("task_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const t = task as Task & { task_categories: { label: string } | null };
  return {
    ok: true,
    data: {
      task: t,
      category_label: t.task_categories?.label ?? null,
      assignees: (assignees.data ?? []) as TaskAssignee[],
      updates: (updates.data ?? []) as TaskUpdate[],
      attachments: (attachments.data ?? []) as TaskAttachment[],
    },
  };
}

/** Nhiệm vụ được giao cho một người (trang "Việc của tôi"). */
export async function getMyTasks(
  profileId: string,
): Promise<{ ok: true; rows: TaskRow[] } | { ok: false; message: string; detail?: string }> {
  if (!isSupabaseConfigured) return failWith(NOT_CONFIGURED.message, NOT_CONFIGURED.detail);
  const supabase = await createClient();
  if (!supabase) return failWith(NOT_CONFIGURED.message, NOT_CONFIGURED.detail);

  const { data: assigns, error: aErr } = await supabase
    .from("task_assignees")
    .select("task_id")
    .eq("profile_id", profileId);
  if (aErr) return failWith("Không đọc được nhiệm vụ của bạn.", aErr.message);

  const ids = (assigns ?? []).map((a) => (a as { task_id: string }).task_id);
  if (ids.length === 0) return { ok: true, rows: [] };

  const { data, error } = await supabase
    .from("tasks")
    .select("*, task_categories(label)")
    .in("id", ids)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) return failWith("Không đọc được nhiệm vụ của bạn.", error.message);

  return {
    ok: true,
    rows: await decorate(
      (data ?? []) as (Task & { task_categories: { label: string } | null })[],
    ),
  };
}

export type TaskStats = {
  total: number;
  byStatus: Record<TaskStatus, number>;
  overdue: number;
  mineOpen: number;
};

export async function getTaskStats(profileId: string): Promise<TaskStats | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  if (!supabase) return null;

  const statuses: TaskStatus[] = [
    "assigned",
    "accepted",
    "in_progress",
    "submitted",
    "needs_revision",
    "completed",
    "cancelled",
  ];

  const results = await Promise.all(
    statuses.map((s) =>
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", s),
    ),
  );

  const byStatus = {} as Record<TaskStatus, number>;
  statuses.forEach((s, i) => {
    byStatus[s] = results[i].count ?? 0;
  });

  const today = new Date().toISOString().slice(0, 10);
  const { count: overdue } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .lt("due_date", today)
    .not("status", "in", "(completed,cancelled)");

  const { count: mineOpen } = await supabase
    .from("task_assignees")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId)
    .not("status", "in", "(completed,cancelled)");

  const total = statuses.reduce((s, k) => s + byStatus[k], 0);
  return { total, byStatus, overdue: overdue ?? 0, mineOpen: mineOpen ?? 0 };
}

/* ------------------------------------------------------------------ *
 * Giai đoạn 2 — Điểm đóng góp, huy chương, xếp hạng
 * ------------------------------------------------------------------ */

export type LeaderboardResult =
  | { ok: true; rows: LeaderboardRow[] }
  | { ok: false; message: string; detail?: string };

/** Bảng xếp hạng (từ RPC definer — staff mới đọc được). */
export async function getLeaderboard(): Promise<LeaderboardResult> {
  if (!isSupabaseConfigured) return failWith(NOT_CONFIGURED.message, NOT_CONFIGURED.detail);
  const supabase = await createClient();
  if (!supabase) return failWith(NOT_CONFIGURED.message, NOT_CONFIGURED.detail);

  const { data, error } = await supabase.rpc("collab_leaderboard");
  if (error) return failWith("Không đọc được bảng xếp hạng.", error.message);
  return { ok: true, rows: (data ?? []) as LeaderboardRow[] };
}

/** Danh mục huy chương (staff). */
export async function getMedals(
  activeOnly = false,
): Promise<AdminResult<Medal>> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const supabase = await createClient();
  if (!supabase) return NOT_CONFIGURED;

  let query = supabase.from("medals").select("*").order("sort_order");
  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) return failWith("Không đọc được danh mục huy chương.", error.message);
  return { ok: true, rows: (data ?? []) as Medal[] };
}

export type MedalAward = ProfileMedalWithMedal;

/** Huy chương đã trao, kèm thông tin huy chương. */
export async function getAwardedMedals(
  profileId?: string,
): Promise<AdminResult<MedalAward>> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const supabase = await createClient();
  if (!supabase) return NOT_CONFIGURED;

  let query = supabase
    .from("profile_medals")
    .select("*, medals(*)")
    .order("awarded_at", { ascending: false });
  if (profileId) query = query.eq("profile_id", profileId);

  const { data, error } = await query;
  if (error) return failWith("Không đọc được huy chương.", error.message);
  return { ok: true, rows: (data ?? []) as MedalAward[] };
}

export type ContributionFilters = {
  profileId?: string;
  taskId?: string;
  source?: ContributionSource | "";
  page?: number;
  pageSize?: number;
};

export type ContributionListResult =
  | { ok: true; rows: ContributionEntry[]; total: number; page: number; pageSize: number }
  | { ok: false; message: string; detail?: string };

/** Sổ điểm đóng góp (kèm tên người nhận/giao qua map ở UI). */
export async function getContributions(
  filters: ContributionFilters = {},
): Promise<ContributionListResult> {
  if (!isSupabaseConfigured) return failWith(NOT_CONFIGURED.message, NOT_CONFIGURED.detail);
  const supabase = await createClient();
  if (!supabase) return failWith(NOT_CONFIGURED.message, NOT_CONFIGURED.detail);

  const pageSize = Math.min(Math.max(filters.pageSize ?? 20, 1), 100);
  const page = Math.max(filters.page ?? 1, 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("contribution_ledger").select("*", { count: "exact" });
  if (filters.profileId) query = query.eq("profile_id", filters.profileId);
  if (filters.taskId) query = query.eq("task_id", filters.taskId);
  if (filters.source) query = query.eq("source", filters.source);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return failWith("Không đọc được sổ điểm đóng góp.", error.message);
  return {
    ok: true,
    rows: (data ?? []) as ContributionEntry[],
    total: count ?? (data ?? []).length,
    page,
    pageSize,
  };
}

/** Ánh xạ task_id → tiêu đề, để hiển thị nguồn điểm trong sổ. */
export async function getTaskTitleMap(ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return map;
  if (!isSupabaseConfigured) return map;
  const supabase = await createClient();
  if (!supabase) return map;

  const { data } = await supabase.from("tasks").select("id, title").in("id", unique);
  for (const t of (data ?? []) as { id: string; title: string }[]) {
    map.set(t.id, t.title);
  }
  return map;
}

/** Tổng điểm + số huy chương của một người (RPC collab_totals). */
export async function getMyTotals(
  profileId: string,
): Promise<{ ok: true; totalPoints: number; totalMedals: number } | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("collab_totals", {
    p_profile: profileId,
  });
  if (error) return null;
  const row = (data as { total_points?: number; total_medals?: number }[] | null)?.[0];
  return {
    ok: true,
    totalPoints: Number(row?.total_points ?? 0),
    totalMedals: Number(row?.total_medals ?? 0),
  };
}

/* ------------------------------------------------------------------ *
 * Giai đoạn 3 — Dự án & Hoạt động
 * ------------------------------------------------------------------ */

type ProjectListResult =
  | { ok: true; rows: ProjectWithLeader[]; total: number; page: number; pageSize: number }
  | { ok: false; message: string; detail?: string };

type EventListResult =
  | { ok: true; rows: EventWithProject[]; total: number; page: number; pageSize: number }
  | { ok: false; message: string; detail?: string };

function fmtFail(msg: string, detail?: string) {
  return { ok: false as const, message: msg, detail };
}

export async function getProjects({
  page = 1,
  pageSize = 20,
  status,
  search = "",
}: {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
} = {}): Promise<ProjectListResult> {
  if (!isSupabaseConfigured) return fmtFail("Chưa cấu hình Supabase.");
  const supabase = await createClient();
  if (!supabase) return fmtFail("Không tạo được kết nối Supabase.");

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let q = supabase
    .from("projects")
    .select("*, leader:profiles(id,full_name,avatar_url)", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(from, to);
  if (status) q = q.eq("status", status);
  if (search.trim()) q = q.or(`name.ilike.%${search.trim()}%,code.ilike.%${search.trim()}%`);
  const { data, error, count } = await q;
  if (error) return fmtFail("Không đọc được dự án.", error.message);
  return { ok: true, rows: data ?? [], total: count ?? (data ?? []).length, page, pageSize };
}

export async function getProject(id: string) {
  if (!isSupabaseConfigured) return { ok: false as const, message: "Chưa cấu hình Supabase." };
  const supabase = await createClient();
  if (!supabase) return { ok: false as const, message: "Không tạo được kết nối." };
  const { data, error } = await supabase
    .from("projects")
    .select("*, leader:profiles(id,full_name,avatar_url)")
    .eq("id", id)
    .maybeSingle();
  if (error) return { ok: false as const, message: error.message };
  if (!data) return { ok: false as const, message: "Không tìm thấy dự án." };
  return { ok: true as const, row: data };
}

export async function getProjectMembers(projectId: string) {
  if (!isSupabaseConfigured) return { ok: false as const, message: "Chưa cấu hình Supabase." };
  const supabase = await createClient();
  if (!supabase) return { ok: false as const, message: "Không tạo được kết nối." };
  const { data, error } = await supabase
    .from("project_members")
    .select("*, profile:profiles(id,full_name,email,avatar_url,role)")
    .eq("project_id", projectId)
    .order("role", { ascending: true });
  if (error) return { ok: false as const, message: error.message };
  return { ok: true as const, rows: data ?? [] };
}

export async function getEvents({
  page = 1,
  pageSize = 20,
  status,
  type,
  projectId,
  search = "",
}: {
  page?: number;
  pageSize?: number;
  status?: string;
  type?: string;
  projectId?: string;
  search?: string;
} = {}): Promise<EventListResult> {
  if (!isSupabaseConfigured) return fmtFail("Chưa cấu hình Supabase.");
  const supabase = await createClient();
  if (!supabase) return fmtFail("Không tạo được kết nối Supabase.");

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let q = supabase
    .from("events")
    .select("*, project:projects(id,name)", { count: "exact" })
    .order("start_at", { ascending: false })
    .range(from, to);
  if (status) q = q.eq("status", status);
  if (type) q = q.eq("type", type);
  if (projectId) q = q.eq("project_id", projectId);
  if (search.trim()) q = q.or(`name.ilike.%${search.trim()}%,code.ilike.%${search.trim()}%`);
  const { data, error, count } = await q;
  if (error) return fmtFail("Không đọc được hoạt động.", error.message);
  return { ok: true, rows: data ?? [], total: count ?? (data ?? []).length, page, pageSize };
}

export async function getEvent(id: string) {
  if (!isSupabaseConfigured) return { ok: false as const, message: "Chưa cấu hình Supabase." };
  const supabase = await createClient();
  if (!supabase) return { ok: false as const, message: "Không tạo được kết nối." };
  const { data, error } = await supabase
    .from("events")
    .select("*, project:projects(id,name)")
    .eq("id", id)
    .maybeSingle();
  if (error) return { ok: false as const, message: error.message };
  if (!data) return { ok: false as const, message: "Không tìm thấy hoạt động." };
  return { ok: true as const, row: data };
}

export async function getEventAttendees(eventId: string) {
  if (!isSupabaseConfigured) return { ok: false as const, message: "Chưa cấu hình Supabase." };
  const supabase = await createClient();
  if (!supabase) return { ok: false as const, message: "Không tạo được kết nối." };
  const { data, error } = await supabase
    .from("event_attendees")
    .select("*, profile:profiles(id,full_name,email,avatar_url)")
    .eq("event_id", eventId)
    .order("checked_in_at", { ascending: true });
  if (error) return { ok: false as const, message: error.message };
  return { ok: true as const, rows: data ?? [] };
}

export async function getEventRegistrations(eventId: string) {
  if (!isSupabaseConfigured) return { ok: false as const, message: "Chưa cấu hình Supabase." };
  const supabase = await createClient();
  if (!supabase) return { ok: false as const, message: "Không tạo được kết nối." };
  const { data, error } = await supabase
    .from("event_registrations")
    .select("*")
    .eq("event_id", eventId)
    .order("registered_at", { ascending: false });
  if (error) return { ok: false as const, message: error.message };
  return { ok: true as const, rows: data ?? [] };
}
