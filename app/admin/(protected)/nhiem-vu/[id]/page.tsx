import Link from "next/link";
import {
  CalendarDays,
  Target,
  Coins,
  Paperclip,
  StickyNote,
  Pencil,
} from "lucide-react";
import { BackLink, Panel, PanelHead } from "@/components/admin/ui";
import { ErrorState, Notice } from "@/components/admin/States";
import { TaskStatusBadge, PriorityBadge } from "@/components/admin/TaskStatusBadge";
import TaskActions from "@/components/admin/collab/TaskActions";
import { getMembersMap, getTaskDetail } from "@/lib/admin/collab";
import { getSessionUser } from "@/lib/auth";
import { canManageCollab } from "@/lib/collab";
import { TASK_UPDATE_LABELS, type TaskAssigneeRole } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/format";

const TASK_ROLE_LABELS: Record<TaskAssigneeRole, string> = {
  lead: "Trưởng nhóm",
  member: "Thành viên",
  support: "Hỗ trợ",
};

export default async function TaskDetailPage({
  params,
}: PageProps<"/admin/nhiem-vu/[id]">) {
  const user = await getSessionUser();
  if (!user?.profile) return null;

  const { id } = await params;
  const res = await getTaskDetail(id);
  if (!res.ok) {
    if (res.message.includes("không có quyền") || res.message.includes("Không tìm thấy")) {
      return (
        <Notice
          title="Không truy cập được nhiệm vụ"
          description="Nhiệm vụ không tồn tại hoặc bạn không phải người thực hiện."
        />
      );
    }
    return <ErrorState message={res.message} detail={res.detail} />;
  }

  const { task, category_label, assignees, updates, attachments } = res.data;
  const isManager = canManageCollab(user.profile);
  const isAssignee = assignees.some((a) => a.profile_id === user.id);

  if (!isManager && !isAssignee) {
    return (
      <Notice
        title="Không truy cập được nhiệm vụ"
        description="Bạn không phải người thực hiện nhiệm vụ này."
      />
    );
  }

  const memberMap = await getMembersMap();
  const today = new Date().toISOString().slice(0, 10);
  const overdue =
    task.due_date &&
    task.due_date < today &&
    task.status !== "completed" &&
    task.status !== "cancelled";

  return (
    <div className="mx-auto max-w-4xl">
      <BackLink href={isManager ? "/admin/nhiem-vu" : "/admin/viec-cua-toi"}>
        {isManager ? "Danh sách nhiệm vụ" : "Việc của tôi"}
      </BackLink>

      <div className="mt-4 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <TaskStatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {category_label && <span className="badge badge-gray">{category_label}</span>}
            {overdue && <span className="badge badge-red">Quá hạn</span>}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">{task.title}</h1>
        </div>
        {isManager && (
          <Link
            href={`/admin/nhiem-vu/${task.id}/sua`}
            className="btn btn-ghost px-4 py-2.5 text-sm"
          >
            <Pencil size={16} /> Sửa
          </Link>
        )}
      </div>

      <div className="space-y-5">
        <Panel>
          <PanelHead title="Thông tin nhiệm vụ" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Info icon={<CalendarDays size={16} />} label="Bắt đầu">
              {task.start_date ? formatDate(task.start_date) : "—"}
            </Info>
            <Info icon={<CalendarDays size={16} />} label="Hạn hoàn thành">
              <span className={overdue ? "font-bold text-red-600" : ""}>
                {task.due_date ? formatDate(task.due_date) : "—"}
              </span>
            </Info>
            <Info icon={<Coins size={16} />} label="Điểm dự kiến">
              {task.points_estimated}
            </Info>
            <Info icon={<Target size={16} />} label="Người giao">
              {task.created_by ? memberMap.get(task.created_by)?.full_name ?? "—" : "—"}
            </Info>
          </div>

          {task.description && (
            <div className="border-t border-line px-5 py-4">
              <p className="field-label">Mô tả</p>
              <p className="whitespace-pre-line text-sm text-ink/90">{task.description}</p>
            </div>
          )}
          {task.acceptance_criteria && (
            <div className="border-t border-line px-5 py-4">
              <p className="field-label">Tiêu chí nghiệm thu</p>
              <p className="whitespace-pre-line text-sm text-ink/90">
                {task.acceptance_criteria}
              </p>
            </div>
          )}
          {isManager && task.internal_note && (
            <div className="border-t border-line bg-amber-50/60 px-5 py-4">
              <p className="field-label flex items-center gap-1.5">
                <StickyNote size={14} /> Ghi chú nội bộ
              </p>
              <p className="whitespace-pre-line text-sm text-ink/90">{task.internal_note}</p>
            </div>
          )}
        </Panel>

        <Panel>
          <PanelHead
            title="Hành động"
            subtitle={
              isManager ? "Nhận việc, cập nhật và duyệt kết quả" : "Nhận việc, cập nhật và gửi kết quả"
            }
          />
          <div className="p-5">
            <TaskActions
              taskId={task.id}
              status={task.status}
              isAssignee={isAssignee}
              isManager={isManager}
            />
          </div>
        </Panel>

        <Panel>
          <PanelHead title="Người thực hiện" subtitle={`${assignees.length} người`} />
          <ul className="divide-y divide-line">
            {assignees.map((a) => {
              const m = memberMap.get(a.profile_id);
              return (
                <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {m?.full_name || m?.email || a.profile_id}
                    </p>
                    <p className="text-xs text-ink/60">
                      {TASK_ROLE_LABELS[a.role_in_task]}
                    </p>
                  </div>
                  <TaskStatusBadge status={a.status} />
                </li>
              );
            })}
          </ul>
        </Panel>

        {attachments.length > 0 && (
          <Panel>
            <PanelHead title="Tệp & liên kết" subtitle={`${attachments.length} mục`} />
            <ul className="divide-y divide-line">
              {attachments.map((f) => (
                <li key={f.id} className="flex items-center gap-3 px-5 py-3">
                  <Paperclip size={16} className="shrink-0 text-ink/50" />
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 truncate text-sm font-semibold text-primary-dark hover:underline"
                  >
                    {f.name || f.url}
                  </a>
                  <span className="badge badge-gray">
                    {f.kind === "result" ? "Kết quả" : "Tham khảo"}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        <Panel>
          <PanelHead title="Tiến trình & trao đổi" subtitle={`${updates.length} cập nhật`} />
          {updates.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-ink/60">
              Chưa có cập nhật nào. Trao đổi và tiến độ sẽ hiển thị tại đây.
            </p>
          ) : (
            <ol className="divide-y divide-line">
              {updates.map((u) => {
                const author = u.author_id ? memberMap.get(u.author_id) : undefined;
                const authorName = u.author_id
                  ? author?.full_name || author?.email || "Thành viên"
                  : "Hệ thống";
                return (
                  <li key={u.id} className="flex gap-3 px-5 py-4">
                    <AuthorAvatar name={authorName} url={author?.avatar_url ?? null} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-ink/60">
                        <span className="badge badge-gray">{TASK_UPDATE_LABELS[u.kind]}</span>
                        <span className="font-semibold text-ink/80">{authorName}</span>
                        <span>·</span>
                        <span>
                          {formatDate(u.created_at)} {formatTime(u.created_at)}
                        </span>
                        {u.status_from && u.status_to && u.status_from !== u.status_to && (
                          <span className="text-ink/50">
                            ({u.status_from} → {u.status_to})
                          </span>
                        )}
                      </div>
                      {u.body && (
                        <p className="mt-1.5 whitespace-pre-line text-sm text-ink/90">{u.body}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Info({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-ink/60">{label}</p>
        <p className="text-sm font-semibold">{children}</p>
      </div>
    </div>
  );
}

/** Ảnh đại diện người bình luận; không có thì hiện chữ đầu tên. */
function AuthorAvatar({ name, url }: { name: string; url?: string | null }) {
  return (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-sm font-black text-primary"
      aria-hidden
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        (name.trim().slice(0, 1).toUpperCase() || "?")
      )}
    </span>
  );
}
