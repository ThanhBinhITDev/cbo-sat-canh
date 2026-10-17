import { createClient } from "@/lib/supabase/server";
import { PageHeader, Panel, PanelHead } from "@/components/admin/ui";
import { Notice } from "@/components/admin/States";
import { getSessionUser } from "@/lib/auth";
import { canManageCollab } from "@/lib/collab";
import { formatDate } from "@/lib/format";

export default async function ReportsPage() {
  const user = await getSessionUser();
  if (!user?.profile || user.profile.role !== "admin") {
    return (
      <Notice
        title="Không có quyền truy cập"
        description="Chỉ quản trị viên mới xem được báo cáo cộng tác."
      />
    );
  }
  const supabase = await createClient();
  if (!supabase) return null;
  const [tasks, board] = await Promise.all([
    supabase.from("tasks").select("id,status,priority,created_at").limit(100),
    supabase.rpc("collab_leaderboard"),
  ]);
  const t = tasks.data ?? [];
  const b = (board.data as Array<{ id: string; full_name: string | null; role: string; total_points: number; total_medals: number }>) ?? [];

  const byStatus = t.reduce<Record<string, number>>((acc, x) => {
    acc[x.status] = (acc[x.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHeader title="Báo cáo cộng tác" description="Thống kê nhanh về nhiệm vụ và xếp hạng." />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Panel>
          <PanelHead title="Tổng nhiệm vụ" />
          <p className="px-5 py-4 text-3xl font-black">{t.length}</p>
        </Panel>
        {Object.entries(byStatus).map(([k, v]) => (
          <Panel key={k}>
            <PanelHead title={k} />
            <p className="px-5 py-4 text-3xl font-black">{v}</p>
          </Panel>
        ))}
      </div>
      <Panel className="mt-5">
        <PanelHead title="Top thành viên" subtitle={`${b.length} kết quả`} />
        <ul className="divide-y divide-line">
          {b.slice(0, 20).map((r: { id: string; full_name: string | null; role: string; total_points: number }, i: number) => (
            <li key={r.id} className="flex items-center gap-3 px-5 py-3">
              <span className="text-sm font-black">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{r.full_name ?? "Thành viên"}</p>
                <p className="text-xs text-ink/60">{r.role}</p>
              </div>
              <span className="text-sm font-bold">{r.total_points} điểm</span>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
