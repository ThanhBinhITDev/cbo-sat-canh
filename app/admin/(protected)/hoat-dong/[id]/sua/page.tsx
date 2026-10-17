import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader, Field } from "@/components/admin/ui";
import { ToastForm } from "@/components/admin/ProfileForms";
import { saveEvent } from "@/lib/admin/collab-actions";
import { getEvent, getMembers, getProjects } from "@/lib/admin/collab";
import { getSessionUser } from "@/lib/auth";
import { canManageCollab } from "@/lib/collab";
import { EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from "@/lib/types";

function toInput(dt: string | null) {
  if (!dt) return "";
  try {
    const d = new Date(dt);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

export default async function EditEventPage({
  params,
}: PageProps<"/admin/hoat-dong/[id]/sua">) {
  const user = await getSessionUser();
  if (!user?.profile || !canManageCollab(user.profile)) return null;
  const { id } = await params;
  const e = await getEvent(id);
  if (!e.ok) notFound();
  const event = e.row;
  const [projects, members] = await Promise.all([getProjects({ pageSize: 100 }), getMembers()]);
  const prows = projects.ok ? projects.rows : [];
  const mrows = members.ok ? members.rows : [];

  return (
    <>
      <PageHeader
        title="Sửa hoạt động"
        description={`Chỉnh sửa hoạt động: ${event.name}`}
        action={
          <Link href={`/admin/hoat-dong/${id}`} className="btn btn-ghost text-sm">
            Quay lại
          </Link>
        }
      />
      <div className="card max-w-4xl">
        <ToastForm action={saveEvent} loading="Đang lưu hoạt động..." className="space-y-4 p-5">
          <input type="hidden" name="id" value={event.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tên hoạt động" required>
              <input name="name" required defaultValue={event.name} maxLength={160} className="input" />
            </Field>
            <Field label="Mã">
              <input name="code" defaultValue={event.code ?? ""} maxLength={60} className="input" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Loại">
              <select name="type" className="select" defaultValue={event.type}>
                {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Trạng thái">
              <select name="status" className="select" defaultValue={event.status}>
                {Object.entries(EVENT_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sức chứa">
              <input type="number" name="capacity" min={0} defaultValue={event.capacity ?? ""} className="input" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bắt đầu">
              <input type="datetime-local" name="start_at" defaultValue={toInput(event.start_at)} className="input" />
            </Field>
            <Field label="Kết thúc">
              <input type="datetime-local" name="end_at" defaultValue={toInput(event.end_at)} className="input" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Thuộc dự án">
              <select name="project_id" className="select" defaultValue={event.project_id ?? ""}>
                <option value="">Không gắn dự án</option>
                {prows.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Đơn vị tổ chức/người phụ trách">
              <select name="organizer_id" className="select" defaultValue={event.organizer_id ?? ""}>
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
            <input name="location" maxLength={200} defaultValue={event.location ?? ""} className="input" />
          </Field>
          <Field label="Ảnh bìa (URL)">
            <input name="cover_url" defaultValue={event.cover_url ?? ""} className="input" />
          </Field>
          <Field label="Mô tả">
            <textarea name="description" rows={3} defaultValue={event.description ?? ""} maxLength={2000} className="textarea input" />
          </Field>
          <Field label="Ghi chú nội bộ">
            <textarea name="internal_note" rows={2} defaultValue={event.internal_note ?? ""} maxLength={2000} className="textarea input" />
          </Field>
          <button type="submit" className="btn btn-primary w-full py-2.5 text-sm">
            Lưu thay đổi
          </button>
        </ToastForm>
      </div>
    </>
  );
}
