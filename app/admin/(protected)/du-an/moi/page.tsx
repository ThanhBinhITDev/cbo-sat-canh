import Link from "next/link";
import { PageHeader, Field, Toggle } from "@/components/admin/ui";
import { ToastForm } from "@/components/admin/ProfileForms";
import { saveProject } from "@/lib/admin/collab-actions";
import { getMembers } from "@/lib/admin/collab";
import { getSessionUser } from "@/lib/auth";
import { canManageCollab } from "@/lib/collab";
import { PROJECT_STATUS_LABELS } from "@/lib/types";

export default async function NewProjectPage() {
  const user = await getSessionUser();
  if (!user?.profile || !canManageCollab(user.profile)) return null;
  const members = await getMembers();
  const rows = members.ok ? members.rows : [];

  return (
    <>
      <PageHeader
        title="Thêm dự án"
        description="Tạo dự án mới để quản lý nhiệm vụ và thành viên."
        action={
          <Link href="/admin/du-an" className="btn btn-ghost text-sm">
            Quay lại
          </Link>
        }
      />
      <div className="card max-w-4xl">
        <ToastForm action={saveProject} loading="Đang lưu dự án..." className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tên dự án" required>
              <input name="name" required maxLength={160} className="input" />
            </Field>
            <Field label="Mã dự án">
              <input name="code" maxLength={60} className="input" placeholder="DU-001" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Trạng thái">
              <select name="status" className="select" defaultValue="planning">
                {Object.entries(PROJECT_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Ngày bắt đầu">
              <input type="date" name="start_date" className="input" />
            </Field>
            <Field label="Ngày kết thúc">
              <input type="date" name="end_date" className="input" />
            </Field>
          </div>
          <Field label="Trưởng dự án">
            <select name="leader_id" className="select" defaultValue="">
              <option value="">Chọn trưởng dự án…</option>
              {rows.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name || m.email}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ảnh bìa (URL)">
            <input name="cover_url" className="input" />
          </Field>
          <Field label="Mô tả ngắn">
            <textarea name="description" rows={3} maxLength={2000} className="textarea input" />
          </Field>
          <Field label="Ghi chú nội bộ">
            <textarea name="internal_note" rows={2} maxLength={2000} className="textarea input" />
          </Field>
          <button type="submit" className="btn btn-primary w-full py-2.5 text-sm">
            Lưu dự án
          </button>
        </ToastForm>
      </div>
    </>
  );
}
