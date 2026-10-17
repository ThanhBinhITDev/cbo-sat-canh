import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader, Panel, PanelHead, EmptyState } from "@/components/admin/ui";
import { ErrorState, Notice } from "@/components/admin/States";
import { Pagination } from "@/components/admin/Pagination";
import { getProjects } from "@/lib/admin/collab";
import { getSessionUser } from "@/lib/auth";
import { canManageCollab } from "@/lib/collab";
import { PROJECT_STATUS_LABELS } from "@/lib/types";
import { formatDate } from "@/lib/format";

export default async function ProjectsListPage({
  searchParams,
}: PageProps<"/admin/du-an">) {
  const user = await getSessionUser();
  if (!user?.profile || !canManageCollab(user.profile)) {
    return (
      <Notice
        title="Không có quyền truy cập"
        description="Chỉ người được cấp quyền quản lý cộng tác mới xem được danh sách dự án."
      />
    );
  }

  const sp = await searchParams;
  const page = Number(typeof sp.page === "string" ? sp.page : "1") || 1;
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const search = typeof sp.q === "string" ? sp.q : "";

  const data = await getProjects({ page, status, search });

  return (
    <>
      <PageHeader
        title="Dự án"
        description="Quản lý danh mục dự án và thành viên tham gia."
        action={
          <Link href="/admin/du-an/moi" className="btn btn-primary text-sm">
            <Plus size={16} /> Thêm dự án
          </Link>
        }
      />

      {!data.ok ? (
        <ErrorState message={data.message} detail={data.detail} />
      ) : data.rows.length === 0 ? (
        <Panel>
          <EmptyState
            title="Chưa có dự án"
            description="Thêm dự án mới để gắn nhiệm vụ hoặc quản lý hoạt động."
            action={
              <Link href="/admin/du-an/moi" className="btn btn-primary text-sm">
                <Plus size={16} /> Thêm dự án
              </Link>
            }
          />
        </Panel>
      ) : (
        <Panel>
          <PanelHead title="Danh sách dự án" subtitle={`${data.total} dự án`} />
          <ul className="divide-y divide-line">
            {data.rows.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/du-an/${p.id}`} className="font-semibold hover:text-primary">
                    {p.name}
                  </Link>
                  <p className="text-xs text-ink/60">
                    {p.code ? `Mã: ${p.code}` : "Chưa có mã"}
                    {" · "}
                    {PROJECT_STATUS_LABELS[p.status as keyof typeof PROJECT_STATUS_LABELS]}
                    {p.start_date && ` · Bắt đầu ${formatDate(p.start_date)}`}
                    {p.leader?.full_name && ` · Trưởng dự án: ${p.leader.full_name}`}
                  </p>
                </div>
                <Link href={`/admin/du-an/${p.id}/sua`} className="btn btn-ghost text-sm">
                  Sửa
                </Link>
              </li>
            ))}
          </ul>
          <Pagination
            basePath="/admin/du-an"
            params={{ status: status || undefined, q: search || undefined }}
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
          />
        </Panel>
      )}
    </>
  );
}
