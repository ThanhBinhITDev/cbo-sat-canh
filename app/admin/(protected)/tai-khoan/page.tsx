import { UserPlus, ShieldCheck, Ban, Check } from "lucide-react";
import { Flash, PageHeader, Panel, PanelHead, EmptyState } from "@/components/admin/ui";
import { ErrorState } from "@/components/admin/States";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import AccountCreateForm from "@/components/admin/AccountCreateForm";
import { getProfilesAdmin } from "@/lib/admin/data";
import { toggleAccountActive, updateAccountRole } from "@/lib/admin/actions";
import { getSessionUser } from "@/lib/auth";
import { ROLE_LABELS, type Role } from "@/lib/types";
import { formatDate } from "@/lib/format";

const ROLE_BADGES: Record<Role, string> = {
  admin: "badge-blue",
  editor: "badge-green",
  collaborator: "badge-yellow",
};

export default async function AccountsPage({
  searchParams,
}: PageProps<"/admin/tai-khoan">) {
  const sp = await searchParams;
  const current = await getSessionUser();
  const result = await getProfilesAdmin();

  return (
    <>
      <PageHeader
        title="Tài khoản"
        description="Quản lý người dùng và vai trò. Mọi thay đổi đều được ghi nhận theo RLS."
        action={
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-xs font-bold text-ink/60">
            <ShieldCheck size={15} /> 3 vai trò
          </span>
        }
      />

      <Flash
        flash={typeof sp.flash === "string" ? sp.flash : undefined}
        error={typeof sp.err === "string" ? sp.err : undefined}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
          <div key={role} className="card p-4">
            <span className={`badge ${ROLE_BADGES[role]}`}>{ROLE_LABELS[role]}</span>
            <p className="mt-2 text-xs leading-relaxed text-ink/65">
              {role === "admin" &&
                "Toàn quyền: nội dung, giao diện, ảnh, tài khoản, xoá dữ liệu."}
              {role === "editor" &&
                "Quản lý bài viết, ảnh bài viết, trả lời câu hỏi liên hệ."}
              {role === "collaborator" &&
                "Chỉ xem câu hỏi liên hệ và danh sách đăng ký nhận tin."}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr,1fr]">
        {!result.ok ? (
          <ErrorState message={result.message} detail={result.detail} />
        ) : (
          <Panel>
            <PanelHead title="Người dùng" subtitle={`${result.rows.length} tài khoản`} />
            {result.rows.length === 0 ? (
              <EmptyState
                title="Chưa có tài khoản nào"
                description="Tạo tài khoản đầu tiên ở biểu mẫu bên phải."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="table-admin">
                  <thead>
                    <tr>
                      <th>Họ tên</th>
                      <th>Email</th>
                      <th>Vai trò</th>
                      <th>Trạng thái</th>
                      <th>Tạo lúc</th>
                      <th className="text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row) => {
                      const isSelf = row.id === current?.id;
                      return (
                        <tr key={row.id}>
                          <td>
                            <div className="flex items-center gap-2.5">
                              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-black text-primary">
                                {row.full_name.slice(0, 1).toUpperCase()}
                              </span>
                              <span className="font-semibold">
                                {row.full_name}
                                {isSelf && (
                                  <span className="ml-1.5 text-xs font-bold text-ink/45">(bạn)</span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="text-ink/70">{row.email}</td>
                          <td>
                            {isSelf ? (
                              <span className={`badge ${ROLE_BADGES[row.role]}`}>
                                {ROLE_LABELS[row.role]}
                              </span>
                            ) : (
                              <form action={updateAccountRole} className="flex items-center gap-2">
                                <input type="hidden" name="id" value={row.id} />
                                <select
                                  name="role"
                                  defaultValue={row.role}
                                  className="select !w-auto !py-1.5 !text-xs"
                                >
                                  {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                                    <option key={r} value={r}>
                                      {ROLE_LABELS[r]}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="submit"
                                  className="rounded-lg border border-line px-2 py-1.5 text-[11px] font-bold text-ink/60 hover:border-primary hover:text-primary"
                                >
                                  Lưu
                                </button>
                              </form>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${row.is_active ? "badge-green" : "badge-red"}`}>
                              {row.is_active ? "Hoạt động" : "Đã khóa"}
                            </span>
                          </td>
                          <td className="whitespace-nowrap text-ink/60">
                            {formatDate(row.created_at)}
                          </td>
                          <td>
                            <div className="flex justify-end">
                              {isSelf ? (
                                <span className="text-xs text-ink/45">—</span>
                              ) : (
                                <form action={toggleAccountActive}>
                                  <input type="hidden" name="id" value={row.id} />
                                  <input type="hidden" name="is_active" value={String(row.is_active)} />
                                  <ConfirmSubmit
                                    danger={row.is_active}
                                    confirmText={
                                      row.is_active
                                        ? `Khóa tài khoản ${row.email}? Người này sẽ bị đăng xuất ở lần đăng nhập sau.`
                                        : `Mở khóa tài khoản ${row.email}?`
                                    }
                                  >
                                    {row.is_active ? (
                                      <>
                                        <Ban size={15} /> Khóa
                                      </>
                                    ) : (
                                      <>
                                        <Check size={15} /> Mở khóa
                                      </>
                                    )}
                                  </ConfirmSubmit>
                                </form>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        )}

        <div className="xl:sticky xl:top-24 xl:h-fit">
          <Panel>
            <PanelHead
              title="Thêm thành viên"
              subtitle="Tạo tài khoản Supabase Auth + hồ sơ vai trò"
              action={<UserPlus size={18} className="text-primary" />}
            />
            <div className="p-5">
              <AccountCreateForm />
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
