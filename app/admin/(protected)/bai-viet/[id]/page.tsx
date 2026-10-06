import { notFound } from "next/navigation";
import PostEditor from "@/components/admin/PostEditor";
import { requireRole } from "@/lib/auth";
import { getPostAdmin } from "@/lib/admin/data";

export default async function EditPostPage({ params }: PageProps<"/admin/bai-viet/[id]">) {
  await requireRole(["admin", "editor"]);
  const { id } = await params;
  const post = await getPostAdmin(id);
  if (!post) notFound();

  return <PostEditor post={post} />;
}
