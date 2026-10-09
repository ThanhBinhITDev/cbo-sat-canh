import { notFound } from "next/navigation";
import AccountEditForm from "@/components/admin/AccountEditForm";
import { ErrorState } from "@/components/admin/States";
import { BackLink, PageHeader, Panel, PanelHead } from "@/components/admin/ui";
import { getProfileAdmin } from "@/lib/admin/data";
import { requireRole } from "@/lib/auth";
import { UserCog } from "lucide-react";

export default async function AccountEditPage({
  params,
}: PageProps<"/admin/tai-khoan/[id]">) {
  await requireRole(["admin"]);
  const { id } = await params;

  const result = await getProfileAdmin(id);

  return (
    <>
      <PageHeader
        title="Sửa tài khoản"
        description="Họ tên, tên đăng nhập, email, mật khẩu và ảnh đại diện."
        action={<BackLink href="/admin/tai-khoan">Về danh sách</BackLink>}
      />

      {!result.ok ? (
        <ErrorState message={result.message} detail={result.detail} />
      ) : !result.value ? (
        notFound()
      ) : (
        <div className="max-w-xl">
          <Panel>
            <PanelHead
              title={result.value.full_name || result.value.email}
              subtitle={result.value.email}
              action={<UserCog size={18} className="text-primary" />}
            />
            <div className="p-5">
              <AccountEditForm profile={result.value} />
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}
