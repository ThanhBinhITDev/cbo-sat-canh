import { PageHeader, Panel, PanelHead, BackLink } from "@/components/admin/ui";
import { Notice, ErrorState } from "@/components/admin/States";
import TaskForm from "@/components/admin/collab/TaskForm";
import {
  getMembers,
  getTaskCategories,
  getTaskDetail,
} from "@/lib/admin/collab";
import { getSessionUser } from "@/lib/auth";
import { canManageCollab } from "@/lib/collab";

export default async function EditTaskPage({
  params,
}: PageProps<"/admin/nhiem-vu/[id]/sua">) {
  const user = await getSessionUser();
  if (!user?.profile || !canManageCollab(user.profile)) {
    return (
      <Notice
        title="Không có quyền truy cập"
        description="Chỉ quản trị viên hoặc người được cấp quyền quản lý cộng tác mới sửa được nhiệm vụ."
      />
    );
  }

  const { id } = await params;
  const [detail, categories, membersRes] = await Promise.all([
    getTaskDetail(id),
    getTaskCategories(false),
    getMembers(),
  ]);

  if (!detail.ok) {
    return <ErrorState message={detail.message} detail={detail.detail} />;
  }

  const { task, assignees, attachments } = detail.data;
  const cats = categories.ok ? categories.rows : [];
  const members = membersRes.ok ? membersRes.rows : [];

  const initialAttachments = attachments
    .filter((a) => a.kind === "reference")
    .map((a) => ({ url: a.url, name: a.name ?? "" }));

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href={`/admin/nhiem-vu/${task.id}`}>Chi tiết nhiệm vụ</BackLink>

      <PageHeader
        className="mt-4 mb-6"
        title="Sửa nhiệm vụ"
        description={task.title}
      />

      <Panel>
        <PanelHead title="Cập nhật nhiệm vụ" />
        <TaskForm
          task={task}
          categories={cats}
          members={members}
          selectedAssigneeIds={assignees.map((a) => a.profile_id)}
          initialAttachments={initialAttachments}
        />
      </Panel>
    </div>
  );
}
