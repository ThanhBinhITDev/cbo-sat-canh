import PostEditor from "@/components/admin/PostEditor";
import { requireRole } from "@/lib/auth";

export default async function NewPostPage() {
  await requireRole(["admin", "editor"]);
  return <PostEditor />;
}
