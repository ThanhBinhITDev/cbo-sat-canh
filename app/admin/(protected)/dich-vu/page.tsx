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
import { getServicesAdmin } from "@/lib/admin/data";
import { deleteService, saveService } from "@/lib/admin/actions";

const ICON_OPTIONS = [
  ["test-tube", "Xét nghiệm"],
  ["shield-check", "Bảo vệ"],
  ["clock-alert", "Khẩn cấp"],
  ["heart-pulse", "Tim mạch / ARV"],
  ["stethoscope", "Khám tổng quát"],
  ["handshake", "Hợp tác"],
];

export default async function ServicesAdminPage({
  searchParams,
}: PageProps<"/admin/dich-vu">) {
  const sp = await searchParams;
  const result = await getServicesAdmin();
  const editId = typeof sp.edit === "string" ? sp.edit : "";
  const editing = result.ok ? result.rows.find((r) => r.id === editId) : undefined;

  return (
    <>
      <PageHeader
        title="Dịch vụ"
        description="Danh sách dịch vụ hiển thị ở trang chủ. Thứ tự theo ô sắp xếp."
        action={
          <a href="/admin/dich-vu" className="btn btn-primary px-4 py-2.5 text-sm">
            <Plus size={18} /> Thêm dịch vụ
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
            <PanelHead title="Danh sách" subtitle={`${result.rows.length} dịch vụ`} />
            {result.rows.length === 0 ? (
              <EmptyState
                title="Chưa có dịch vụ nào"
                description="Thêm dịch vụ đầu tiên để hiển thị ở trang chủ."
                action={
                  <a href="/admin/dich-vu" className="btn btn-primary px-4 py-2 text-sm">
                    <Plus size={17} /> Thêm dịch vụ
                  </a>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="table-admin">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Tên dịch vụ</th>
                      <th>Màu</th>
                      <th>Trạng thái</th>
                      <th className="text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, index) => (
                      <tr key={row.id}>
                        <td className="text-ink/50">{row.sort_order || index + 1}</td>
                        <td>
                          <p className="font-semibold">{row.title}</p>
                          <p className="max-w-md truncate text-xs text-ink/55">
                            {row.description ?? "—"}
                          </p>
                        </td>
                        <td>
                          <span
                            className="inline-block h-5 w-5 rounded-full border border-line"
                            style={{ background: row.color ?? "var(--brand-primary)" }}
                          />
                        </td>
                        <td>
                          <span className={`badge ${row.is_active ? "badge-green" : "badge-gray"}`}>
                            {row.is_active ? "Bật" : "Tắt"}
                          </span>
                        </td>
                        <td>
                          <div className="flex justify-end gap-2">
                            <a
                              href={`/admin/dich-vu?edit=${row.id}`}
                              className="grid h-8 w-8 place-items-center rounded-xl border border-line text-ink/60 transition hover:border-primary hover:text-primary"
                              aria-label={`Sửa ${row.title}`}
                            >
                              <Pencil size={15} />
                            </a>
                            <form action={deleteService}>
                              <input type="hidden" name="id" value={row.id} />
                              <ConfirmSubmit
                                confirmText={`Xoá dịch vụ "${row.title}"?`}
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
                title={editing ? "Sửa dịch vụ" : "Thêm dịch vụ"}
                subtitle={editing ? "Cập nhật thông tin và thứ tự" : "Điền thông tin rồi bấm Lưu"}
              />
              <form action={saveService} className="space-y-4 p-5">
                {editing && <input type="hidden" name="id" value={editing.id} />}

                <Field label="Tên dịch vụ" required>
                  <input
                    name="title"
                    defaultValue={editing?.title ?? ""}
                    required
                    maxLength={200}
                    placeholder="Ví dụ: Xét nghiệm nhanh HIV/STIs"
                    className="input"
                  />
                </Field>

                <Field label="Mô tả" hint="Tối đa 500 ký tự">
                  <textarea
                    name="description"
                    defaultValue={editing?.description ?? ""}
                    maxLength={500}
                    rows={3}
                    className="textarea !min-h-[5rem]"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Icon">
                    <select name="icon" defaultValue={editing?.icon ?? "test-tube"} className="select">
                      {ICON_OPTIONS.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Màu thẻ">
                    <input
                      type="color"
                      name="color"
                      defaultValue={editing?.color ?? "#279CD7"}
                      className="input h-11 cursor-pointer p-1.5"
                    />
                  </Field>
                </div>

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
                    <span className="text-sm font-semibold">Hiển thị ở trang chủ</span>
                  </label>
                </div>

                <div className="flex gap-2 pt-1">
                  <button type="submit" className="btn btn-primary flex-1 py-2.5 text-sm">
                    Lưu
                  </button>
                  <a href="/admin/dich-vu" className="btn btn-ghost py-2.5 text-sm">
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
