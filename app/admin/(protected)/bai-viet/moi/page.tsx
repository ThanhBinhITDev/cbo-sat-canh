import PostEditor from "@/components/admin/PostEditor";
import { requireRole } from "@/lib/auth";
import { Flash } from "@/components/admin/ui";

export default async function NewPostPage({
  searchParams,
}: PageProps<"/admin/bai-viet/moi">) {
  await requireRole(["admin", "editor"]);
  const sp = await searchParams;
  return (
    <div className="grid gap-4">
      <Flash
        flash={typeof sp.flash === "string" ? sp.flash : undefined}
        error={typeof sp.err === "string" ? sp.err : undefined}
      />
      <PostEditor />
    </div>
  );
}
