import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader, Field } from "@/components/admin/ui";
import { ToastForm } from "@/components/admin/ProfileForms";
import { saveProject } from "@/lib/admin/collab-actions";
import { getMembers, getProject } from "@/lib/admin/collab";
import { getSessionUser } from "@/lib/auth";
import { canManageCollab } from "@/lib/collab";
import { PROJECT_STATUS_LABELS } from "@/lib/types";

export default async function EditProjectPage({
  params,
}: PageProps<"/admin/du-an/[id]/sua">) {
  const user = await getSessionUser();
  if (!user?.profile || !canManageCollab(user.profile)) return null;
  const { id } = await params;
  const p = await getProject(id);
  if (!p.ok) notFound();
  const project = p.row;
  const members = await getMembers();
  const rows = members.ok ? members.rows : [];

  return (
    <>
      <PageHeader
        title="Sửa dự án"
        description={`Chỉnh sửa dự án: ${project.name}`}
        action={
          <Link href={`/admin/du-an/${id}`} className="btn btn-ghost text-sm">
            Quay lại
          </Link>
        }
      />
      <div className="card max-w-4xl">
        <ToastForm action={saveProject} loading="Đang lưu dự án..." className="space-y-4 p-5">
          <input type="hidden" name="id" value={project.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tên dự án" required>
              <input name="name" required defaultValue={project.name} maxLength={160} className="input" />
            </Field>
            <Field label="Mã dự án">
              <input name="code" defaultValue={project.code ?? ""} maxLength={60} className="input" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Trạng thái">
              <select name="status" className="select" defaultValue={project.status}>
                {Object.entries(PROJECT_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Ngày bắt đầu">
              <input type="date" name="start_date" defaultValue={project.start_date ?? ""} className="input" />
            </Field>
            <Field label="Ngày kết thúc">
              <input type="date" name="end_date" defaultValue={project.end_date ?? ""} className="input" />
            </Field>
          </div>
          <Field label="Trưởng dự án">
            <select name="leader_id" className="select" defaultValue={project.leader_id ?? ""}>
              <option value="">Chọn trưởng dự án…</option>
              {rows.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name || m.email}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ảnh bìa (URL)">
            <input name="cover_url" defaultValue={project.cover_url ?? ""} className="input" />
          </Field>
          <Field label="Mô tả ngắn">
            <textarea name="description" rows={3} defaultValue={project.description ?? ""} maxLength={2000} className="textarea input" />
          </Field>
          <Field label="Ghi chú nội bộ">
            <textarea name="internal_note" rows={2} defaultValue={project.internal_note ?? ""} maxLength={2000} className="textarea input" />
          </Field>
          <button type="submit" className="btn btn-primary w-full py-2.5 text-sm">
            Lưu thay đổi
          </button>
        </ToastForm>
      </div>
    </>
  );
}
