import Link from "next/link";
import { Field } from "@/components/admin/ui";
import { ToastForm } from "@/components/admin/ProfileForms";
import { saveTask } from "@/lib/admin/collab-actions";
import {
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_ORDER,
  ROLE_LABELS,
  type CollabMember,
  type Task,
  type TaskCategory,
} from "@/lib/types";

/** Biểu mẫu giao/sửa nhiệm vụ (chỉ hiển thị cho người có quyền quản lý). */
export default function TaskForm({
  task,
  categories,
  members,
  selectedAssigneeIds = [],
}: {
  task?: Task | null;
  categories: TaskCategory[];
  members: CollabMember[];
  selectedAssigneeIds?: string[];
}) {
  const selected = new Set(selectedAssigneeIds);

  return (
    <ToastForm
      action={saveTask}
      loading={task ? "Đang cập nhật nhiệm vụ..." : "Đang giao nhiệm vụ..."}
      className="space-y-4 p-5"
    >
      {task && <input type="hidden" name="id" value={task.id} />}

      <Field label="Tiêu đề nhiệm vụ" required>
        <input
          name="title"
          defaultValue={task?.title ?? ""}
          required
          maxLength={300}
          placeholder="Ví dụ: Viết bài truyền thông tháng 11"
          className="input"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Danh mục">
          <select name="category_id" defaultValue={task?.category_id ?? ""} className="select">
            <option value="">— Không chọn —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Mức ưu tiên">
          <select name="priority" defaultValue={task?.priority ?? "normal"} className="select">
            {TASK_PRIORITY_ORDER.map((p) => (
              <option key={p} value={p}>
                {TASK_PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ngày bắt đầu">
          <input
            type="date"
            name="start_date"
            defaultValue={task?.start_date ?? ""}
            className="input"
          />
        </Field>
        <Field label="Hạn hoàn thành">
          <input
            type="date"
            name="due_date"
            defaultValue={task?.due_date ?? ""}
            className="input"
          />
        </Field>
      </div>

      <Field label="Mô tả công việc">
        <textarea
          name="description"
          defaultValue={task?.description ?? ""}
          rows={3}
          maxLength={5000}
          className="input"
        />
      </Field>

      <Field label="Tiêu chí nghiệm thu" hint="Kết quả thế nào thì được coi là hoàn thành">
        <textarea
          name="acceptance_criteria"
          defaultValue={task?.acceptance_criteria ?? ""}
          rows={2}
          maxLength={5000}
          className="input"
        />
      </Field>

      <Field label="Ghi chú nội bộ" hint="Chỉ người quản lý thấy trong trang quản trị">
        <textarea
          name="internal_note"
          defaultValue={task?.internal_note ?? ""}
          rows={2}
          maxLength={5000}
          className="input"
        />
      </Field>

      <Field label="Điểm dự kiến" hint="Điểm đóng góp khi hoàn thành (dùng ở giai đoạn sau)">
        <input
          type="number"
          name="points_estimated"
          defaultValue={task?.points_estimated ?? 0}
          min={0}
          className="input"
        />
      </Field>

      <div>
        <p className="field-label">Người thực hiện</p>
        {members.length === 0 ? (
          <p className="hint">Chưa có thành viên nào.</p>
        ) : (
          <div className="mt-1 grid gap-2 sm:grid-cols-2">
            {members.map((m) => (
              <label
                key={m.id}
                className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  name="assignees"
                  value={m.id}
                  defaultChecked={selected.has(m.id)}
                  className="h-4 w-4 accent-[var(--brand-primary)]"
                />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{m.full_name || m.email}</span>
                  <span className="block text-xs text-ink/60">
                    {ROLE_LABELS[m.role]}
                    {!m.is_active && " · đã khoá"}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
        <p className="hint">Người được giao sẽ thấy việc trong mục “Việc của tôi”.</p>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn btn-primary flex-1 py-2.5 text-sm">
          {task ? "Lưu thay đổi" : "Giao nhiệm vụ"}
        </button>
        <Link href="/admin/nhiem-vu" className="btn btn-ghost py-2.5 text-sm">
          Huỷ
        </Link>
      </div>
    </ToastForm>
  );
}
