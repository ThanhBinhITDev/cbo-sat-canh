import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import MedalForm from "@/components/admin/collab/MedalForm";
import { getSessionUser } from "@/lib/auth";

export default async function NewMedalPage() {
  const user = await getSessionUser();
  if (!user?.profile || user.profile.role !== "admin") {
    return null;
  }

  return (
    <>
      <PageHeader
        title="Thêm huy chương"
        description="Tạo danh mục huy chương mới"
        action={<Link href="/admin/huy-chuong" className="btn btn-ghost text-sm">Quay lại</Link>}
      />
      <div className="card max-w-3xl">
        <MedalForm />
      </div>
    </>
  );
}
