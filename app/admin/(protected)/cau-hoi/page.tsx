import Link from "next/link";
import { Phone, MessageCircle, Mail, Trash2, Inbox } from "lucide-react";
import { Flash, PageHeader, Panel, PanelHead, EmptyState } from "@/components/admin/ui";
import { ErrorState } from "@/components/admin/States";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { getContactsAdmin } from "@/lib/admin/data";
import { deleteContactMessage, updateContactStatus } from "@/lib/admin/actions";
import { getSessionUser } from "@/lib/auth";
import { SERVICE_OPTIONS, type ContactStatus } from "@/lib/types";
import { formatTime } from "@/lib/format";

const FILTERS = [
  { value: "", label: "Tất cả" },
  { value: "new", label: "Mới" },
  { value: "replied", label: "Đã trả lời" },
  { value: "archived", label: "Đã lưu trữ" },
];

const SERVICE_LABELS = Object.fromEntries(SERVICE_OPTIONS.map((o) => [o.value, o.label]));

const STATUS_BADGE: Record<ContactStatus, { cls: string; label: string }> = {
  new: { cls: "badge-green", label: "Mới" },
  replied: { cls: "badge-blue", label: "Đã trả lời" },
  archived: { cls: "badge-gray", label: "Đã lưu trữ" },
};

export default async function ContactMessagesPage({
  searchParams,
}: PageProps<"/admin/cau-hoi">) {
  const sp = await searchParams;
  const [result, user] = await Promise.all([getContactsAdmin(), getSessionUser()]);
  const role = user?.profile?.role;
  const canEdit = role === "admin" || role === "editor";
  const canDelete = role === "admin";
  const status = typeof sp.trang_thai === "string" ? sp.trang_thai : "";
  const selectedId = typeof sp.chon === "string" ? sp.chon : "";

  const rows = result.ok
    ? result.rows.filter((r) => (status ? r.status === status : true))
    : [];
  const selected = result.ok ? result.rows.find((r) => r.id === selectedId) : undefined;
  const basePath = (s: string, id?: string) =>
    `/admin/cau-hoi?trang_thai=${encodeURIComponent(s)}${id ? `&chon=${id}` : ""}`;

  return (
    <>
      <PageHeader
        title="Câu hỏi liên hệ"
        description="Tin nhắn gửi từ biểu mẫu liên hệ ở trang khách."
        action={
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-xs font-bold text-ink/60">
            <Inbox size={15} /> {result.ok ? result.rows.length : 0} câu hỏi
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
          <div className="mb-4 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Link
                key={f.value}
                href={basePath(f.value)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  status === f.value
                    ? "bg-primary text-white"
                    : "border border-line bg-white text-ink/65 hover:border-primary hover:text-primary"
                }`}
              >
                {f.label}
                <span className="ml-2 opacity-70">
                  {f.value
                    ? result.rows.filter((r) => r.status === f.value).length
                    : result.rows.length}
                </span>
              </Link>
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.5fr,1fr]">
            <Panel>
              <PanelHead title="Danh sách" subtitle={`${rows.length} câu hỏi`} />
              {rows.length === 0 ? (
                <EmptyState
                  title="Chưa có câu hỏi nào"
                  description="Câu hỏi từ trang Liên hệ sẽ tự động xuất hiện tại đây."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-admin">
                    <thead>
                      <tr>
                        <th>Tên</th>
                        <th>Số điện thoại</th>
                        <th>Dịch vụ</th>
                        <th>Nội dung</th>
                        <th>Trạng thái</th>
                        <th>Thời gian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id} className="cursor-pointer">
                          <td>
                            <Link href={basePath(status, row.id)} className="block">
                              <span className="flex items-center gap-2 font-semibold">
                                {row.status === "new" && (
                                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                                )}
                                {row.name}
                              </span>
                            </Link>
                          </td>
                          <td>
                            <a
                              href={`tel:${row.phone.replace(/\D/g, "")}`}
                              className="font-semibold text-primary-dark hover:underline"
                            >
                              {row.phone}
                            </a>
                          </td>
                          <td className="text-ink/70">
                            {SERVICE_LABELS[row.service_interest ?? ""] ?? row.service_interest ?? "—"}
                          </td>
                          <td className="max-w-[16rem]">
                            <Link
                              href={basePath(status, row.id)}
                              className="block truncate text-ink/65 hover:text-primary"
                            >
                              {row.message}
                            </Link>
                          </td>
                          <td>
                            <span className={`badge ${STATUS_BADGE[row.status].cls}`}>
                              {STATUS_BADGE[row.status].label}
                            </span>
                          </td>
                          <td className="whitespace-nowrap text-ink/60">
                            {formatTime(row.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            <div className="xl:sticky xl:top-24 xl:h-fit">
              {!selected ? (
                <Panel>
                  <EmptyState
                    title="Chọn một câu hỏi"
                    description="Bấm vào một dòng để xem đầy đủ nội dung, gọi hoặc nhắn Zalo cho người gửi."
                  />
                </Panel>
              ) : (
                <Panel>
                  <PanelHead
                    title="Chi tiết câu hỏi"
                    subtitle={formatTime(selected.created_at)}
                  />
                  <div className="space-y-4 p-5">
                    <div className="rounded-2xl bg-muted p-4">
                      <p className="text-lg font-extrabold">{selected.name}</p>
                      <p className="mt-0.5 text-sm font-semibold text-primary-dark">
                        {selected.phone}
                      </p>
                      {selected.email && (
                        <p className="break-all text-sm text-ink/65">{selected.email}</p>
                      )}
                      <p className="mt-2 text-xs uppercase tracking-wide text-ink/50">
                        Quan tâm:{" "}
                        {SERVICE_LABELS[selected.service_interest ?? ""] ??
                          selected.service_interest ??
                          "Chưa chọn"}
                      </p>
                    </div>

                    <div>
                      <p className="label">Nội dung</p>
                      <p className="whitespace-pre-wrap rounded-2xl border border-line p-4 text-sm leading-relaxed">
                        {selected.message}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`tel:${selected.phone.replace(/\D/g, "")}`}
                        className="btn btn-primary px-4 py-2 text-xs"
                      >
                        <Phone size={15} /> Gọi
                      </a>
                      <a
                        href={`https://zalo.me/${selected.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost px-4 py-2 text-xs"
                      >
                        <MessageCircle size={15} /> Nhắn Zalo
                      </a>
                      {selected.email && (
                        <a
                          href={`mailto:${selected.email}`}
                          className="btn btn-ghost px-4 py-2 text-xs"
                        >
                          <Mail size={15} /> Gửi email
                        </a>
                      )}
                    </div>

                    {canEdit ? (
                      <div className="space-y-2 border-t border-line pt-4">
                        <p className="label">Cập nhật trạng thái</p>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {(["new", "replied", "archived"] as ContactStatus[]).map((value) => (
                            <form key={value} action={updateContactStatus}>
                              <input type="hidden" name="id" value={selected.id} />
                              <input type="hidden" name="status" value={value} />
                              <button
                                type="submit"
                                disabled={selected.status === value}
                                className={`w-full rounded-xl px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${
                                  selected.status === value
                                    ? "bg-primary text-white"
                                    : "border border-line text-ink/70 hover:border-primary hover:text-primary"
                                }`}
                              >
                                {STATUS_BADGE[value].label}
                              </button>
                            </form>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-line pt-4">
                        <p className="label">Trạng thái</p>
                        <span className={`badge ${STATUS_BADGE[selected.status].cls}`}>
                          {STATUS_BADGE[selected.status].label}
                        </span>
                        <p className="mt-2 text-xs text-ink/50">
                          Cộng tác viên chỉ xem — không đổi được trạng thái.
                        </p>
                      </div>
                    )}

                    {canDelete && (
                      <div className="border-t border-line pt-4">
                        <form action={deleteContactMessage}>
                          <input type="hidden" name="id" value={selected.id} />
                          <ConfirmSubmit confirmText="Xoá vĩnh viễn câu hỏi này?">
                            <Trash2 size={15} /> Xoá câu hỏi
                          </ConfirmSubmit>
                        </form>
                        <p className="mt-2 text-xs text-ink/50">
                          Chỉ quản trị viên mới xoá được câu hỏi.
                        </p>
                      </div>
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
