import Link from "next/link";
import { PageHeader, Field } from "@/components/admin/ui";
import { ToastForm } from "@/components/admin/ProfileForms";
import { saveEvent } from "@/lib/admin/collab-actions";
import { getMembers, getProjects } from "@/lib/admin/collab";
import { getSessionUser } from "@/lib/auth";
import { canManageCollab } from "@/lib/collab";
import { EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from "@/lib/types";

export default async function NewEventPage() {
  const user = await getSessionUser();
  if (!user?.profile || !canManageCollab(user.profile)) return null;
  const [projects, members] = await Promise.all([getProjects({ pageSize: 100 }), getMembers()]);
  const prows = projects.ok ? projects.rows : [];
  const mrows = members.ok ? members.rows : [];

  return (
    <>
      <PageHeader
        title="Thêm hoạt động"
        description="Tạo sự kiện/tập huấn mới để theo dõi tham dự."
        action={
          <Link href="/admin/hoat-dong" className="btn btn-ghost text-sm">
            Quay lại
          </Link>
        }
      />
      <div className="card max-w-4xl">
        <ToastForm action={saveEvent} loading="Đang lưu hoạt động..." className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tên hoạt động" required>
              <input name="name" required maxLength={160} className="input" />
            </Field>
            <Field label="Mã">
              <input name="code" maxLength={60} className="input" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Loại">
              <select name="type" className="select" defaultValue="other">
                {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Trạng thái">
              <select name="status" className="select" defaultValue="draft">
                {Object.entries(EVENT_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sức chứa">
              <input type="number" name="capacity" min={0} className="input" placeholder="Không giới hạn" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bắt đầu">
              <input type="datetime-local" name="start_at" className="input" />
            </Field>
            <Field label="Kết thúc">
              <input type="datetime-local" name="end_at" className="input" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Thuộc dự án">
              <select name="project_id" className="select" defaultValue="">
                <option value="">Không gắn dự án</option>
                {prows.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Đơn vị tổ chức/người phụ trách">
              <select name="organizer_id" className="select" defaultValue="">
                <option value="">Chọn...</option>
                {mrows.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name || m.email}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Địa điểm">
            <input name="location" maxLength={200} className="input" />
          </Field>
          <Field label="Ảnh bìa (URL)">
            <input name="cover_url" className="input" />
          </Field>
          <Field label="Mô tả">
            <textarea name="description" rows={3} maxLength={2000} className="textarea input" />
          </Field>
          <Field label="Ghi chú nội bộ">
            <textarea name="internal_note" rows={2} maxLength={2000} className="textarea input" />
          </Field>
          <button type="submit" className="btn btn-primary w-full py-2.5 text-sm">
            Lưu hoạt động
          </button>
        </ToastForm>
      </div>
    </>
  );
}
