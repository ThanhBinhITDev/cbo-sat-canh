"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/admin/ui";
import { toast } from "@/lib/swal";
import Link from "next/link";

export default function UploadDocPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return toast.error("Vui lòng chọn tệp tin.");
    const supabase = createClient();
    setLoading(true);
    const safe = file.name.replace(/[^\w\.\-]+/g, "_");
    const path = `${Date.now()}_${safe}`;
    const { error } = await supabase.storage.from("internal-docs").upload(path, file);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Đã tải lên tài liệu.");
    router.push("/admin/tai-lieu");
    router.refresh();
  }

  return (
    <>
      <PageHeader
        title="Tải lên tài liệu"
        description="Tài liệu được lưu trong thư mục riêng tư (chỉ thành viên được cấp quyền xem)."
        action={<Link href="/admin/tai-lieu" className="btn btn-ghost text-sm">Quay lại</Link>}
      />
      <form onSubmit={onSubmit} className="card max-w-xl space-y-4 p-5">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="input"
        />
        <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5 text-sm">
          {loading ? "Đang tải lên..." : "Tải lên"}
        </button>
      </form>
    </>
  );
}
