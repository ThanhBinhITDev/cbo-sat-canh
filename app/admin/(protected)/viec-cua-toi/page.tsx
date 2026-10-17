import Link from "next/link";
import { ClipboardList, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { PageHeader, Panel, PanelHead, EmptyState } from "@/components/admin/ui";
import { ErrorState } from "@/components/admin/States";
import { StatCard } from "@/components/admin/StatCard";
import { TaskStatusBadge, PriorityBadge } from "@/components/admin/TaskStatusBadge";
import { getMyTasks, getTaskStats } from "@/lib/admin/collab";
import { getSessionUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export default async function MyTasksPage() {
  const user = await getSessionUser();
  if (!user?.profile) return null;

  const [res, stats] = await Promise.all([getMyTasks(user.id), getTaskStats(user.id)]);

  const today = new Date().toISOString().slice(0, 10);
  const open = res.ok
    ? res.rows.filter((t) => t.status !== "completed" && t.status !== "cancelled")
    : [];

  return (
    <>
      <PageHeader
        title="Việc của tôi"
        description="Các nhiệm vụ được giao cho bạn. Nhận việc, cập nhật tiến độ và gửi kết quả."
      />

      {stats && (
        <div className="mb-5 grid gap-px overflow-hidden rounded-card border border-muted bg-line sm:grid-cols-3">
          <StatCard
            icon={<Clock size={20} />}
            label="Đang thực hiện"
            value={open.length}
            hint="Chưa hoàn thành"
            tone="yellow"
          />
          <StatCard
            icon={<CheckCircle2 size={20} />}
            label="Đã hoàn thành"
            value={stats.byStatus.completed}
            tone="green"
          />
          <StatCard
            icon={<AlertTriangle size={20} />}
            label="Quá hạn"
            value={open.filter((t) => t.due_date && t.due_date < today).length}
            tone="red"
          />
        </div>
      )}

      {!res.ok ? (
        <ErrorState message={res.message} detail={res.detail} />
      ) : res.rows.length === 0 ? (
        <Panel>
          <EmptyState
            title="Bạn chưa có nhiệm vụ nào"
            description="Khi được giao việc, nhiệm vụ sẽ xuất hiện tại đây."
          />
        </Panel>
      ) : (
        <Panel>
          <PanelHead title="Danh sách nhiệm vụ" subtitle={`${res.rows.length} nhiệm vụ`} />
          <ul className="divide-y divide-line">
            {res.rows.map((t) => {
              const overdue =
                t.due_date &&
                t.due_date < today &&
                t.status !== "completed" &&
                t.status !== "cancelled";
              return (
                <li key={t.id}>
                  <Link
                    href={`/admin/nhiem-vu/${t.id}`}
                    className="flex items-center gap-4 px-5 py-4 transition hover:bg-primary/5"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <ClipboardList size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-primary-dark">{t.title}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-ink/60">
                        {t.category_label && <span>{t.category_label}</span>}
                        {t.due_date && (
                          <span className={overdue ? "font-bold text-red-600" : ""}>
                            Hạn: {formatDate(t.due_date)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
                      <span className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-ink/50">Ưu tiên</span>
                        <PriorityBadge priority={t.priority} />
                      </span>
                      <TaskStatusBadge status={t.status} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </>
  );
}
