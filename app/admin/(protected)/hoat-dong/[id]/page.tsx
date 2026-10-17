import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader, Panel, PanelHead, Field } from "@/components/admin/ui";
import { ToastForm } from "@/components/admin/ProfileForms";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { deleteEvent, saveEvent } from "@/lib/admin/collab-actions";
import { getEvent, getMembers, getProjects } from "@/lib/admin/collab";
import { getSessionUser } from "@/lib/auth";
import { canManageCollab } from "@/lib/collab";
import { EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/format";

export default async function EventDetailPage({
  params,
}: PageProps<"/admin/hoat-dong/[id]">) {
  const user = await getSessionUser();
  if (!user?.profile || !canManageCollab(user.profile)) return null;
  const { id } = await params;
  const e = await getEvent(id);
  if (!e.ok) notFound();
  const event = e.row;

  return (
    <>
      <PageHeader
        title={event.name}
        description={event.code ? `Mã: ${event.code}` : ""}
        action={
          <div className="flex gap-2">
            <Link href={`/admin/hoat-dong/${id}/sua`} className="btn btn-ghost text-sm">
              Sửa hoạt động
            </Link>
            <Link href="/admin/hoat-dong" className="btn btn-ghost text-sm">
              Quay lại
            </Link>
          </div>
        }
      />
      <Panel>
        <PanelHead title="Thông tin hoạt động" />
        <dl className="grid grid-cols-2 gap-3 px-5 py-4 text-sm">
          <div>
            <dt className="text-ink/60">Loại</dt>
            <dd>{EVENT_TYPE_LABELS[event.type as keyof typeof EVENT_TYPE_LABELS]}</dd>
          </div>
          <div>
            <dt className="text-ink/60">Trạng thái</dt>
            <dd>{EVENT_STATUS_LABELS[event.status as keyof typeof EVENT_STATUS_LABELS]}</dd>
          </div>
          <div>
            <dt className="text-ink/60">Thời gian</dt>
            <dd>
              {event.start_at ? formatTime(event.start_at) : "—"} – {event.end_at ? formatTime(event.end_at) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-ink/60">Địa điểm/Sức chứa</dt>
            <dd>
              {event.location ?? "—"}
              {event.capacity != null && ` · Tối đa ${event.capacity}`}
            </dd>
          </div>
          <div>
            <dt className="text-ink/60">Dự án</dt>
            <dd>{event.project?.name ?? "—"}</dd>
          </div>
          {event.description && (
            <div className="col-span-2">
              <dt className="text-ink/60">Mô tả</dt>
              <dd className="whitespace-pre-wrap">{event.description}</dd>
            </div>
          )}
        </dl>
        <div className="border-t border-line px-5 py-4">
          <ToastForm action={deleteEvent} loading="Đang xoá..." className="inline-block">
            <input type="hidden" name="id" value={id} />
            <ConfirmSubmit confirmText="Xoá hoạt động này?" danger>
              Xoá hoạt động
            </ConfirmSubmit>
          </ToastForm>
        </div>
      </Panel>
    </>
  );
}
