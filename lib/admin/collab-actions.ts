"use server";

import { revalidatePath } from "next/cache";
import { requireRole, AuthError } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/admin/actions";
import type { ContributionSource, MedalTier, TaskPriority, TaskStatus } from "@/lib/types";

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

function text(v: FormDataEntryValue | null, fallback = "") {
  if (typeof v !== "string") return fallback;
  return v.trim();
}

function str(v: FormDataEntryValue | null, max = 10_000) {
  return text(v).slice(0, max);
}

function num(v: FormDataEntryValue | null, fallback = 0) {
  const n = Number(text(v, String(fallback)));
  return Number.isFinite(n) ? n : fallback;
}

function bool(v: FormDataEntryValue | null) {
  return v === "on" || v === "true" || v === "1";
}

/** Bọc thân action → luôn trả ActionState (không làm trắng trang). */
async function wrap(label: string, fn: () => Promise<ActionState>): Promise<ActionState> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AuthError) {
      return {
        ok: false,
        message:
          e.code === "forbidden"
            ? "Bạn không có quyền thực hiện thao tác này."
            : "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      };
    }
    const detail = e instanceof Error ? e.message : String(e);
    console.error(`[collab:${label}]`, e);
    return { ok: false, message: `Có lỗi khi ${label}: ${detail.slice(0, 200)}` };
  }
}

/** Người dùng hiện tại phải có quyền quản lý cộng tác (admin hoặc cờ). */
async function requireManager() {
  const user = await requireRole(["admin", "editor", "collaborator"]);
  const profile = user.profile;
  if (!profile || !profile.is_active || !(profile.role === "admin" || profile.can_manage_tasks)) {
    throw new AuthError("forbidden");
  }
  return user;
}

function revalidateCollab(taskId?: string) {
  revalidatePath("/admin/nhiem-vu");
  revalidatePath("/admin/viec-cua-toi");
  if (taskId) revalidatePath(`/admin/nhiem-vu/${taskId}`);
}

const PRIORITIES: TaskPriority[] = ["low", "normal", "high", "urgent"];

function rpcMessage(message: string): string {
  if (/invalid_transition/.test(message))
    return "Trạng thái hiện tại không cho phép thao tác này.";
  if (/forbidden/.test(message)) return "Bạn không có quyền thực hiện thao tác này.";
  if (/task_not_found/.test(message)) return "Không tìm thấy nhiệm vụ.";
  if (/unauthenticated/.test(message)) return "Phiên đăng nhập đã hết hạn.";
  return `Không thực hiện được: ${message}`;
}

/* ------------------------------------------------------------------ *
 * Nhiệm vụ
 * ------------------------------------------------------------------ */

export async function saveTask(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  return wrap("lưu nhiệm vụ", async () => {
    const user = await requireManager();
    const supabase = await createClient();
    if (!supabase) return { ok: false, message: "Chưa cấu hình Supabase." };

    const id = str(formData.get("id"));
    const title = str(formData.get("title"), 300);
    if (!title) return { ok: false, message: "Vui lòng nhập tiêu đề nhiệm vụ." };

    const priority = str(formData.get("priority")) as TaskPriority;
    if (!PRIORITIES.includes(priority)) {
      return { ok: false, message: "Mức ưu tiên không hợp lệ." };
    }

    const categoryId = str(formData.get("category_id")) || null;
    const startDate = str(formData.get("start_date")) || null;
    const dueDate = str(formData.get("due_date")) || null;
    if (startDate && dueDate && startDate > dueDate) {
      return { ok: false, message: "Hạn hoàn thành phải sau ngày bắt đầu." };
    }

    const row = {
      title,
      description: str(formData.get("description"), 5000) || null,
      category_id: categoryId,
      priority,
      start_date: startDate,
      due_date: dueDate,
      acceptance_criteria: str(formData.get("acceptance_criteria"), 5000) || null,
      internal_note: str(formData.get("internal_note"), 5000) || null,
      points_estimated: Math.max(0, num(formData.get("points_estimated"), 0)),
    };

    let taskId = id;
    if (id) {
      const { error } = await supabase.from("tasks").update(row).eq("id", id);
      if (error) return { ok: false, message: `Không lưu được: ${error.message}` };
    } else {
      const { data, error } = await supabase
        .from("tasks")
        .insert({ ...row, created_by: user.id, status: "assigned" })
        .select("id")
        .single();
      if (error) return { ok: false, message: `Không tạo được: ${error.message}` };
      taskId = (data as { id: string }).id;
    }

    // Đồng bộ người được giao (giữ nguyên trạng thái của người đã có).
    const desired = Array.from(
      new Set(formData.getAll("assignees").map((v) => text(v)).filter(Boolean)),
    );
    const { data: current } = await supabase
      .from("task_assignees")
      .select("id, profile_id")
      .eq("task_id", taskId);
    const currentRows = (current ?? []) as { id: string; profile_id: string }[];
    const currentIds = currentRows.map((r) => r.profile_id);

    const toRemove = currentRows.filter((r) => !desired.includes(r.profile_id)).map((r) => r.id);
    const toAdd = desired.filter((p) => !currentIds.includes(p));

    if (toRemove.length) {
      const { error } = await supabase.from("task_assignees").delete().in("id", toRemove);
      if (error) return { ok: false, message: `Không cập nhật người thực hiện: ${error.message}` };
    }
    if (toAdd.length) {
      const { error } = await supabase
        .from("task_assignees")
        .insert(toAdd.map((profileId) => ({ task_id: taskId, profile_id: profileId })));
      if (error) return { ok: false, message: `Không thêm người thực hiện: ${error.message}` };
    }

    // Đồng bộ ảnh đính kèm (giữ loại 'reference'; loại 'result' do RPC tạo).
    const urls = formData
      .getAll("attachment_url")
      .map((v) => text(v))
      .filter(Boolean);
    const names = formData.getAll("attachment_name").map((v) => text(v));
    const desiredAtt = urls.map((url, i) => ({ url, name: names[i] || "" }));

    const { data: curAtt } = await supabase
      .from("task_attachments")
      .select("id, url, kind")
      .eq("task_id", taskId);
    const curAttRows = (curAtt ?? []) as { id: string; url: string; kind: string }[];
    const curRefUrls = new Set(curAttRows.filter((r) => r.kind === "reference").map((r) => r.url));
    const desiredUrls = new Set(desiredAtt.map((a) => a.url));

    const attRemove = curAttRows
      .filter((r) => r.kind === "reference" && !desiredUrls.has(r.url))
      .map((r) => r.id);
    const attAdd = desiredAtt.filter((a) => !curRefUrls.has(a.url));

    if (attRemove.length) {
      const { error } = await supabase.from("task_attachments").delete().in("id", attRemove);
      if (error) return { ok: false, message: `Không cập nhật được ảnh: ${error.message}` };
    }
    if (attAdd.length) {
      const { error } = await supabase
        .from("task_attachments")
        .insert(
          attAdd.map((a) => ({
            task_id: taskId,
            name: a.name || null,
            url: a.url,
            kind: "reference",
            uploaded_by: user.id,
          })),
        );
      if (error) return { ok: false, message: `Không thêm được ảnh: ${error.message}` };
    }

    revalidateCollab(taskId);
    return { ok: true, message: id ? "Đã cập nhật nhiệm vụ." : "Đã giao nhiệm vụ." };
  });
}

export async function deleteTask(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  return wrap("xoá nhiệm vụ", async () => {
    await requireRole(["admin"]);
    const supabase = await createClient();
    if (!supabase) return { ok: false, message: "Chưa cấu hình Supabase." };

    const id = str(formData.get("id"));
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) return { ok: false, message: `Không xoá được: ${error.message}` };

    revalidateCollab(id);
    return { ok: true, message: "Đã xoá nhiệm vụ." };
  });
}

/**
 * Chuyển trạng thái nhiệm vụ qua RPC definer — server tự kiểm tra quyền và
 * máy trạng thái; KHÔNG tin dữ liệu trạng thái do client gửi.
 */
export async function transitionTask(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  return wrap("cập nhật nhiệm vụ", async () => {
    await requireRole(["admin", "editor", "collaborator"]);
    const supabase = await createClient();
    if (!supabase) return { ok: false, message: "Chưa cấu hình Supabase." };

    const task = str(formData.get("task"));
    const action = str(formData.get("action"));
    const note = str(formData.get("note"), 5000);
    const url = str(formData.get("url"), 2000);

    if (!task || !action) return { ok: false, message: "Thiếu thông tin thao tác." };

    const { data, error } = await supabase.rpc("collab_transition_task", {
      p_task: task,
      p_action: action,
      p_note: note || null,
      p_url: url || null,
    });
    if (error) return { ok: false, message: rpcMessage(error.message) };

    const status = (data as { status?: TaskStatus } | null)?.status;
    revalidateCollab(task);
    return { ok: true, message: status ? `Đã cập nhật: ${status}.` : "Đã cập nhật nhiệm vụ." };
  });
}

/* ------------------------------------------------------------------ *
 * Danh mục nhiệm vụ
 * ------------------------------------------------------------------ */

export async function saveTaskCategory(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  return wrap("lưu danh mục", async () => {
    await requireManager();
    const supabase = await createClient();
    if (!supabase) return { ok: false, message: "Chưa cấu hình Supabase." };

    const original = str(formData.get("original"), 60);
    const label = str(formData.get("label"), 120);
    if (!label) return { ok: false, message: "Vui lòng nhập tên danh mục." };

    const key = (str(formData.get("key"), 60) || original)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    if (!key) return { ok: false, message: "Mã danh mục không hợp lệ (dùng chữ và số)." };

    const row = {
      key,
      label,
      description: str(formData.get("description"), 500) || null,
      sort_order: num(formData.get("sort_order"), 0),
      is_active: bool(formData.get("is_active")),
    };

    if (original) {
      const { error } = await supabase.from("task_categories").update(row).eq("key", original);
      if (error) return { ok: false, message: `Không lưu được: ${error.message}` };
    } else {
      const { error } = await supabase
        .from("task_categories")
        .upsert(row, { onConflict: "key", ignoreDuplicates: false });
      if (error) return { ok: false, message: `Không lưu được: ${error.message}` };
    }

    revalidatePath("/admin/nhiem-vu");
    return { ok: true, message: original ? "Đã cập nhật danh mục." : "Đã thêm danh mục." };
  });
}

export async function deleteTaskCategory(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  return wrap("xoá danh mục", async () => {
    await requireManager();
    const supabase = await createClient();
    if (!supabase) return { ok: false, message: "Chưa cấu hình Supabase." };

    const key = str(formData.get("key"), 60);
    const { error } = await supabase.from("task_categories").delete().eq("key", key);
    if (error) return { ok: false, message: `Không xoá được: ${error.message}` };

    revalidatePath("/admin/nhiem-vu");
    return { ok: true, message: "Đã xoá danh mục." };
  });
}

/* ------------------------------------------------------------------ *
 * Giai đoạn 2 — Điểm đóng góp, huy chương
 * ------------------------------------------------------------------ */

const TIERS: MedalTier[] = ["bronze", "silver", "gold", "platinum"];
const SOURCES: ContributionSource[] = ["task", "manual", "event", "other"];

function revalidateAchievements() {
  revalidatePath("/admin/dong-gop");
  revalidatePath("/admin/huy-chuong");
  revalidatePath("/admin/xep-hang");
}

async function audit(actorId: string, action: string, table: string, recordId: string, payload: Record<string, unknown>) {
  try {
    const supabase = await createClient();
    if (!supabase) return;
    await supabase.from("audit_log").insert({
      actor_id: actorId,
      action,
      table_name: table,
      record_id: recordId,
      payload,
    });
  } catch {
    /* audit không được chặn thao tác chính */
  }
}

/**
 * Trao điểm cho nhiệm vụ đã hoàn thành: mỗi người thực hiện nhận `points`
 * (ghi vào sổ điểm và cộng vào điểm đã trao của người đó).
 */
export async function awardTaskPoints(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  return wrap("trao điểm nhiệm vụ", async () => {
    const user = await requireManager();
    const supabase = await createClient();
    if (!supabase) return { ok: false, message: "Chưa cấu hình Supabase." };

    const taskId = str(formData.get("task_id"));
    const points = Math.trunc(num(formData.get("points"), 0));
    const note = str(formData.get("note"), 500) || null;

    if (!taskId) return { ok: false, message: "Thiếu thông tin nhiệm vụ." };
    if (!points || points <= 0) return { ok: false, message: "Số điểm phải lớn hơn 0." };

    const { data: task } = await supabase
      .from("tasks")
      .select("id, status, title")
      .eq("id", taskId)
      .maybeSingle();
    if (!task) return { ok: false, message: "Không tìm thấy nhiệm vụ." };
    if ((task as { status: string }).status !== "completed") {
      return { ok: false, message: "Chỉ trao điểm cho nhiệm vụ đã hoàn thành." };
    }

    const { data: assigns } = await supabase
      .from("task_assignees")
      .select("id, profile_id, points_awarded")
      .eq("task_id", taskId);
    const rows = (assigns ?? []) as { id: string; profile_id: string; points_awarded: number }[];
    if (rows.length === 0) return { ok: false, message: "Nhiệm vụ chưa có người thực hiện." };

    const { error: insErr } = await supabase.from("contribution_ledger").insert(
      rows.map((r) => ({
        profile_id: r.profile_id,
        points,
        source: "task",
        task_id: taskId,
        note,
        awarded_by: user.id,
      })),
    );
    if (insErr) return { ok: false, message: `Không ghi được điểm: ${insErr.message}` };

    for (const r of rows) {
      const { error } = await supabase
        .from("task_assignees")
        .update({ points_awarded: (r.points_awarded ?? 0) + points })
        .eq("id", r.id);
      if (error) return { ok: false, message: `Không cập nhật điểm: ${error.message}` };
    }

    await audit(user.id, "points.award_task", "tasks", taskId, {
      points,
      assignees: rows.length,
    });

    revalidateAchievements();
    revalidateCollab(taskId);
    return { ok: true, message: `Đã trao ${points} điểm cho ${rows.length} người thực hiện.` };
  });
}

/** Ghi điểm tay cho một người (sự kiện, hỗ trợ ngoài nhiệm vụ). */
export async function awardManualPoints(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  return wrap("ghi điểm", async () => {
    const user = await requireManager();
    const supabase = await createClient();
    if (!supabase) return { ok: false, message: "Chưa cấu hình Supabase." };

    const profileId = str(formData.get("profile_id"));
    const points = Math.trunc(num(formData.get("points"), 0));
    const note = str(formData.get("note"), 500) || null;
    const source = str(formData.get("source")) as ContributionSource;

    if (!profileId) return { ok: false, message: "Chưa chọn người nhận điểm." };
    if (!points || points === 0) return { ok: false, message: "Số điểm không được bằng 0." };
    if (!SOURCES.includes(source)) return { ok: false, message: "Nguồn điểm không hợp lệ." };

    const { error } = await supabase.from("contribution_ledger").insert({
      profile_id: profileId,
      points,
      source,
      note,
      awarded_by: user.id,
    });
    if (error) return { ok: false, message: `Không ghi được điểm: ${error.message}` };

    await audit(user.id, "points.award_manual", "contribution_ledger", profileId, {
      points,
      source,
    });

    revalidateAchievements();
    return { ok: true, message: `Đã ghi ${points} điểm.` };
  });
}

/** Hoàn tác một dòng điểm (chỉ admin). */
export async function deleteContribution(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  return wrap("xóa điểm", async () => {
    const user = await requireRole(["admin"]);
    const supabase = await createClient();
    if (!supabase) return { ok: false, message: "Chưa cấu hình Supabase." };

    const id = str(formData.get("id"));
    const { error } = await supabase.from("contribution_ledger").delete().eq("id", id);
    if (error) return { ok: false, message: `Không xóa được: ${error.message}` };

    await audit(user.id, "points.revoke", "contribution_ledger", id, {});
    revalidateAchievements();
    return { ok: true, message: "Đã xóa dòng điểm." };
  });
}

/** Trao huy chương cho một người (chỉ admin). */
export async function awardMedal(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  return wrap("trao huy chương", async () => {
    const user = await requireRole(["admin"]);
    const supabase = await createClient();
    if (!supabase) return { ok: false, message: "Chưa cấu hình Supabase." };

    const profileId = str(formData.get("profile_id"));
    const medalId = str(formData.get("medal_id"));
    const note = str(formData.get("note"), 500) || null;

    if (!profileId || !medalId) return { ok: false, message: "Thiếu thông tin trao huy chương." };

    const { data, error } = await supabase
      .from("profile_medals")
      .upsert(
        { profile_id: profileId, medal_id: medalId, note, awarded_by: user.id },
        { onConflict: "profile_id,medal_id", ignoreDuplicates: true },
      )
      .select("id");
    if (error) return { ok: false, message: `Không trao được: ${error.message}` };
    if (!data || data.length === 0) {
      return { ok: false, message: "Người này đã có huy chương đó." };
    }

    await audit(user.id, "medal.award", "profile_medals", profileId, { medal_id: medalId });
    revalidateAchievements();
    return { ok: true, message: "Đã trao huy chương." };
  });
}

/** Rút huy chương đã trao (chỉ admin). */
export async function revokeMedal(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  return wrap("rút huy chương", async () => {
    const user = await requireRole(["admin"]);
    const supabase = await createClient();
    if (!supabase) return { ok: false, message: "Chưa cấu hình Supabase." };

    const id = str(formData.get("id"));
    const { error } = await supabase.from("profile_medals").delete().eq("id", id);
    if (error) return { ok: false, message: `Không rút được: ${error.message}` };

    await audit(user.id, "medal.revoke", "profile_medals", id, {});
    revalidateAchievements();
    return { ok: true, message: "Đã rút huy chương." };
  });
}

/** Thêm/sửa danh mục huy chương (chỉ admin). */
export async function saveMedal(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  return wrap("lưu huy chương", async () => {
    const user = await requireRole(["admin"]);
    const supabase = await createClient();
    if (!supabase) return { ok: false, message: "Chưa cấu hình Supabase." };

    const id = str(formData.get("id"));
    const key = str(formData.get("key"), 60)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const name = str(formData.get("name"), 120);
    const description = str(formData.get("description"), 500) || null;
    const tier = str(formData.get("tier")) as MedalTier;
    const threshold = Math.max(0, Math.trunc(num(formData.get("threshold_points"), 0)));
    const sortOrder = Math.trunc(num(formData.get("sort_order"), 0));

    if (!name) return { ok: false, message: "Vui lòng nhập tên huy chương." };
    if (!key) return { ok: false, message: "Mã huy chương không hợp lệ (dùng chữ và số)." };
    if (!TIERS.includes(tier)) return { ok: false, message: "Cấp bậc không hợp lệ." };

    const row = {
      key,
      name,
      description,
      tier,
      threshold_points: threshold,
      sort_order: sortOrder,
      is_active: bool(formData.get("is_active")),
    };

    if (id) {
      const { error } = await supabase.from("medals").update(row).eq("id", id);
      if (error) return { ok: false, message: `Không lưu được: ${error.message}` };
    } else {
      const { error } = await supabase
        .from("medals")
        .upsert(row, { onConflict: "key", ignoreDuplicates: false });
      if (error) return { ok: false, message: `Không lưu được: ${error.message}` };
    }

    await audit(user.id, id ? "medal.update" : "medal.create", "medals", id || key, { key });
    revalidateAchievements();
    return { ok: true, message: id ? "Đã cập nhật huy chương." : "Đã thêm huy chương." };
  });
}

/** Xóa danh mục huy chương (chỉ admin; huy chương đã trao sẽ bị xóa theo). */
export async function deleteMedal(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  return wrap("xóa huy chương", async () => {
    const user = await requireRole(["admin"]);
    const supabase = await createClient();
    if (!supabase) return { ok: false, message: "Chưa cấu hình Supabase." };

    const id = str(formData.get("id"));
    const { error } = await supabase.from("medals").delete().eq("id", id);
    if (error) return { ok: false, message: `Không xóa được: ${error.message}` };

    await audit(user.id, "medal.delete", "medals", id, {});
    revalidateAchievements();
    return { ok: true, message: "Đã xóa huy chương." };
  });
}
