import { PageHeader, Panel, PanelHead, BackLink } from "@/components/admin/ui";
import { Notice } from "@/components/admin/States";
import TaskForm from "@/components/admin/collab/TaskForm";
import { getMembers, getTaskCategories } from "@/lib/admin/collab";
import { getSessionUser } from "@/lib/auth";
import { canManageCollab } from "@/lib/collab";

export default async function CreateTaskPage() {
  const user = await getSessionUser();
  if (!user?.profile || !canManageCollab(user.profile)) {
    return (
      <Notice
        title="Không có quyền truy cập"
        description="Chỉ quản trị viên hoặc người được cấp quyền quản lý cộng tác mới giao được nhiệm vụ."
      />
    );
  }

  const [categories, membersRes] = await Promise.all([
    getTaskCategories(false),
    getMembers(),
  ]);
  const cats = categories.ok ? categories.rows : [];
  const members = membersRes.ok ? membersRes.rows : [];

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href="/admin/nhiem-vu">Danh sách nhiệm vụ</BackLink>

      <PageHeader
        className="mt-4 mb-6"
        title="Giao nhiệm vụ mới"
        description="Chọn người thực hiện, mốc thời gian và đính kèm ảnh tham chiếu."
      />

      <Panel>
        <PanelHead title="Thông tin nhiệm vụ" />
        <TaskForm categories={cats} members={members} />
      </Panel>
    </div>
  );
}
