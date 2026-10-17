import Link from "next/link";
import { Plus, Pencil, Trash2, ListChecks, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { PageHeader, Panel, PanelHead, EmptyState } from "@/components/admin/ui";
import { ErrorState, Notice } from "@/components/admin/States";
import { StatCard } from "@/components/admin/StatCard";
import { Pagination } from "@/components/admin/Pagination";
import { TaskStatusBadge, PriorityBadge } from "@/components/admin/TaskStatusBadge";
import TaskForm from "@/components/admin/collab/TaskForm";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { ToastForm } from "@/components/admin/ProfileForms";
import { deleteTask } from "@/lib/admin/collab-actions";
import {
  getMembers,
  getTaskCategories,
  getTaskDetail,
  getTasks,
  getTaskStats,
} from "@/lib/admin/collab";
import { getSessionUser } from "@/lib/auth";
import { canManageCollab } from "@/lib/collab";
import { TASK_STATUS_LABELS, TASK_STATUS_ORDER, type TaskStatus } from "@/lib/types";
import { formatDate } from "@/lib/format";

export default async function TasksAdminPage({
  searchParams,
}: PageProps<"/admin/nhiem-vu">) {
  const user = await getSessionUser();
  if (!user?.profile || !canManageCollab(user.profile)) {
    return (
      <Notice
        title="Không có quyền truy cập"
        description="Chỉ quản trị viên hoặc người được cấp quyền quản lý cộng tác mới xem được trang này."
      />
    );
  }

  const sp = await searchParams;
  const status = (typeof sp.trang_thai === "string" ? sp.trang_thai : "") as TaskStatus | "";
  const categoryId = typeof sp.dm === "string" ? sp.dm : "";
  const assigneeId = typeof sp.nguoi === "string" ? sp.nguoi : "";
  const search = typeof sp.q === "string" ? sp.q : "";
  const page = Number(typeof sp.page === "string" ? sp.page : "1") || 1;
  const editId = typeof sp.edit === "string" ? sp.edit : "";
  const isNew = sp.moi === "1";

  const [list, categories, membersRes, stats] = await Promise.all([
    getTasks({
      status: TASK_STATUS_ORDER.includes(status as TaskStatus) ? status : "",
      categoryId,
      assigneeId,
      search,
      page,
    }),
    getTaskCategories(false),
    getMembers(),
    getTaskStats(user.id),
  ]);

  const members = membersRes.ok ? membersRes.rows : [];
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const cats = categories.ok ? categories.rows : [];

  const editDetail = editId ? await getTaskDetail(editId) : null;
  const editing = editDetail?.ok ? editDetail.data.task : null;
  const editingAssigneeIds =
    editDetail?.ok ? editDetail.data.assignees.map((a) => a.profile_id) : [];

  const openForm = isNew || (editId && editing);
  const today = new Date().toISOString().slice(0, 10);

  const filterParams = {
    trang_thai: status || undefined,
    dm: categoryId || undefined,
    nguoi: assigneeId || undefined,
    q: search || undefined,
  };

  return (
    <>
      <PageHeader
        title="Nhiệm vụ"
        description="Giao việc, theo dõi tiến độ và duyệt kết quả của cộng tác viên."
        action={
          <Link href="/admin/nhiem-vu?moi=1" className="btn btn-primary px-4 py-2.5 text-sm">
            <Plus size={18} /> Giao nhiệm vụ
          </Link>
        }
      />

      {stats && (
        <div className="mb-5 grid gap-px overflow-hidden rounded-card border border-muted bg-line sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<ListChecks size={20} />}
            label="Tổng nhiệm vụ"
            value={stats.total}
            hint={`${stats.byStatus.completed} đã hoàn thành`}
          />
          <StatCard
            icon={<Clock size={20} />}
            label="Đang thực hiện"
            value={stats.byStatus.accepted + stats.byStatus.in_progress}
            hint={`${stats.byStatus.submitted} chờ duyệt`}
            tone="yellow"
          />
          <StatCard
            icon={<CheckCircle2 size={20} />}
            label="Chờ nhận"
            value={stats.byStatus.assigned}
            hint="Chưa có người nhận"
            tone="gray"
          />
          <StatCard
            icon={<AlertTriangle size={20} />}
            label="Quá hạn"
            value={stats.overdue}
            hint="Cần xử lý sớm"
            tone="red"
          />
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.5fr,1fr]">
        <div className="space-y-5">
          <form method="get" className="card flex flex-wrap items-end gap-3 p-4">
            <div className="min-w-[160px] flex-1">
              <label className="field-label">Tìm theo tiêu đề</label>
              <input name="q" defaultValue={search} placeholder="Nhập từ khoá…" className="input" />
            </div>
            <div>
              <label className="field-label">Trạng thái</label>
              <select name="trang_thai" defaultValue={status} className="select">
                <option value="">Tất cả</option>
                {TASK_STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {TASK_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Danh mục</label>
              <select name="dm" defaultValue={categoryId} className="select">
                <option value="">Tất cả</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Người thực hiện</label>
              <select name="nguoi" defaultValue={assigneeId} className="select">
                <option value="">Tất cả</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name || m.email}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary px-4 py-2.5 text-sm">
              Lọc
            </button>
            {(search || status || categoryId || assigneeId) && (
              <Link href="/admin/nhiem-vu" className="btn btn-ghost px-4 py-2.5 text-sm">
                Xoá lọc
              </Link>
            )}
          </form>

          {!list.ok ? (
            <ErrorState message={list.message} detail={list.detail} />
          ) : (
            <Panel>
              <PanelHead title="Danh sách nhiệm vụ" subtitle={`${list.total} nhiệm vụ`} />
              {list.rows.length === 0 ? (
                <EmptyState
                  title="Chưa có nhiệm vụ nào"
                  description="Bấm “Giao nhiệm vụ” để tạo việc đầu tiên cho cộng tác viên."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-admin">
                    <thead>
                      <tr>
                        <th>Nhiệm vụ</th>
                        <th>Người thực hiện</th>
                        <th>Ưu tiên</th>
                        <th>Trạng thái</th>
                        <th>Hạn</th>
                        <th className="text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.rows.map((t) => {
                        const overdue =
                          t.due_date &&
                          t.due_date < today &&
                          t.status !== "completed" &&
                          t.status !== "cancelled";
                        return (
                          <tr key={t.id}>
                            <td>
                              <Link
                                href={`/admin/nhiem-vu/${t.id}`}
                                className="font-semibold text-primary-dark hover:underline"
                              >
                                {t.title}
                              </Link>
                              {t.category_label && (
                                <span className="block text-xs text-ink/60">{t.category_label}</span>
                              )}
                            </td>
                            <td>
                              {t.assignees.length === 0 ? (
                                <span className="text-xs text-ink/50">Chưa giao</span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {t.assignees.map((a) => {
                                    const m = memberMap.get(a.profile_id);
                                    return (
                                      <span
                                        key={a.profile_id}
                                        className="badge badge-gray"
                                        title={m?.full_name ?? a.profile_id}
                                      >
                                        {(m?.full_name || "?").split(" ").slice(-1)[0]}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                            <td>
                              <PriorityBadge priority={t.priority} />
                            </td>
                            <td>
                              <TaskStatusBadge status={t.status} />
                            </td>
                            <td className={overdue ? "font-bold text-red-600" : "text-ink/70"}>
                              {t.due_date ? formatDate(t.due_date) : "—"}
                              {overdue && <span className="block text-xs">Quá hạn</span>}
                            </td>
                            <td>
                              <div className="flex justify-end gap-1.5">
                                <Link
                                  href={`/admin/nhiem-vu?edit=${t.id}`}
                                  className="grid h-8 w-8 place-items-center rounded-xl border border-line text-ink/55 hover:border-primary hover:text-primary"
                                  aria-label={`Sửa ${t.title}`}
                                >
                                  <Pencil size={15} />
                                </Link>
                                <ToastForm action={deleteTask} loading="Đang xoá nhiệm vụ...">
                                  <input type="hidden" name="id" value={t.id} />
                                  <ConfirmSubmit
                                    confirmText={`Xoá nhiệm vụ "${t.title}"? Toàn bộ trao đổi và tệp đính kèm sẽ bị xoá.`}
                                  >
                                    <Trash2 size={15} />
                                  </ConfirmSubmit>
                                </ToastForm>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination
                basePath="/admin/nhiem-vu"
                params={filterParams}
                page={list.page}
                pageSize={list.pageSize}
                total={list.total}
              />
            </Panel>
          )}
        </div>

        {openForm && (
          <Panel className="h-fit xl:sticky xl:top-24">
            <PanelHead
              title={editing ? "Sửa nhiệm vụ" : "Giao nhiệm vụ mới"}
              subtitle="Chọn người thực hiện và mốc thời gian"
            />
            <TaskForm
              task={editing}
              categories={cats}
              members={members}
              selectedAssigneeIds={editingAssigneeIds}
            />
          </Panel>
        )}
      </div>
    </>
  );
}
