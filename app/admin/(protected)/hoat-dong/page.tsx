import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader, Panel, PanelHead, EmptyState } from "@/components/admin/ui";
import { ErrorState, Notice } from "@/components/admin/States";
import { Pagination } from "@/components/admin/Pagination";
import { getEvents } from "@/lib/admin/collab";
import { getSessionUser } from "@/lib/auth";
import { canManageCollab } from "@/lib/collab";
import { EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from "@/lib/types";
import { formatDate } from "@/lib/format";

export default async function EventsListPage({
  searchParams,
}: PageProps<"/admin/hoat-dong">) {
  const user = await getSessionUser();
  if (!user?.profile || !canManageCollab(user.profile)) {
    return (
      <Notice
        title="Không có quyền truy cập"
        description="Chỉ người được cấp quyền quản lý cộng tác mới xem được hoạt động."
      />
    );
  }

  const sp = await searchParams;
  const page = Number(typeof sp.page === "string" ? sp.page : "1") || 1;
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const type = typeof sp.type === "string" ? sp.type : undefined;
  const search = typeof sp.q === "string" ? sp.q : "";

  const data = await getEvents({ page, status, type, search });

  return (
    <>
      <PageHeader
        title="Hoạt động"
        description="Quản lý sự kiện, tập huấn, tiếp cận cộng đồng."
        action={
          <Link href="/admin/hoat-dong/moi" className="btn btn-primary text-sm">
            <Plus size={16} /> Thêm hoạt động
          </Link>
        }
      />

      {!data.ok ? (
        <ErrorState message={data.message} detail={data.detail} />
      ) : data.rows.length === 0 ? (
        <Panel>
          <EmptyState
            title="Chưa có hoạt động"
            description="Tạo hoạt động mới để ghi nhận tham dự và liên kết dự án."
            action={
              <Link href="/admin/hoat-dong/moi" className="btn btn-primary text-sm">
                <Plus size={16} /> Thêm hoạt động
              </Link>
            }
          />
        </Panel>
      ) : (
        <Panel>
          <PanelHead title="Danh sách hoạt động" subtitle={`${data.total} hoạt động`} />
          <ul className="divide-y divide-line">
            {data.rows.map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/hoat-dong/${e.id}`} className="font-semibold hover:text-primary">
                    {e.name}
                  </Link>
                  <p className="text-xs text-ink/60">
                    {e.code ? `Mã: ${e.code}` : "Chưa có mã"}
                    {" · "}
                    {EVENT_TYPE_LABELS[e.type as keyof typeof EVENT_TYPE_LABELS]}
                    {" · "}
                    {EVENT_STATUS_LABELS[e.status as keyof typeof EVENT_STATUS_LABELS]}
                    {e.start_at && ` · ${formatDate(e.start_at)}`}
                    {e.project?.name && ` · Thuộc dự án: ${e.project.name}`}
                  </p>
                </div>
                <Link href={`/admin/hoat-dong/${e.id}/sua`} className="btn btn-ghost text-sm">
                  Sửa
                </Link>
              </li>
            ))}
          </ul>
          <Pagination
            basePath="/admin/hoat-dong"
            params={{ status: status || undefined, type: type || undefined, q: search || undefined }}
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
          />
        </Panel>
      )}
    </>
  );
}
