import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
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
import { getPartnersAdmin } from "@/lib/admin/data";
import { deletePartner, savePartner } from "@/lib/admin/actions";

const GROUPS: { value: string; label: string }[] = [
  { value: "strategic", label: "Đối tác chiến lược" },
  { value: "clinic", label: "Phòng khám" },
  { value: "network", label: "Mạng lưới CBO" },
];

const GROUP_LABELS = Object.fromEntries(GROUPS.map((g) => [g.value, g.label]));

export default async function PartnersAdminPage({
  searchParams,
}: PageProps<"/admin/doi-tac">) {
  const sp = await searchParams;
  const result = await getPartnersAdmin();
  const editId = typeof sp.edit === "string" ? sp.edit : "";
  const editing = result.ok ? result.rows.find((r) => r.id === editId) : undefined;
  const group = typeof sp.nhom === "string" ? sp.nhom : "strategic";

  return (
    <>
      <PageHeader
        title="Đối tác"
        description="Logo và thông tin đối tác hiển thị ở trang giới thiệu."
        action={
          <a href="/admin/doi-tac" className="btn btn-primary px-4 py-2.5 text-sm">
            <Plus size={18} /> Thêm đối tác
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
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {GROUPS.map((g) => (
                <a
                  key={g.value}
                  href={`/admin/doi-tac?nhom=${g.value}`}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                    group === g.value
                      ? "bg-primary text-white"
                      : "border border-line bg-white text-ink/65 hover:border-primary hover:text-primary"
                  }`}
                >
                  {g.label}
                  <span className="ml-2 opacity-70">
                    {result.rows.filter((r) => r.group === g.value).length}
                  </span>
                </a>
              ))}
            </div>

            <Panel>
              <PanelHead
                title={GROUP_LABELS[group] ?? "Đối tác"}
                subtitle="Sắp xếp theo thứ tự ưu tiên"
              />
              {(() => {
                const rows = result.rows.filter((r) => r.group === group);
                if (rows.length === 0) {
                  return (
                    <EmptyState
                      title="Chưa có đối tác trong nhóm này"
                      description="Thêm đối tác để hiển thị logo trong trang giới thiệu."
                    />
                  );
                }
                return (
                  <div className="grid gap-3 p-4 sm:grid-cols-2">
                    {rows.map((row) => (
                      <div
                        key={row.id}
                        className="flex items-center gap-3 rounded-2xl border border-line p-3"
                      >
                        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
                          {row.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.logo_url}
                              alt={row.name}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <span className="text-xs font-black text-ink/40">
                              {row.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">{row.name}</p>
                          <p className="text-xs text-ink/55">
                            #{row.sort_order} · {row.is_active ? "hiển thị" : "ẩn"}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                          {row.website_url && (
                            <a
                              href={row.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="grid h-8 w-8 place-items-center rounded-xl border border-line text-ink/55 hover:border-primary hover:text-primary"
                              aria-label="Mở website"
                            >
                              <ExternalLink size={15} />
                            </a>
                          )}
                          <a
                            href={`/admin/doi-tac?edit=${row.id}&nhom=${row.group}`}
                            className="grid h-8 w-8 place-items-center rounded-xl border border-line text-ink/55 hover:border-primary hover:text-primary"
                            aria-label={`Sửa ${row.name}`}
                          >
                            <Pencil size={15} />
                          </a>
                          <form action={deletePartner}>
                            <input type="hidden" name="id" value={row.id} />
                            <ConfirmSubmit confirmText={`Xoá đối tác "${row.name}"?`}>
                              <Trash2 size={15} />
                            </ConfirmSubmit>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </Panel>
          </div>

          {(!editId || Boolean(editing)) && (
            <Panel className="h-fit">
              <PanelHead
                title={editing ? "Sửa đối tác" : "Thêm đối tác"}
                subtitle="Logo nên là ảnh vuông nền trong suốt (PNG)"
              />
              <form action={savePartner} className="space-y-4 p-5">
                {editing && <input type="hidden" name="id" value={editing.id} />}

                <Field label="Tên đối tác" required>
                  <input
                    name="name"
                    defaultValue={editing?.name ?? ""}
                    required
                    maxLength={200}
                    className="input"
                  />
                </Field>

                <Field label="Nhóm">
                  <select name="group" defaultValue={editing?.group ?? group} className="select">
                    {GROUPS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Logo (URL)" hint="Ảnh PNG/SVG nền trong suốt, kích thước 360px">
                  <input
                    name="logo_url"
                    defaultValue={editing?.logo_url ?? ""}
                    placeholder="https://..."
                    className="input"
                  />
                </Field>

                <Field label="Website">
                  <input
                    name="website_url"
                    defaultValue={editing?.website_url ?? ""}
                    placeholder="https://..."
                    className="input"
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
                  <a href={`/admin/doi-tac?nhom=${group}`} className="btn btn-ghost py-2.5 text-sm">
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
