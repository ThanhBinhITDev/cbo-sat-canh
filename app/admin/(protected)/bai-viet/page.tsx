import Link from "next/link";
import { Plus } from "lucide-react";
import { Flash, PageHeader, Panel, EmptyState } from "@/components/admin/ui";
import { ErrorState } from "@/components/admin/States";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { getPostsAdmin } from "@/lib/admin/data";
import { deletePost } from "@/lib/admin/actions";
import { getSessionUser } from "@/lib/auth";
import { CATEGORY_LABELS, type PostCategory, type PostStatus } from "@/lib/types";
import { formatDate } from "@/lib/format";

type Props = PageProps<"/admin/bai-viet">;

export default async function PostsAdminPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const category = typeof sp.category === "string" ? sp.category : "";
  const status = typeof sp.status === "string" ? sp.status : "";

  const [result, user] = await Promise.all([getPostsAdmin(), getSessionUser()]);
  const canDelete = user?.profile?.role === "admin";

  return (
    <>
      <PageHeader
        title="Bài viết & Tin tức"
        description="Quản lý toàn bộ bài đăng hiển thị ở trang Tin tức và trang chủ."
        action={
          <Link href="/admin/bai-viet/moi" className="btn btn-primary px-4 py-2.5 text-sm">
            <Plus size={18} /> Bài viết mới
          </Link>
        }
      />

      <Flash
        flash={typeof sp.flash === "string" ? sp.flash : undefined}
        error={typeof sp.err === "string" ? sp.err : undefined}
      />

      {!result.ok ? (
        <ErrorState message={result.message} detail={result.detail} />
      ) : (
        <Panel>
          <div className="border-b border-line p-4">
            <form method="get" className="grid gap-3 sm:grid-cols-[1fr,180px,170px,auto]">
              <input
                name="q"
                defaultValue={q}
                placeholder="Tìm theo tiêu đề..."
                className="input"
              />
              <select name="category" defaultValue={category} className="select">
                <option value="">Tất cả danh mục</option>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select name="status" defaultValue={status} className="select">
                <option value="">Tất cả trạng thái</option>
                <option value="published">Đã xuất bản</option>
                <option value="draft">Nháp</option>
              </select>
              <button type="submit" className="btn btn-ghost px-5 py-2.5 text-sm">
                Lọc
              </button>
            </form>
          </div>

          {(() => {
            const rows = result.rows.filter((row) => {
              if (q && !row.title.toLowerCase().includes(q.toLowerCase())) return false;
              if (category && row.category !== category) return false;
              if (status && row.status !== status) return false;
              return true;
            });

            if (rows.length === 0) {
              return (
                <EmptyState
                  title="Chưa có bài viết phù hợp"
                  description={
                    result.rows.length === 0
                      ? "Bắt đầu bằng cách tạo bài viết đầu tiên cho website."
                      : "Không có bài nào khớp bộ lọc hiện tại. Thử đổi từ khóa hoặc bộ lọc."
                  }
                  action={
                    <Link href="/admin/bai-viet/moi" className="btn btn-primary px-4 py-2 text-sm">
                      <Plus size={17} /> Tạo bài viết
                    </Link>
                  }
                />
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="table-admin">
                  <thead>
                    <tr>
                      <th>Tiêu đề</th>
                      <th>Danh mục</th>
                      <th>Trạng thái</th>
                      <th>Tác giả</th>
                      <th>Cập nhật</th>
                      <th className="text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td className="max-w-[22rem]">
                          <Link
                            href={`/admin/bai-viet/${row.id}`}
                            className="block truncate font-semibold text-primary-dark hover:underline"
                          >
                            {row.title}
                          </Link>
                          <span className="truncate text-xs text-ink/50">
                            /tin-tuc/{row.slug}
                            {row.is_featured && " · nổi bật"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap text-ink/70">
                          {CATEGORY_LABELS[row.category as PostCategory] ?? row.category}
                        </td>
                        <td>
                          <StatusBadge status={row.status as PostStatus} />
                        </td>
                        <td className="whitespace-nowrap text-ink/70">
                          {row.author_name ?? "—"}
                        </td>
                        <td className="whitespace-nowrap text-ink/60">
                          {formatDate(row.updated_at)}
                        </td>
                        <td>
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/admin/bai-viet/${row.id}`}
                              className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink/70 transition hover:border-primary hover:text-primary"
                            >
                              Sửa
                            </Link>
                            {canDelete && (
                              <form action={deletePost}>
                                <input type="hidden" name="id" value={row.id} />
                                <input type="hidden" name="back" value="/admin/bai-viet" />
                                <ConfirmSubmit confirmText={`Xoá bài "${row.title}"?`}>
                                  Xoá
                                </ConfirmSubmit>
                              </form>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </Panel>
      )}
    </>
  );
}

function StatusBadge({ status }: { status: PostStatus }) {
  return status === "published" ? (
    <span className="badge badge-green">Đã xuất bản</span>
  ) : (
    <span className="badge badge-yellow">Nháp</span>
  );
}
