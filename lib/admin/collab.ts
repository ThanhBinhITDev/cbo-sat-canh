import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { NOT_CONFIGURED, type AdminResult } from "@/lib/admin/data";
import type {
  CollabMember,
  Task,
  TaskAssignee,
  TaskAssigneeRole,
  TaskAttachment,
  TaskCategory,
  TaskStatus,
  TaskUpdate,
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
