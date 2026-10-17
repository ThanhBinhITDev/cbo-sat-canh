import type { Profile, TaskStatus } from "@/lib/types";

/**
 * Quyền quản lý cộng tác: admin luôn được; các vai trò khác cần cờ
 * `can_manage_tasks` do admin cấp và tài khoản đang hoạt động.
 * Phải khớp với hàm public.can_manage_collab() ở database.
 */
export function canManageCollab(
  profile?: Pick<Profile, "role" | "can_manage_tasks" | "is_active"> | null,
): boolean {
  if (!profile || !profile.is_active) return false;
  return profile.role === "admin" || profile.can_manage_tasks;
}

/** Lớp màu badge theo trạng thái nhiệm vụ (khớp các class .badge-* trong globals.css). */
export const TASK_STATUS_BADGE: Record<TaskStatus, string> = {
  assigned: "badge-gray",
  accepted: "badge-blue",
  in_progress: "badge-blue",
  submitted: "badge-yellow",
  needs_revision: "badge-red",
  completed: "badge-green",
  cancelled: "badge-gray",
};

/** Các bước chuyển trạng thái hợp lệ — dùng để ẩn/hiện nút cho đúng. */
export const NEXT_ACTIONS: Record<TaskStatus, string[]> = {
  assigned: ["accept"],
  accepted: ["progress", "submit"],
  in_progress: ["submit"],
  submitted: [],
  needs_revision: ["accept", "progress", "submit"],
  completed: [],
  cancelled: [],
};
