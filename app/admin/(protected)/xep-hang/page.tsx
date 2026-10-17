import { Star, Medal as MedalIcon } from "lucide-react";
import { PageHeader, Panel, PanelHead, EmptyState } from "@/components/admin/ui";
import { ErrorState } from "@/components/admin/States";
import { PersonAvatar, MedalChip } from "@/components/admin/collab/AchievementBits";
import { getAwardedMedals, getLeaderboard } from "@/lib/admin/collab";
import { getSessionUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/types";

const RANK_STYLE = [
  "bg-amber-100 text-amber-600",
  "bg-slate-100 text-slate-500",
  "bg-orange-100 text-orange-600",
];

export default async function LeaderboardPage() {
  const user = await getSessionUser();
  if (!user?.profile) return null;

  const [board, myMedals] = await Promise.all([
    getLeaderboard(),
    getAwardedMedals(user.id),
  ]);

  const myMedalsRows = myMedals.ok ? myMedals.rows : [];
  const top3 = board.ok ? board.rows.slice(0, 3) : [];

  return (
    <>
      <PageHeader
        title="Bảng xếp hạng"
        description="Tổng điểm đóng góp và số huy chương của các thành viên."
      />

      <div className="grid gap-5 xl:grid-cols-[1.6fr,1fr]">
        <div className="space-y-5">
          {top3.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-3">
              {top3.map((r, i) => (
                <div
                  key={r.id}
                  className="card flex flex-col items-center gap-2 p-5 text-center"
                >
                  <span className={`grid h-10 w-10 place-items-center rounded-full text-lg font-black ${RANK_STYLE[i]}`}>
                    {i + 1}
                  </span>
                  <PersonAvatar name={r.full_name} url={r.avatar_url} size="lg" />
                  <div>
                    <p className="font-bold">{r.full_name ?? "Thành viên"}</p>
                    <p className="text-xs text-ink/60">{ROLE_LABELS[r.role]}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-1 font-bold text-primary-dark">
                      <Star size={14} /> {r.total_points}
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-ink/70">
                      <MedalIcon size={14} /> {r.total_medals}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!board.ok ? (
            <ErrorState message={board.message} detail={board.detail} />
          ) : board.rows.length === 0 ? (
            <Panel>
              <EmptyState
                title="Chưa có dữ liệu xếp hạng"
                description="Khi có điểm đóng góp, bảng xếp hạng sẽ hiển thị tại đây."
              />
            </Panel>
          ) : (
            <Panel>
              <PanelHead title="Toàn bộ thành viên" subtitle={`${board.rows.length} người`} />
              <ol className="divide-y divide-line">
                {board.rows.map((r, i) => {
                  const mine = r.id === user.id;
                  return (
                    <li
                      key={r.id}
                      className={`flex items-center gap-3 px-5 py-3 ${mine ? "bg-primary/5" : ""}`}
                    >
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-black ${
                          i < 3 ? RANK_STYLE[i] : "bg-muted text-ink/60"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <PersonAvatar name={r.full_name} url={r.avatar_url} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                          {r.full_name ?? "Thành viên"}
                          {mine && <span className="ml-2 text-xs text-primary">(bạn)</span>}
                        </p>
                        <p className="text-xs text-ink/60">{ROLE_LABELS[r.role]}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 text-sm">
                        <span className="inline-flex items-center gap-1 font-bold text-primary-dark">
                          <Star size={14} /> {r.total_points}
                        </span>
                        <span className="inline-flex items-center gap-1 font-bold text-ink/70">
                          <MedalIcon size={14} /> {r.total_medals}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Panel>
          )}
        </div>

        <Panel className="h-fit">
          <PanelHead title="Huy chương của tôi" subtitle={`${myMedalsRows.length} huy chương`} />
          {myMedalsRows.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-ink/60">
              Bạn chưa có huy chương. Hoàn thành nhiệm vụ và tích luỹ điểm để nhận huy chương.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {myMedalsRows.map((pm) => (
                <li key={pm.id} className="flex items-center gap-3 px-5 py-3">
                  {pm.medals && <MedalChip tier={pm.medals.tier} name={pm.medals.name} />}
                  <span className="min-w-0 flex-1 truncate text-xs text-ink/60">
                    {pm.medals?.description ?? ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
