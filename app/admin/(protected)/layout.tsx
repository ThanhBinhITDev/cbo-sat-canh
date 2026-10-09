import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getQuotaStatus } from "@/lib/admin/data";
import AdminShell from "@/components/admin/AdminShell";
import QuotaBanner from "@/components/admin/QuotaBanner";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();
  const quota = await getQuotaStatus();

  if (!user) redirect("/admin/login");
  if (!user.profile) {
    // Đã đăng nhập nhưng chưa có hồ sơ (chưa được cấp quyền)
    return (
      <main className="grid min-h-screen place-items-center bg-muted px-6 text-center">
        <div className="card max-w-md p-8">
          <h1 className="text-xl font-bold text-primary-dark">
            Tài khoản chưa được cấp quyền
          </h1>
          <p className="mt-3 text-sm text-ink/70">
            Tài khoản <b>{user.email}</b> đã đăng nhập nhưng chưa có vai trò
            trong hệ thống. Vui lòng liên hệ quản trị viên để được cấp quyền.
          </p>
          <Link href="/" className="btn btn-ghost mt-6">
            Về trang chủ
          </Link>
        </div>
      </main>
    );
  }

  return (
    <AdminShell
      fullName={user.profile.full_name}
      email={user.email}
      role={user.profile.role}
      avatarUrl={user.profile.avatar_url}
    >
      {quota?.ok && <QuotaBanner usage={quota.value} />}
      {children}
    </AdminShell>
  );
}
