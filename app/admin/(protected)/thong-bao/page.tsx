import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Panel, PanelHead, EmptyState } from "@/components/admin/ui";
import { Notice } from "@/components/admin/States";
import { getSessionUser } from "@/lib/auth";
import { canManageCollab } from "@/lib/collab";
import { formatDate } from "@/lib/format";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user?.profile || !canManageCollab(user.profile)) {
    return (
      <Notice
        title="Không có quyền truy cập"
        description="Chỉ người được cấp quyền quản lý cộng tác mới xem được thông báo nội bộ."
      />
    );
  }
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, created_at, read")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const items = data ?? [];

  return (
    <>
      <PageHeader title="Thông báo nội bộ" description="Xem các thông báo liên quan đến cộng tác." />
      {items.length === 0 ? (
        <Panel>
          <EmptyState title="Chưa có thông báo" description="Khi có cập nhật, thông báo sẽ hiển thị tại đây." />
        </Panel>
      ) : (
        <Panel>
          <PanelHead title="Danh sách thông báo" subtitle={`${items.length} thông báo`} />
          <ul className="divide-y divide-line">
            {items.map((n: { id: string; title: string | null; body: string | null; created_at: string }) => (
              <li key={n.id} className="px-5 py-3">
                <p className="font-semibold">{n.title || "(Không tiêu đề)"}</p>
                <p className="text-sm text-ink/80">{n.body}</p>
                <p className="mt-1 text-xs text-ink/60">{formatDate(n.created_at)}</p>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
