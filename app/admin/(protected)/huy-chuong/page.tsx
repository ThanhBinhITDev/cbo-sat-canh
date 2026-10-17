import Link from "next/link";
import { Pencil, Trash2, Award, Plus } from "lucide-react";
import { PageHeader, Panel, PanelHead, EmptyState } from "@/components/admin/ui";
import { ErrorState, Notice } from "@/components/admin/States";
import { PersonAvatar } from "@/components/admin/collab/AchievementBits";
import MedalForm from "@/components/admin/collab/MedalForm";
import { ToastForm } from "@/components/admin/ProfileForms";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { awardMedal, deleteMedal, revokeMedal } from "@/lib/admin/collab-actions";
import { getAwardedMedals, getMembers, getMedals } from "@/lib/admin/collab";
import { getSessionUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export default async function MedalsPage() {
  const user = await getSessionUser();
  if (!user?.profile || user.profile.role !== "admin") {
    return (
      <Notice
        title="Không có quyền truy cập"
        description="Chỉ quản trị viên mới quản lý được huy chương."
      />
    );
  }

  const [catalog, awarded, membersRes] = await Promise.all([
    getMedals(false),
    getAwardedMedals(),
    getMembers(),
  ]);
  const medals = catalog.ok ? catalog.rows : [];
  const awardedRows = awarded.ok ? awarded.rows : [];
  const members = membersRes.ok ? membersRes.rows : [];
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const medalMap = new Map(medals.map((m) => [m.id, m]));
  const activeMedals = medals.filter((m) => m.is_active);

  return (
    <>
      <PageHeader
        title="Huy chương"
        description="Danh mục huy chương và việc trao cho thành viên có đóng góp."
      />

      <div className="grid gap-5 xl:grid-cols-[1.3fr,1fr]">
        <div className="space-y-5">
          {!catalog.ok ? (
            <ErrorState message={catalog.message} detail={catalog.detail} />
          ) : (
            <Panel>
              <PanelHead
              title="Danh mục huy chương"
              subtitle={`${medals.length} huy chương`}
              action={
                <Link href="/admin/huy-chuong/moi" className="btn btn-primary text-sm">
                  <Plus size={16} /> Thêm mới
                </Link>
              }
            />
              {medals.length === 0 ? (
                <EmptyState
                  title="Chưa có huy chương"
                  description="Thêm huy chương đầu tiên bằng biểu mẫu phía dưới."
                  action={
                    <Link href="/admin/huy-chuong/moi" className="btn btn-primary text-sm">
                      <Plus size={16} /> Thêm huy chương
                    </Link>
                  }
                />
              ) : (
                <ul className="divide-y divide-line">
                  {medals.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 font-semibold">
                          {m.name}
                          {!m.is_active && <span className="badge badge-gray">Tạm dừng</span>}
                        </p>
                        <p className="truncate text-xs text-ink/60">
                          {m.description ?? "—"}
                          {m.threshold_points > 0 && ` · ≥ ${m.threshold_points} điểm`}
                        </p>
                      </div>
                      <Link
                        href={`/admin/huy-chuong/${m.id}/sua`}
                        className="btn btn-ghost px-2.5 py-2 text-sm"
                        title="Sửa"
                      >
                        <Pencil size={14} />
                      </Link>
                      <ToastForm action={deleteMedal} loading="Đang xóa...">
                        <input type="hidden" name="id" value={m.id} />
                        <ConfirmSubmit confirmText="Xóa huy chương này? Huy chương đã trao cho thành viên cũng sẽ bị xóa theo." danger>
                          <Trash2 size={14} />
                        </ConfirmSubmit>
                      </ToastForm>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}

          <Panel>
            <PanelHead title="Thêm huy chương mới" />
            <MedalForm />
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel>
            <PanelHead title="Trao huy chương" />
            <ToastForm action={awardMedal} loading="Đang trao huy chương..." className="space-y-4 p-5">
              <div className="space-y-1.5">
                <span className="field-label">Người nhận</span>
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
              </div>
              <div className="space-y-1.5">
                <span className="field-label">Huy chương</span>
                <select name="medal_id" required className="select" defaultValue="">
                  <option value="" disabled>
                    Chọn huy chương…
                  </option>
                  {activeMedals.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <span className="field-label">Lý do (tuỳ chọn)</span>
                <input name="note" maxLength={500} className="input" />
              </div>
              <button type="submit" className="btn btn-primary w-full py-2.5 text-sm">
                <Award size={16} /> Trao huy chương
              </button>
              <p className="hint">Mỗi người chỉ nhận một huy chương mỗi loại.</p>
            </ToastForm>
          </Panel>

          <Panel>
            <PanelHead title="Huy chương đã trao" subtitle={`${awardedRows.length} lượt`} />
            {awardedRows.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink/60">
                Chưa trao huy chương nào.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {awardedRows.map((pm) => {
                  const person = memberMap.get(pm.profile_id);
                  const medal = pm.medals ?? medalMap.get(pm.medal_id);
                  return (
                    <li key={pm.id} className="flex items-center gap-3 px-5 py-3">
                      <PersonAvatar name={person?.full_name} url={person?.avatar_url} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {person?.full_name ?? person?.email ?? "Thành viên"}
                        </p>
                        <p className="truncate text-xs text-ink/60">
                          {medal?.name ?? "Huy chương"}
                          {medal?.tier && ` · ${medal.tier}`}
                          {" · "}
                          {formatDate(pm.awarded_at)}
                        </p>
                      </div>
                      <ToastForm action={revokeMedal} loading="Đang rút...">
                        <input type="hidden" name="id" value={pm.id} />
                        <ConfirmSubmit confirmText="Rút huy chương này?" danger>
                          <Trash2 size={14} />
                        </ConfirmSubmit>
                      </ToastForm>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
