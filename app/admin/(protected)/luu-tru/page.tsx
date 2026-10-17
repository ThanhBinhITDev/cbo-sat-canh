import { HardDrive, Files, Recycle, FolderOpen } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { ErrorState, Notice } from "@/components/admin/States";
import StorageBrowser from "@/components/admin/StorageBrowser";
import { getStorageFiles } from "@/lib/admin/storage";
import { getSessionUser } from "@/lib/auth";
import { formatBytes } from "@/lib/format";

export default async function StorageAdminPage() {
  const user = await getSessionUser();
  if (!user?.profile || user.profile.role !== "admin") {
    return (
      <Notice
        title="Không có quyền truy cập"
        description="Chỉ quản trị viên được xem và dọn kho lưu trữ."
      />
    );
  }

  const result = await getStorageFiles();

  if (!result.ok) {
    return (
      <>
        <PageHeader
          title="Lưu trữ"
          description="Toàn bộ tệp trong kho site-assets của website."
        />
        <ErrorState message={result.message} detail={result.detail} />
      </>
    );
  }

  const files = result.rows;
  const totalBytes = files.reduce((s, f) => s + f.size, 0);
  const orphanFiles = files.filter((f) => !f.used);
  const orphanBytes = orphanFiles.reduce((s, f) => s + f.size, 0);
  const folderCount = new Set(files.map((f) => f.folder)).size;

  const stats = [
    {
      icon: <HardDrive size={18} />,
      label: "Tổng dung lượng",
      value: formatBytes(totalBytes),
    },
    {
      icon: <Files size={18} />,
      label: "Số tệp",
      value: String(files.length),
    },
    {
      icon: <FolderOpen size={18} />,
      label: "Thư mục",
      value: String(folderCount),
    },
    {
      icon: <Recycle size={18} />,
      label: "Tệp mồ côi",
      value: orphanFiles.length
        ? `${orphanFiles.length} · ${formatBytes(orphanBytes)}`
        : "0",
    },
  ];

  return (
    <>
      <PageHeader
        title="Lưu trữ"
        description="Toàn bộ tệp thật trong kho site-assets. Tệp mồ côi là ảnh không còn nơi nào dùng — có thể dọn để giải phóng dung lượng."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary-dark">
              {s.icon}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-ink/70">
                {s.label}
              </p>
              <p className="truncate text-lg font-extrabold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <StorageBrowser files={files} />
    </>
  );
}
