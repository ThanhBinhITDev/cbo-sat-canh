import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import MedalForm from "@/components/admin/collab/MedalForm";
import { getMedals } from "@/lib/admin/collab";
import { getSessionUser } from "@/lib/auth";

export default async function EditMedalPage({
  params,
}: PageProps<"/admin/huy-chuong/[id]/sua">) {
  const user = await getSessionUser();
  if (!user?.profile || user.profile.role !== "admin") {
    return null;
  }

  const { id } = await params;
  const list = await getMedals(false);
  const medal = list.ok ? list.rows.find((m) => m.id === id) : null;
  if (!medal) notFound();

  return (
    <>
      <PageHeader
        title="Sửa huy chương"
        description={`Cập nhật thông tin huy chương: ${medal.name}`}
        action={<Link href="/admin/huy-chuong" className="btn btn-ghost text-sm">Quay lại</Link>}
      />
      <div className="card max-w-3xl">
        <MedalForm medal={medal} />
      </div>
    </>
  );
}
