import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Panel } from "@/components/admin/ui";
import { getSessionUser } from "@/lib/auth";
import { canManageCollab } from "@/lib/collab";
import { formatDate } from "@/lib/format";

export default async function DocDetailPage({
  params,
}: PageProps<"/admin/tai-lieu/[id]">) {
  const user = await getSessionUser();
  if (!user?.profile || !canManageCollab(user.profile)) return null;
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("storage.objects")
    .select("id, name, bucket_id, path_tokens, created_at, size, metadata")
    .eq("id", id)
    .maybeSingle();
  if (!data || data.bucket_id !== "internal-docs") notFound();
  const path = (data.path_tokens as string[])?.join("/") || data.name;
  const { data: signed } = await supabase.storage.from("internal-docs").createSignedUrl(path, 3600);
  const url = signed?.signedUrl;

  return (
    <>
      <PageHeader
        title={data.name}
        description="Tài liệu nội bộ — chỉ truy cập được trong phạm vi quyền."
        action={<Link href="/admin/tai-lieu" className="btn btn-ghost text-sm">Quay lại</Link>}
      />
      <Panel className="space-y-3 p-5">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink/60">Ngày tải lên</dt>
            <dd>{formatDate(data.created_at)}</dd>
          </div>
          <div>
            <dt className="text-ink/60">Kích thước</dt>
            <dd>{data.size ? `${Math.round((data.size as number) / 1024)} KB` : "—"}</dd>
          </div>
        </dl>
        {url ? (
          <div className="flex gap-2">
            <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-primary text-sm">
              Xem / Tải xuống
            </a>
          </div>
        ) : (
          <p className="text-sm text-ink/60">Không tạo được liên kết tạm thời.</p>
        )}
      </Panel>
    </>
  );
}
