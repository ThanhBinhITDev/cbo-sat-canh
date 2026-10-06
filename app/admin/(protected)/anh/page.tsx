import Link from "next/link";
import { Images, Trash2 } from "lucide-react";
import { Flash, PageHeader, Panel, PanelHead, EmptyState, Field } from "@/components/admin/ui";
import { ErrorState, Notice } from "@/components/admin/States";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import CopyUrlButton from "@/components/admin/CopyUrlButton";
import MediaUploader from "@/components/admin/MediaUploader";
import { getMediaAdmin } from "@/lib/admin/data";
import { deleteMedia, saveMediaMeta } from "@/lib/admin/actions";
import { getSessionUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";

const KINDS = [
  { value: "", label: "Tất cả" },
  { value: "hero", label: "Banner" },
  { value: "logo", label: "Logo" },
  { value: "decoration", label: "Trang trí" },
  { value: "avatar", label: "Đại diện" },
  { value: "other", label: "Khác" },
];

export default async function MediaAdminPage({
  searchParams,
}: PageProps<"/admin/anh">) {
  const sp = await searchParams;
  const [result, user] = await Promise.all([getMediaAdmin(), getSessionUser()]);
  const canManage = user?.profile?.role === "admin";
  const kind = typeof sp.kind === "string" ? sp.kind : "";
  const selectedId = typeof sp.chon === "string" ? sp.chon : "";

  const rows = result.ok
    ? result.rows.filter((r) => (kind ? r.kind === kind : true))
    : [];
  const selected = result.ok ? result.rows.find((r) => r.id === selectedId) : undefined;

  return (
    <>
      <PageHeader
        title="Quản lý ảnh"
        description="Thư viện ảnh dùng cho banner, logo, trang trí và ảnh bìa bài viết."
        action={
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-xs font-bold text-ink/60">
            <Images size={15} /> {result.ok ? result.rows.length : 0} ảnh
          </span>
        }
      />

      <Flash
        flash={typeof sp.flash === "string" ? sp.flash : undefined}
        error={typeof sp.err === "string" ? sp.err : undefined}
      />

      {!result.ok ? (
        <ErrorState message={result.message} detail={result.detail} />
      ) : (
        <>
          <MediaUploader canManage={canManage} />

          <div className="mb-4 flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <Link
                key={k.value}
                href={`/admin/anh${k.value ? `?kind=${k.value}` : ""}`}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  kind === k.value
                    ? "bg-primary text-white"
                    : "border border-line bg-white text-ink/65 hover:border-primary hover:text-primary"
                }`}
              >
                {k.label}
              </Link>
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.5fr,1fr]">
            <Panel>
              <PanelHead title="Thư viện" subtitle={`${rows.length} ảnh trong bộ lọc này`} />
              {rows.length === 0 ? (
                <EmptyState
                  title="Chưa có ảnh nào"
                  description="Tải ảnh lên hoặc thêm bằng đường dẫn ở khung phía trên."
                />
              ) : (
                <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
                  {rows.map((row) => (
                    <Link
                      key={row.id}
                      href={`/admin/anh?chon=${row.id}${kind ? `&kind=${kind}` : ""}`}
                      className={`group overflow-hidden rounded-2xl border bg-muted transition ${
                        row.id === selectedId
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-line hover:border-primary"
                      }`}
                    >
                      <span className="block aspect-square overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={row.public_url}
                          alt={row.alt ?? ""}
                          loading="lazy"
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                      </span>
                      <span className="block px-2.5 py-2">
                        <span className="block truncate text-[11px] font-bold">{row.alt ?? "Chưa đặt alt"}</span>
                        <span className="block text-[10px] uppercase tracking-wide text-ink/50">
                          {row.kind} · {formatDate(row.created_at)}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </Panel>

            <div className="xl:sticky xl:top-24 xl:h-fit">
              {!selected ? (
                <Notice
                  title="Chọn một ảnh để chỉnh sửa"
                  description="Bấm vào ảnh trong thư viện để xem chi tiết, sửa alt, sao chép đường dẫn hoặc xoá."
                />
              ) : (
                <Panel>
                  <PanelHead title="Chi tiết ảnh" />
                  <div className="space-y-4 p-5">
                    <div className="overflow-hidden rounded-2xl border border-line bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selected.public_url}
                        alt={selected.alt ?? ""}
                        className="max-h-64 w-full object-contain"
                      />
                    </div>

                    <form action={saveMediaMeta} className="space-y-4">
                      <input type="hidden" name="id" value={selected.id} />
                      <input
                        type="hidden"
                        name="back"
                        value={`/admin/anh?chon=${selected.id}${kind ? `&kind=${kind}` : ""}`}
                      />

                      <Field label="Văn bản thay thế (alt)" hint="Mô tả ảnh cho người khiếm thị và SEO">
                        <input
                          name="alt"
                          defaultValue={selected.alt ?? ""}
                          maxLength={300}
                          className="input"
                        />
                      </Field>

                      <Field label="Loại ảnh">
                        {canManage ? (
                          <select name="kind" defaultValue={selected.kind} className="select">
                            {KINDS.filter((k) => k.value).map((k) => (
                              <option key={k.value} value={k.value}>
                                {k.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="rounded-xl border border-line bg-muted px-3 py-2 text-sm font-bold text-ink/70">
                            {selected.kind}
                          </p>
                        )}
                      </Field>

                      <button type="submit" className="btn btn-primary w-full py-2.5 text-sm">
                        Lưu thay đổi
                      </button>
                    </form>

                    <div className="flex flex-wrap gap-2">
                      <CopyUrlButton url={selected.public_url} />
                      {canManage && (
                        <form action={deleteMedia}>
                          <input type="hidden" name="id" value={selected.id} />
                          <input type="hidden" name="storage_path" value={selected.storage_path ?? ""} />
                          <input
                            type="hidden"
                            name="back"
                            value={`/admin/anh${kind ? `?kind=${kind}` : ""}`}
                          />
                          <ConfirmSubmit confirmText="Xoá vĩnh viễn ảnh này khỏi thư viện?">
                            <Trash2 size={15} /> Xoá ảnh
                          </ConfirmSubmit>
                        </form>
                      )}
                    </div>

                    {!canManage && (
                      <p className="text-xs text-ink/50">
                        Bạn có thể sửa alt ảnh. Chỉ quản trị viên đổi loại hoặc xoá ảnh.
                      </p>
                    )}


                    {selected.storage_path && (
                      <p className="text-xs text-ink/55">
                        Lưu tại <code className="font-bold">{selected.storage_path}</code> trong bucket{" "}
                        <code className="font-bold">site-assets</code>.
                      </p>
                    )}
                  </div>
                </Panel>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
