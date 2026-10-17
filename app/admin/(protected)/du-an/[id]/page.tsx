import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader, Panel, PanelHead, Field, EmptyState } from "@/components/admin/ui";
import { ToastForm } from "@/components/admin/ProfileForms";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { addProjectMember, deleteProject, removeProjectMember, saveProject } from "@/lib/admin/collab-actions";
import { getMembers, getProject, getProjectMembers } from "@/lib/admin/collab";
import { getSessionUser } from "@/lib/auth";
import { canManageCollab } from "@/lib/collab";
import { PROJECT_MEMBER_ROLE_LABELS, PROJECT_STATUS_LABELS } from "@/lib/types";
import { formatDate } from "@/lib/format";

export default async function ProjectDetailPage({
  params,
}: PageProps<"/admin/du-an/[id]">) {
  const user = await getSessionUser();
  if (!user?.profile || !canManageCollab(user.profile)) return null;
  const { id } = await params;
  const p = await getProject(id);
  if (!p.ok) notFound();
  const project = p.row;
  const [membersRes, pmRes] = await Promise.all([getMembers(), getProjectMembers(id)]);
  const members = membersRes.ok ? membersRes.rows : [];
  const pms = pmRes.ok ? pmRes.rows : [];

  return (
    <>
      <PageHeader
        title={project.name}
        description={project.code ? `Mã dự án: ${project.code}` : "Dự án"}
        action={
          <div className="flex gap-2">
            <Link href={`/admin/du-an/${id}/sua`} className="btn btn-ghost text-sm">
              Sửa dự án
            </Link>
            <Link href="/admin/du-an" className="btn btn-ghost text-sm">
              Quay lại
            </Link>
          </div>
        }
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel>
          <PanelHead title="Thông tin dự án" />
          <dl className="grid grid-cols-2 gap-3 px-5 py-4 text-sm">
            <div>
              <dt className="text-ink/60">Trạng thái</dt>
              <dd className="font-semibold">{PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS]}</dd>
            </div>
            <div>
              <dt className="text-ink/60">Thời gian</dt>
              <dd>
                {project.start_date ? formatDate(project.start_date) : "—"} – {project.end_date ? formatDate(project.end_date) : "—"}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-ink/60">Trưởng dự án</dt>
              <dd>{project.leader?.full_name ?? "—"}</dd>
            </div>
            {project.description && (
              <div className="col-span-2">
                <dt className="text-ink/60">Mô tả</dt>
                <dd className="whitespace-pre-wrap">{project.description}</dd>
              </div>
            )}
          </dl>
        </Panel>
        <Panel>
          <PanelHead title="Thành viên dự án" subtitle={`${pms.length} thành viên`} />
          <ToastForm action={addProjectMember} loading="Đang thêm..." className="flex flex-wrap items-end gap-2 border-b border-line px-5 py-3">
            <input type="hidden" name="project_id" value={id} />
            <Field label="Thành viên" required>
              <select name="profile_id" required className="select">
                <option value="">Chọn...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name || m.email}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Vai trò">
              <select name="role" className="select" defaultValue="member">
                <option value="lead">Trưởng nhóm</option>
                <option value="member">Thành viên</option>
                <option value="support">Hỗ trợ</option>
              </select>
            </Field>
            <button type="submit" className="btn btn-primary h-9 text-sm">
              Thêm
            </button>
          </ToastForm>
          {pms.length === 0 ? (
            <EmptyState title="Chưa có thành viên" description="Thêm thành viên vào dự án." />
          ) : (
            <ul className="divide-y divide-line">
              {pms.map((pm) => (
                <li key={pm.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{pm.profile?.full_name || pm.profile?.email}</p>
                    <p className="text-xs text-ink/60">
                      {PROJECT_MEMBER_ROLE_LABELS[pm.role as keyof typeof PROJECT_MEMBER_ROLE_LABELS]} · {pm.status}
                    </p>
                  </div>
                  <ToastForm action={removeProjectMember} loading="Đang xoá...">
                    <input type="hidden" name="id" value={pm.id} />
                    <ConfirmSubmit confirmText="Xoá thành viên khỏi dự án?">
                      Xoá
                    </ConfirmSubmit>
                  </ToastForm>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel className="xl:col-span-2">
          <PanelHead title="Công cụ quản trị" />
          <div className="px-5 py-4">
            <ToastForm action={deleteProject} loading="Đang xoá..." className="inline-block">
              <input type="hidden" name="id" value={id} />
              <ConfirmSubmit confirmText="Xoá dự án này? Thao tác không thể hoàn tác." danger>
                Xoá dự án
              </ConfirmSubmit>
            </ToastForm>
          </div>
        </Panel>
      </div>
    </>
  );
}
