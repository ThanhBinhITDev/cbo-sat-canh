"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

/** Bắt lỗi bất ngờ trong khu quản trị để hiện thông báo thay vì trang trắng. */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] lỗi không xử lý:", error);
  }, [error]);

  return (
    <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
      <AlertTriangle size={40} className="mx-auto mb-4 text-red-600" />
      <h2 className="text-lg font-bold">Có lỗi xảy ra trong trang quản trị</h2>
      <p className="mt-2 text-sm text-ink/70">
        Thao tác chưa hoàn tất. Dữ liệu cũ vẫn giữ nguyên. Hãy thử lại; nếu lỗi vẫn còn, kiểm tra kết nối
        mạng hoặc dung lượng ảnh.
      </p>
      {error.message && (
        <p className="mt-3 break-words rounded-lg bg-muted px-3 py-2 text-left font-mono text-xs text-ink/70">
          {error.message.slice(0, 300)}
        </p>
      )}
      <button type="button" onClick={reset} className="btn btn-primary mt-6 !py-2.5 !text-sm">
        <RotateCcw size={15} /> Thử lại
      </button>
    </div>
  );
}
