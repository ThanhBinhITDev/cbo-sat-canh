import { Star, Gift, Trash2 } from "lucide-react";
import { PageHeader, Panel, PanelHead, Field, EmptyState } from "@/components/admin/ui";
import { ErrorState, Notice } from "@/components/admin/States";
import { Pagination } from "@/components/admin/Pagination";
import { PersonAvatar, StatChip } from "@/components/admin/collab/AchievementBits";
import { ToastForm } from "@/components/admin/ProfileForms";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import {
  getContributions,
  getMembers,
  getTaskTitleMap,
  getTasks,
} from "@/lib/admin/collab";
import {
  awardManualPoints,
  awardTaskPoints,
  deleteContribution,
} from "@/lib/admin/collab-actions";
import { getSessionUser } from "@/lib/auth";
import { canManageCollab } from "@/lib/collab";
import { SOURCE_LABELS, type ContributionSource } from "@/lib/types";
import { formatDate } from "@/lib/format";

const SOURCE_OPTIONS: ContributionSource[] = ["manual", "event", "other"];
const SOURCE_BADGE: Record<ContributionSource, string> = {
  task: "badge-blue",
  manual: "badge-gray",
  event: "badge-green",
  other: "badge-gray",
};

export default async function ContributionsPage({
  searchParams,
}: PageProps<"/admin/dong-gop">) {
  const user = await getSessionUser();
  if (!user?.profile || !canManageCollab(user.profile)) {
    return (
      <Notice
        title="Không có quyền truy cập"
        description="Chỉ quản trị viên hoặc người được cấp quyền quản lý cộng tác mới ghi nhận được đóng góp."
      />
    );
  }
  const isAdmin = user.profile.role === "admin";

  const sp = await searchParams;
  const page = Number(typeof sp.page === "string" ? sp.page : "1") || 1;

  const [ledger, membersRes, completed] = await Promise.all([
    getContributions({ page }),
    getMembers(),
    getTasks({ status: "completed", pageSize: 100 }),
  ]);

  const members = membersRes.ok ? membersRes.rows : [];
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const completedRows = completed.ok ? completed.rows : [];

  const ledgerTaskIds = ledger.ok ? ledger.rows.map((r) => r.task_id).filter(Boolean) as string[] : [];
  const taskTitles = await getTaskTitleMap(ledgerTaskIds);

  return (
    <>
      <PageHeader
        title="Ghi nhận đóng góp"
        description="Trao điểm cho nhiệm vụ đã hoàn thành hoặc ghi điểm tay cho các đóng góp khác."
      />

      <div className="grid gap-5 xl:grid-cols-[1fr,1.5fr]">
        <div className="space-y-5">
          <Panel>
            <PanelHead
              title="Trao điểm theo nhiệm vụ"
              subtitle="Chỉ áp dụng cho nhiệm vụ đã hoàn thành"
            />
            {completedRows.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink/60">
                Chưa có nhiệm vụ nào hoàn thành để trao điểm.
              </p>
            ) : (
              <ToastForm action={awardTaskPoints} loading="Đang trao điểm..." className="space-y-4 p-5">
                <Field label="Nhiệm vụ đã hoàn thành" required>
                  <select name="task_id" required className="select" defaultValue="">
                    <option value="" disabled>
                      Chọn nhiệm vụ…
                    </option>
                    {completedRows.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Số điểm mỗi người nhận" required>
                  <input
                    type="number"
                    name="points"
                    min={1}
                    defaultValue={10}
                    required
                    className="input"
                  />
                </Field>
                <Field label="Ghi chú (tuỳ chọn)">
                  <input name="note" maxLength={500} className="input" />
                </Field>
                <button type="submit" className="btn btn-primary w-full py-2.5 text-sm">
                  <Star size={16} /> Trao điểm
                </button>
                <p className="hint">Điểm được chia đều cho mọi người thực hiện của nhiệm vụ.</p>
              </ToastForm>
            )}
          </Panel>

          <Panel>
            <PanelHead title="Ghi điểm tay" subtitle="Sự kiện, hỗ trợ ngoài nhiệm vụ" />
            <ToastForm action={awardManualPoints} loading="Đang ghi điểm..." className="space-y-4 p-5">
              <Field label="Người nhận điểm" required>
                <select name="profile_id" required className="select" defaultValue="">
                  <option value="" disabled>
                    Chọn thành viên…
                  </option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name || m.email}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Số điểm" required>
                  <input type="number" name="points" required className="input" />
                </Field>
                <Field label="Nguồn">
                  <select name="source" className="select" defaultValue="manual">
                    {SOURCE_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {SOURCE_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Lý do (tuỳ chọn)">
                <input name="note" maxLength={500} className="input" />
              </Field>
              <button type="submit" className="btn btn-primary w-full py-2.5 text-sm">
                <Gift size={16} /> Ghi điểm
              </button>
              <p className="hint">Nhập số âm nếu cần trừ điểm.</p>
            </ToastForm>
          </Panel>
        </div>

        {!ledger.ok ? (
          <ErrorState message={ledger.message} detail={ledger.detail} />
        ) : (
          <Panel>
            <PanelHead title="Sổ điểm đóng góp" subtitle={`${ledger.total} dòng`} />
            {ledger.rows.length === 0 ? (
              <EmptyState
                title="Chưa có điểm nào"
                description="Trao điểm cho nhiệm vụ hoàn thành để tạo dòng đóng góp đầu tiên."
              />
            ) : (
              <ul className="divide-y divide-line">
                {ledger.rows.map((row) => {
                  const person = memberMap.get(row.profile_id);
                  const taskTitle = row.task_id ? taskTitles.get(row.task_id) : null;
                  return (
                    <li key={row.id} className="flex items-center gap-3 px-5 py-3">
                      <PersonAvatar name={person?.full_name} url={person?.avatar_url} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {person?.full_name ?? person?.email ?? "Thành viên"}
                        </p>
                        <p className="truncate text-xs text-ink/60">
                          {taskTitle ? `Nhiệm vụ: ${taskTitle}` : (row.note ?? "—")}
                          {" · "}
                          {formatDate(row.created_at)}
                        </p>
                      </div>
                      <span className={`badge ${SOURCE_BADGE[row.source]}`}>
                        {SOURCE_LABELS[row.source]}
                      </span>
                      <StatChip
                        icon={<Star size={14} />}
                        label="điểm"
                        value={`${row.points > 0 ? "+" : ""}${row.points}`}
                      />
                      {isAdmin && (
                        <ToastForm action={deleteContribution} loading="Đang xóa...">
                          <input type="hidden" name="id" value={row.id} />
                          <ConfirmSubmit confirmText="Xóa dòng điểm này?">
                            <Trash2 size={14} />
                          </ConfirmSubmit>
                        </ToastForm>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <Pagination
              basePath="/admin/dong-gop"
              params={{}}
              page={ledger.page}
              pageSize={ledger.pageSize}
              total={ledger.total}
            />
          </Panel>
        )}
      </div>
    </>
  );
}
