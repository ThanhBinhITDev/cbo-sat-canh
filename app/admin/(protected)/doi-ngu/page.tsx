import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Flash,
  PageHeader,
  Panel,
  PanelHead,
  EmptyState,
  Field,
} from "@/components/admin/ui";
import { ErrorState } from "@/components/admin/States";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { getTeamAdmin } from "@/lib/admin/data";
import { deleteTeamMember, saveTeamMember } from "@/lib/admin/actions";

export default async function TeamAdminPage({
  searchParams,
}: PageProps<"/admin/doi-ngu">) {
  const sp = await searchParams;
  const result = await getTeamAdmin();
  const editId = typeof sp.edit === "string" ? sp.edit : "";
  const editing = result.ok ? result.rows.find((r) => r.id === editId) : undefined;

  return (
    <>
      <PageHeader
        title="Đội ngũ"
        description="Thành viên và cộng tác viên hiển thị ở mục Đội ngũ."
        action={
          <a href="/admin/doi-ngu" className="btn btn-primary px-4 py-2.5 text-sm">
            <Plus size={18} /> Thêm thành viên
          </a>
        }
      />

      <Flash
        flash={typeof sp.flash === "string" ? sp.flash : undefined}
        error={typeof sp.err === "string" ? sp.err : undefined}
      />

      {!result.ok ? (
        <ErrorState message={result.message} detail={result.detail} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.4fr,1fr]">
          <Panel>
            <PanelHead title="Danh sách" subtitle={`${result.rows.length} thành viên`} />
            {result.rows.length === 0 ? (
              <EmptyState
                title="Chưa có thành viên nào"
                description="Thêm thành viên đầu tiên để hiển thị ở trang giới thiệu."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="table-admin">
                  <thead>
                    <tr>
                      <th>Họ tên</th>
                      <th>Chức danh</th>
                      <th>Thứ tự</th>
                      <th>Trạng thái</th>
                      <th className="text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-sm font-black text-primary">
                              {row.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={row.avatar_url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                row.full_name.slice(0, 1).toUpperCase()
                              )}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{row.full_name}</p>
                              <p className="max-w-xs truncate text-xs text-ink/55">
                                {row.bio ?? "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="text-ink/70">{row.position ?? "—"}</td>
                        <td className="text-ink/55">{row.sort_order}</td>
                        <td>
                          <span className={`badge ${row.is_active ? "badge-green" : "badge-gray"}`}>
                            {row.is_active ? "Hiển thị" : "Ẩn"}
                          </span>
                        </td>
                        <td>
                          <div className="flex justify-end gap-2">
                            <a
                              href={`/admin/doi-ngu?edit=${row.id}`}
                              className="grid h-8 w-8 place-items-center rounded-xl border border-line text-ink/60 transition hover:border-primary hover:text-primary"
                              aria-label={`Sửa ${row.full_name}`}
                            >
                              <Pencil size={15} />
                            </a>
                            <form action={deleteTeamMember}>
                              <input type="hidden" name="id" value={row.id} />
                              <ConfirmSubmit
                                confirmText={`Xoá thành viên "${row.full_name}"?`}
                              >
                                <Trash2 size={15} />
                              </ConfirmSubmit>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          {(!editId || Boolean(editing)) && (
            <Panel className="h-fit">
              <PanelHead
                title={editing ? "Sửa thành viên" : "Thêm thành viên"}
                subtitle="Ảnh đại diện nên là ảnh vuông"
              />
              <form action={saveTeamMember} className="space-y-4 p-5">
                {editing && <input type="hidden" name="id" value={editing.id} />}

                <Field label="Họ và tên" required>
                  <input
                    name="full_name"
                    defaultValue={editing?.full_name ?? ""}
                    required
                    maxLength={150}
                    className="input"
                  />
                </Field>

                <Field label="Chức danh">
                  <input
                    name="position"
                    defaultValue={editing?.position ?? ""}
                    maxLength={150}
                    placeholder="Ví dụ: Điều phối viên"
                    className="input"
                  />
                </Field>

                <Field label="Ảnh đại diện (URL)">
                  <input
                    name="avatar_url"
                    defaultValue={editing?.avatar_url ?? ""}
                    placeholder="https://..."
                    className="input"
                  />
                </Field>

                <Field label="Tiểu sử ngắn" hint="Tối đa 600 ký tự">
                  <textarea
                    name="bio"
                    defaultValue={editing?.bio ?? ""}
                    maxLength={600}
                    rows={3}
                    className="textarea !min-h-[5rem]"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Thứ tự">
                    <input
                      type="number"
                      name="sort_order"
                      defaultValue={editing?.sort_order ?? result.rows.length + 1}
                      min={0}
                      className="input"
                    />
                  </Field>
                  <label className="mt-6 flex cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      name="is_active"
                      defaultChecked={editing?.is_active ?? true}
                      className="h-4 w-4 accent-[var(--brand-primary)]"
                    />
                    <span className="text-sm font-semibold">Hiển thị</span>
                  </label>
                </div>

                <div className="flex gap-2 pt-1">
                  <button type="submit" className="btn btn-primary flex-1 py-2.5 text-sm">
                    Lưu
                  </button>
                  <a href="/admin/doi-ngu" className="btn btn-ghost py-2.5 text-sm">
                    Huỷ
                  </a>
                </div>
              </form>
            </Panel>
          )}
        </div>
      )}
    </>
  );
}
