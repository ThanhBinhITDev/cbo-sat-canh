import Link from "next/link";
import { Plus, Ellipsis } from "lucide-react";
import { Flash, PageHeader, Panel, EmptyState } from "@/components/admin/ui";
import { ErrorState } from "@/components/admin/States";
import GuideBanner from "@/components/admin/GuideBanner";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import SelectField from "@/components/admin/SelectField";
import { getPostsAdmin } from "@/lib/admin/data";
import { deletePost } from "@/lib/admin/actions";
import { getSessionUser } from "@/lib/auth";
import { CATEGORY_LABELS, type PostCategory, type PostStatus } from "@/lib/types";
import { formatDate } from "@/lib/format";

type Props = PageProps<"/admin/bai-viet">;

const GUIDE_BULLETS = [
  "Ảnh đại diện tỷ lệ 16:9, rộng từ 1200px.",
  "Bài Xuất bản mới hiện trên trang web; bài Nháp thì không.",
  "Bộ lọc giữ nguyên khi bạn tải lại trang.",
];

export default async function PostsAdminPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const category = typeof sp.category === "string" ? sp.category : "";
  const status = typeof sp.status === "string" ? sp.status : "";

  const [result, user] = await Promise.all([getPostsAdmin(), getSessionUser()]);
  const canDelete = user?.profile?.role === "admin";

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Bài viết & Tin tức"
        description="Quản lý toàn bộ bài đăng hiển thị ở trang Tin tức và trang chủ."
        className=""
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

      <GuideBanner
        bullets={GUIDE_BULLETS}
        note="Không xoá bài đã gắn ở trang chủ — gỡ khỏi menu trước."
      />

      {!result.ok ? (
        <ErrorState message={result.message} detail={result.detail} />
      ) : (
        <Panel>
          <div className="border-b border-line p-4">
            <form method="get" className="grid gap-3 sm:grid-cols-[1fr,180px,170px,auto]">
              <input
                type="search"
                autoComplete="off"
                aria-label="Tìm theo tiêu đề"
                name="q"
                defaultValue={q}
                placeholder="Tìm theo tiêu đề..."
                className="input"
              />
              <SelectField
                name="category"
                defaultValue={category}
                options={[
                  { value: "", label: "Tất cả danh mục" },
                  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
                    value,
                    label,
                  })),
                ]}
              />
              <SelectField
                name="status"
                defaultValue={status}
                options={[
                  { value: "", label: "Tất cả trạng thái" },
                  { value: "published", label: "Đã xuất bản" },
                  { value: "draft", label: "Nháp" },
                ]}
              />
              <button type="submit" className="btn btn-ghost px-5 py-2.5 text-sm">
                Lọc
              </button>
            </form>
          </div>

          <div className="post-view">
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
                <>
                  <div className="tbl-scroll tbl-post">
                    <table className="table-admin">
                      <thead>
                        <tr>
                          <th>Tiêu đề</th>
                          <th className="col-aux">Danh mục</th>
                          <th>Trạng thái</th>
                          <th className="col-aux">Tác giả</th>
                          <th className="col-aux">Cập nhật</th>
                          <th className="col-act text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={row.id}>
                            <td>
                              <Link
                                href={`/admin/bai-viet/${row.id}`}
                                className="block line-clamp-1 font-medium text-primary-dark hover:underline"
                              >
                                {row.title}
                              </Link>
                              <span className="block truncate text-xs text-ink/80">
                                /tin-tuc/{row.slug}
                                {row.is_featured && "\u00a0·\u00a0nổi bật"}
                              </span>
                            </td>
                            <td className="col-aux whitespace-nowrap text-ink/80">
                              {CATEGORY_LABELS[row.category as PostCategory] ?? row.category}
                            </td>
                            <td>
                              <StatusBadge status={row.status as PostStatus} />
                            </td>
                            <td className="col-aux whitespace-nowrap text-ink/80">
                              {row.author_name ?? "—"}
                            </td>
                            <td className="col-aux whitespace-nowrap text-ink/80">
                              {formatDate(row.updated_at)}
                            </td>
                            <td className="col-act whitespace-nowrap">
                              <div className="flex justify-end gap-2">
                                <Link
                                  href={`/admin/bai-viet/${row.id}`}
                                  className="inline-flex h-8 items-center rounded-xl border border-line px-3 text-xs font-bold text-ink/80 transition hover:bg-primary/5 hover:text-primary"
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
                  <ul className="tbl-list">
                    {rows.map((row) => (
                      <li key={row.id} className="border-t border-line px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/admin/bai-viet/${row.id}`}
                            className="flex h-8 min-w-0 flex-1 items-center"
                          >
                            <span className="truncate font-medium text-primary-dark hover:underline">
                              {row.title}
                            </span>
                          </Link>
                          <Link
                            href={`/admin/bai-viet/${row.id}`}
                            aria-label={`Tuỳ chọn: ${row.title}`}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-line text-ink/80 transition hover:bg-primary/5 hover:text-primary"
                          >
                            <Ellipsis size={16} />
                          </Link>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate text-xs text-ink/80">
                            /tin-tuc/{row.slug}
                            {row.is_featured && "\u00a0·\u00a0nổi bật"}
                          </span>
                          <StatusBadge status={row.status as PostStatus} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              );
            })()}
          </div>
        </Panel>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: PostStatus }) {
  return status === "published" ? (
    <span className="badge badge-green">Đã xuất bản</span>
  ) : (
    <span className="badge badge-yellow">Nháp</span>
  );
}
