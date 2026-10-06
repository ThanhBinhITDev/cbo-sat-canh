import Link from "next/link";
import { MessageSquare, FileCheck2, FileClock, Users } from "lucide-react";
import { Flash, PageHeader, Panel, PanelHead, EmptyState } from "@/components/admin/ui";
import { ErrorState } from "@/components/admin/States";
import {
  checkTables,
  getDashboardStats,
  getLatestMessages,
} from "@/lib/admin/data";
import { SERVICE_OPTIONS } from "@/lib/types";
import { formatTime } from "@/lib/format";

const SERVICE_LABELS = Object.fromEntries(
  SERVICE_OPTIONS.map((o) => [o.value, o.label]),
);

export default async function AdminDashboard({
  searchParams,
}: PageProps<"/admin">) {
  const sp = await searchParams;
  const [stats, latest, tableWarning] = await Promise.all([
    getDashboardStats(),
    getLatestMessages(5),
    checkTables(),
  ]);

  return (
    <>
      <PageHeader
        title="Tổng quan"
        description="Theo dõi câu hỏi mới, bài viết và người đăng ký nhận tin."
      />
      <Flash flash={typeof sp.flash === "string" ? sp.flash : undefined} error={typeof sp.err === "string" ? sp.err : undefined} />

      {tableWarning && (
        <p className="alert-error mb-5" role="alert">
          {tableWarning}
        </p>
      )}

      {!stats.ok ? (
        <ErrorState message={stats.message} detail={stats.detail} />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<MessageSquare size={20} />}
              label="Câu hỏi mới"
              value={stats.value.newMessages}
              hint={`${stats.value.totalMessages} câu hỏi đã nhận`}
              href="/admin/cau-hoi"
              tone="primary"
            />
            <StatCard
              icon={<FileCheck2 size={20} />}
              label="Bài đã xuất bản"
              value={stats.value.published}
              hint="Hiển thị công khai"
              href="/admin/bai-viet"
              tone="green"
            />
            <StatCard
              icon={<FileClock size={20} />}
              label="Bài nháp"
              value={stats.value.drafts}
              hint="Chưa xuất bản"
              href="/admin/bai-viet"
              tone="yellow"
            />
            <StatCard
              icon={<Users size={20} />}
              label="Người đăng ký nhận tin"
              value={stats.value.subscribers}
              hint="Đang hoạt động"
              href="/admin/newsletter"
              tone="blue"
            />
          </div>

          <Panel>
            <PanelHead
              title="Câu hỏi mới nhất"
              subtitle="5 câu hỏi gần nhất từ biểu mẫu liên hệ"
              action={
                <Link href="/admin/cau-hoi" className="text-sm font-bold text-primary hover:underline">
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
              <div className="overflow-x-auto">
                <table className="table-admin">
                  <thead>
                    <tr>
                      <th>Tên</th>
                      <th>Số điện thoại</th>
                      <th>Dịch vụ quan tâm</th>
                      <th>Thời gian</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latest.rows.map((m) => (
                      <tr key={m.id}>
                        <td className="font-semibold">
                          <span className="flex items-center gap-2">
                            {m.status === "new" && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
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
                        <td className="text-ink/70">
                          {SERVICE_LABELS[m.service_interest ?? ""] ?? m.service_interest ?? "—"}
                        </td>
                        <td className="whitespace-nowrap text-ink/60">
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
        </>
      )}
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  href,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint: string;
  href: string;
  tone: "primary" | "green" | "yellow" | "blue";
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    green: "bg-emerald-100 text-emerald-600",
    yellow: "bg-amber-100 text-amber-600",
    blue: "bg-blue-100 text-blue-600",
  } as const;

  return (
    <Link href={href} className="card card-hover block p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink/55">{label}</p>
          <p className="mt-1.5 text-3xl font-extrabold text-primary-dark">{value}</p>
          <p className="mt-1 text-xs text-ink/55">{hint}</p>
        </div>
        <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tones[tone]}`}>
          {icon}
        </span>
      </div>
    </Link>
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
