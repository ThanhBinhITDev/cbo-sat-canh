import { Lock, TriangleAlert } from "lucide-react";
import { formatBytes } from "@/lib/format";
import {
  FREE_DB_QUOTA,
  FREE_STORAGE_QUOTA,
  QUOTA_WARN_PCT,
  quotaLockMessage,
  quotaState,
  type QuotaUsage,
} from "@/lib/admin/quota";

/**
 * Banner hạn mức hiện ở đầu mọi trang quản trị:
 * - vàng (≥80% một trong hai hạn mức) → nhắc dọn bớt,
 * - đỏ (đã chạm 500 MB / 1 GB) → báo đang khóa ghi.
 * Server component, không dismiss — còn đầy là còn hiện.
 */
export default function QuotaBanner({ usage }: { usage: QuotaUsage }) {
  const state = quotaState(usage);
  if (!state.warning && !state.locked) return null;

  if (state.locked) {
    return (
      <p className="alert-error" role="alert">
        <Lock size={16} className="mt-0.5 shrink-0" />
        <span>
          {quotaLockMessage(state)} Database hiện{" "}
          {formatBytes(usage.databaseBytes)}/{formatBytes(FREE_DB_QUOTA)}, Storage{" "}
          {formatBytes(usage.storageBytes)}/{formatBytes(FREE_STORAGE_QUOTA)}.
        </span>
      </p>
    );
  }

  const flagged: string[] = [];
  if (state.dbPct >= QUOTA_WARN_PCT) {
    flagged.push(
      `Database ${formatBytes(usage.databaseBytes)}/${formatBytes(FREE_DB_QUOTA)} (${state.dbPct.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%)`,
    );
  }
  if (state.storagePct >= QUOTA_WARN_PCT) {
    flagged.push(
      `Storage ${formatBytes(usage.storageBytes)}/${formatBytes(FREE_STORAGE_QUOTA)} (${state.storagePct.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%)`,
    );
  }

  return (
    <p className="alert-warn" role="alert">
      <TriangleAlert size={16} className="mt-0.5 shrink-0" />
      <span>
        <b>Sắp đạt giới hạn dung lượng:</b> {flagged.join(" · ")}. Việc ghi sẽ
        tự khóa khi chạm {formatBytes(FREE_DB_QUOTA)} (Database) hoặc{" "}
        {formatBytes(FREE_STORAGE_QUOTA)} (Storage) — hãy dọn bớt bài/ảnh không
        dùng ngay.
      </span>
    </p>
  );
}
