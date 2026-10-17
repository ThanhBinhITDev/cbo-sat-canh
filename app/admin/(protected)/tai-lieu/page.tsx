import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Panel, PanelHead, EmptyState } from "@/components/admin/ui";
import { Notice } from "@/components/admin/States";
import { getSessionUser } from "@/lib/auth";
import { canManageCollab } from "@/lib/collab";
import { Plus } from "lucide-react";
import { formatDate } from "@/lib/format";

export default async function DocsListPage() {
  const user = await getSessionUser();
  if (!user?.profile || !canManageCollab(user.profile)) {
    return (
      <Notice
        title="Không có quyền truy cập"
        description="Chỉ người được cấp quyền quản lý cộng tác mới xem được tài liệu nội bộ."
      />
    );
  }
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("storage.objects")
    .select("id, name, created_at, size, metadata")
    .eq("bucket_id", "internal-docs")
    .order("created_at", { ascending: false })
    .limit(100);
  const items = data ?? [];

  return (
    <>
      <PageHeader
        title="Tài liệu nội bộ"
        description="Lưu trữ và chia sẻ tài liệu chỉ dành cho nhóm cộng tác."
        action={
          <Link href="/admin/tai-lieu/moi" className="btn btn-primary text-sm">
            <Plus size={16} /> Tải lên
          </Link>
        }
      />
      {items.length === 0 ? (
        <Panel>
          <EmptyState
            title="Chưa có tài liệu"
            description="Tải lên tài liệu nội bộ đầu tiên."
            action={
              <Link href="/admin/tai-lieu/moi" className="btn btn-primary text-sm">
                <Plus size={16} /> Tải lên
              </Link>
            }
          />
        </Panel>
      ) : (
        <Panel>
          <PanelHead title="Danh sách tài liệu" subtitle={`${items.length} tập tin`} />
          <ul className="divide-y divide-line">
            {items.map((f: { id: string; name: string; created_at: string; size?: number | null }) => (
              <li key={f.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/tai-lieu/${f.id}`} className="font-semibold hover:text-primary">
                    {f.name}
                  </Link>
                  <p className="text-xs text-ink/60">
                    {f.size ? `${Math.round(f.size / 1024)} KB` : ""}
                    {" · "}
                    {formatDate(f.created_at)}
                  </p>
                </div>
                <Link href={`/admin/tai-lieu/${f.id}`} className="btn btn-ghost text-sm">
                  Xem
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
