import { notFound } from "next/navigation";
import PostEditor from "@/components/admin/PostEditor";
import { requireRole } from "@/lib/auth";
import { getPostAdmin } from "@/lib/admin/data";
import { Flash } from "@/components/admin/ui";

export default async function EditPostPage({
  params,
  searchParams,
}: PageProps<"/admin/bai-viet/[id]">) {
  await requireRole(["admin", "editor"]);
  const { id } = await params;
  const sp = await searchParams;
  const post = await getPostAdmin(id);
  if (!post) notFound();

  return (
    <div className="grid gap-4">
      <Flash
        flash={typeof sp.flash === "string" ? sp.flash : undefined}
        error={typeof sp.err === "string" ? sp.err : undefined}
      />
      <PostEditor post={post} />
    </div>
  );
}
