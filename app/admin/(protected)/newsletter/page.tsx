import { Mail, Download, UserMinus, UserCheck, Trash2 } from "lucide-react";
import { Flash, PageHeader, Panel, PanelHead, EmptyState } from "@/components/admin/ui";
import { ErrorState } from "@/components/admin/States";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { getNewslettersAdmin } from "@/lib/admin/data";
import { deleteNewsletter, toggleNewsletter } from "@/lib/admin/actions";
import { formatDate } from "@/lib/format";
import { getSessionUser } from "@/lib/auth";

export default async function NewsletterAdminPage({
  searchParams,
}: PageProps<"/admin/newsletter">) {
  const sp = await searchParams;
  const user = await getSessionUser();
  const role = user?.profile?.role;
  const canManage = role === "admin";
  const result = await getNewslettersAdmin();

  return (
    <>
      <PageHeader
        title="Đăng ký nhận tin"
        description="Danh sách email đăng ký nhận bản tin từ website."
        action={
          <a
            href="/api/admin/newsletter-csv"
            className="btn btn-ghost px-4 py-2.5 text-sm"
          >
            <Download size={17} /> Xuất CSV
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
        <Panel>
          <PanelHead
            title="Người đăng ký"
            subtitle={`${result.rows.length} email · ${
              canManage ? "quản trị viên có thể xoá" : "bạn chỉ xem và xuất CSV"
            }`}
          />
          {result.rows.length === 0 ? (
            <EmptyState
              title="Chưa có người đăng ký"
              description="Mẫu đăng ký nhận tin ở cuối trang khách sẽ tự lưu email vào đây."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-admin">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Họ tên</th>
                    <th>Nguồn</th>
                    <th>Ngày đăng ký</th>
                    <th>Trạng thái</th>
                    {canManage && <th className="text-right">Thao tác</th>}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row) => (
                    <tr key={row.id}>
                      <td className="font-semibold">
                        <span className="flex items-center gap-2">
                          <Mail size={15} className="text-primary" />
                          {row.email}
                        </span>
                      </td>
                      <td className="text-ink/70">{row.name ?? "—"}</td>
                      <td className="text-ink/60">{row.source}</td>
                      <td className="whitespace-nowrap text-ink/60">
                        {formatDate(row.created_at)}
                      </td>
                      <td>
                        <span className={`badge ${row.is_active ? "badge-green" : "badge-gray"}`}>
                          {row.is_active ? "Đang nhận tin" : "Đã ngừng"}
                        </span>
                      </td>
                      {canManage && (
                        <td>
                          <div className="flex justify-end gap-2">
                            <form action={toggleNewsletter}>
                              <input type="hidden" name="id" value={row.id} />
                              <input type="hidden" name="is_active" value={String(row.is_active)} />
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink/70 transition hover:border-primary hover:text-primary"
                              >
                                {row.is_active ? <UserMinus size={15} /> : <UserCheck size={15} />}
                                {row.is_active ? "Ngừng gửi" : "Kích hoạt"}
                              </button>
                            </form>

                            <form action={deleteNewsletter}>
                              <input type="hidden" name="id" value={row.id} />
                              <ConfirmSubmit confirmText={`Xoá ${row.email} khỏi danh sách?`}>
                                <Trash2 size={15} />
                              </ConfirmSubmit>
                            </form>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}
    </>
  );
}
