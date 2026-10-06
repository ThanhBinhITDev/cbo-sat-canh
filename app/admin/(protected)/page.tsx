import Link from "next/link";
import {
  MessageSquare,
  FileCheck2,
  FileClock,
  Users,
  CircleHelp,
  FileText,
  Stethoscope,
  Images,
  UserCog,
} from "lucide-react";
import { Flash, PageHeader, Panel, PanelHead, EmptyState } from "@/components/admin/ui";
import { ErrorState } from "@/components/admin/States";
import GuideBanner from "@/components/admin/GuideBanner";
import {
  checkTables,
  getDashboardStats,
  getLatestMessages,
  getLinkCounts,
  getMessagesPerDay,
} from "@/lib/admin/data";
import { SERVICE_OPTIONS } from "@/lib/types";
import { formatTime } from "@/lib/format";

const SERVICE_LABELS = Object.fromEntries(
  SERVICE_OPTIONS.map((o) => [o.value, o.label]),
);

const GUIDE_BULLETS = [
  "Nhấp vào một ô số để tới thẳng trang đó.",
  "Chấm xanh bên cạnh tên là câu hỏi chưa trả lời.",
  "Biểu đồ lấy 14 ngày gần nhất, tự làm mới khi tải trang.",
];

export default async function AdminDashboard({
  searchParams,
}: PageProps<"/admin">) {
  const sp = await searchParams;
  const [stats, latest, tableWarning, perDay, linkCounts] = await Promise.all([
    getDashboardStats(),
    getLatestMessages(5),
    checkTables(),
    getMessagesPerDay(),
    getLinkCounts(),
  ]);

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Tổng quan"
        description="Theo dõi câu hỏi mới, bài viết và người đăng ký nhận tin."
        className=""
      />
      <Flash
        flash={typeof sp.flash === "string" ? sp.flash : undefined}
        error={typeof sp.err === "string" ? sp.err : undefined}
      />

      {tableWarning && (
        <p className="alert-error" role="alert">
          {tableWarning}
        </p>
      )}

      <GuideBanner
        bullets={GUIDE_BULLETS}
        note="Bài nháp chưa hiện trên trang web — cần Xuất bản."
      />

      {!stats.ok ? (
        <ErrorState message={stats.message} detail={stats.detail} />
      ) : (
        <>
          <div className="grid gap-px overflow-hidden rounded-card border border-muted bg-line sm:grid-cols-2 xl:grid-cols-4">
            <StatCell
              icon={<MessageSquare size={20} />}
              label="Câu hỏi mới"
              value={stats.value.newMessages}
              hint={`${stats.value.totalMessages} câu hỏi đã nhận`}
              href="/admin/cau-hoi"
            />
            <StatCell
              icon={<FileCheck2 size={20} />}
              label="Bài đã xuất bản"
              value={stats.value.published}
              hint="Hiển thị công khai"
              href="/admin/bai-viet"
            />
            <StatCell
              icon={<FileClock size={20} />}
              label="Bài nháp"
              value={stats.value.drafts}
              hint="Chưa xuất bản"
              href="/admin/bai-viet"
            />
            <StatCell
              icon={<Users size={20} />}
              label="Người đăng ký nhận tin"
              value={stats.value.subscribers}
              hint="Đang hoạt động"
              href="/admin/newsletter"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ChartCard
                counts={perDay.ok ? perDay.value : new Array(14).fill(0)}
              />
            </div>
            <LinksCard counts={linkCounts.ok ? linkCounts.value : null} />
          </div>

          <div>
            <Panel>
              <PanelHead
                title="Câu hỏi mới nhất"
                subtitle="5 câu hỏi gần nhất từ biểu mẫu liên hệ"
                action={
                  <Link
                    href="/admin/cau-hoi"
                    className="inline-flex h-8 items-center text-sm font-bold text-primary hover:underline"
                  >
                    Xem tất cả →
                  </Link>
                }
              />
              {!latest.ok ? (
                <ErrorState message={latest.message} detail={latest.detail} />
              ) : latest.rows.length === 0 ? (
                <EmptyState
                  title="Chưa có câu hỏi nào"
                  description="Câu hỏi từ trang Liên hệ sẽ xuất hiện tại đây."
                />
              ) : (
                <div className="tbl-scroll tbl-msg">
                  <table className="table-admin">
                    <thead>
                      <tr>
                        <th>Tên</th>
                        <th>Số điện thoại</th>
                        <th className="col-aux">Dịch vụ quan tâm</th>
                        <th className="col-aux">Thời gian</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latest.rows.map((m) => (
                        <tr key={m.id}>
                          <td className="font-semibold">
                            <span className="flex items-center gap-2">
                              {m.status === "new" && (
                                <span className="dot-new h-2 w-2 shrink-0 rounded-full" />
                              )}
                              {m.name}
                            </span>
                          </td>
                          <td>
                            <a
                              href={`tel:${m.phone.replace(/\D/g, "")}`}
                              className="font-semibold text-primary-dark hover:underline"
                            >
                              {m.phone}
                            </a>
                          </td>
                          <td className="col-aux text-ink/80">
                            {SERVICE_LABELS[m.service_interest ?? ""] ??
                              m.service_interest ??
                              "—"}
                          </td>
                          <td className="col-aux whitespace-nowrap text-ink/80">
                            {formatTime(m.created_at)}
                          </td>
                          <td>
                            <StatusBadge status={m.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

function StatCell({
  icon,
  label,
  value,
  hint,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-surface p-5 transition hover:bg-primary/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-ink/80">
            {label}
          </p>
          <p className="mt-1.5 text-3xl font-extrabold text-primary-dark">
            {value}
          </p>
          <p className="mt-1 text-xs text-ink/80">{hint}</p>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </span>
      </div>
    </Link>
  );
}

function ChartCard({ counts }: { counts: number[] }) {
  const max = Math.max(...counts, 1);
  const points = counts
    .map((count, index) => {
      const x = Math.round((index * 560) / 13);
      const y = Math.round(150 - (count / max) * 128);
      return `${x},${y}`;
    })
    .join(" ");
  const lastY = Math.round(150 - (counts[13] / max) * 128);

  const today = new Date();
  const labels = [-14, -10, -6, -3, 0].map((offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });

  return (
    <div className="card h-full overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-base font-bold">Câu hỏi theo ngày</h2>
          <p className="text-xs text-ink/80">14 ngày gần nhất</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-ink/80">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Câu hỏi
        </span>
      </div>
      <div className="relative mt-4 h-44">
        <svg
          viewBox="0 0 560 160"
          preserveAspectRatio="none"
          className="block h-full w-full"
          role="img"
          aria-label="Biểu đồ số câu hỏi 14 ngày gần nhất"
        >
          {[46, 94, 142].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="560"
              y2={y}
              stroke="var(--brand-line)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <polyline
            points={points}
            fill="none"
            stroke="var(--brand-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <span
          className="absolute text-xs font-bold text-primary-dark"
          style={{ top: "16%", right: "4%" }}
        >
          {`Hôm nay · ${counts[13]}`}
        </span>
        <span
          className="absolute h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/20"
          style={{
            left: "98.2%",
            top: `${(lastY / 160) * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>
      <div className="flex justify-between border-t border-line px-3 py-2.5 text-xs text-ink/80">
        {labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}

function LinksCard({
  counts,
}: {
  counts: { newMessages: number; posts: number; services: number; team: number } | null;
}) {
  const tiles: {
    icon: React.ReactNode;
    label: string;
    href: string;
    count: number | null;
  }[] = [
    { icon: <CircleHelp size={16} />, label: "Câu hỏi mới", href: "/admin/cau-hoi", count: counts?.newMessages ?? 0 },
    { icon: <FileText size={16} />, label: "Bài viết", href: "/admin/bai-viet", count: counts?.posts ?? 0 },
    { icon: <Stethoscope size={16} />, label: "Dịch vụ", href: "/admin/dich-vu", count: counts?.services ?? 0 },
    { icon: <Users size={16} />, label: "Đội ngũ", href: "/admin/doi-ngu", count: counts?.team ?? 0 },
    { icon: <Images size={16} />, label: "Quản lý ảnh", href: "/admin/anh", count: null },
    { icon: <UserCog size={16} />, label: "Tài khoản", href: "/admin/tai-khoan", count: null },
  ];

  return (
    <div>
      <div className="card links-card overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-base font-bold">Lối tắt</h2>
        </div>
        <div className="links-grid p-4">
          {tiles.map((tile) => (
            <Link
              key={tile.label}
              href={tile.href}
              className="rounded-xl border border-line p-3 transition hover:bg-primary/5 hover:text-primary-dark"
            >
              <span className="mb-2 grid h-8 w-8 place-items-center rounded-lg bg-primary/20 text-primary">
                {tile.icon}
              </span>
              <span className="block text-xs font-bold leading-tight">
                {tile.label}
              </span>
              {tile.count !== null && (
                <span className="mt-0.5 block text-xs text-ink/80">
                  {tile.count}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    new: { cls: "badge-green", label: "Mới" },
    replied: { cls: "badge-blue", label: "Đã trả lời" },
    archived: { cls: "badge-gray", label: "Đã lưu trữ" },
  };
  const item = map[status] ?? { cls: "badge-gray", label: status };
  return <span className={`badge ${item.cls}`}>{item.label}</span>;
}
