/**
 * Hạn mức & trạng thái dung lượng — thuần tính toán, dùng chung cả
 * server (actions, layout) lẫn client (MediaUploader).
 */

/** Hạn mức gói Free — chỉnh lại nếu nâng gói Pro (8 GB disk / 100 GB storage). */
export const FREE_DB_QUOTA = 500 * 1024 ** 2;
export const FREE_STORAGE_QUOTA = 1024 ** 3;

/** Ngưỡng cảnh báo: từ % hạn mức này sẽ hiện banner vàng. */
export const QUOTA_WARN_PCT = 80;

export type QuotaUsage = {
  databaseBytes: number;
  storageBytes: number;
};

export type QuotaState = {
  /** Phần trăm đã dùng (capped 100). */
  dbPct: number;
  storagePct: number;
  /** true khi một trong hai hạn mức ≥ QUOTA_WARN_PCT. */
  warning: boolean;
  /** true khi đã chạm hạn (Database ≥500 MB hoặc Storage ≥1 GB). */
  locked: boolean;
  /** Hạn mức đã chạm, null nếu chưa. */
  lockReason: "Database" | "Storage" | null;
};

export function quotaState(usage: QuotaUsage): QuotaState {
  const dbPct = (usage.databaseBytes / FREE_DB_QUOTA) * 100;
  const storagePct = (usage.storageBytes / FREE_STORAGE_QUOTA) * 100;
  const dbLocked = usage.databaseBytes >= FREE_DB_QUOTA;
  const storageLocked = usage.storageBytes >= FREE_STORAGE_QUOTA;

  return {
    dbPct: Math.min(100, dbPct),
    storagePct: Math.min(100, storagePct),
    warning: dbPct >= QUOTA_WARN_PCT || storagePct >= QUOTA_WARN_PCT,
    locked: dbLocked || storageLocked,
    lockReason: dbLocked ? "Database" : storageLocked ? "Storage" : null,
  };
}

/** Thông báo hiển thị khi khóa ghi (flash lỗi trên trang gọi action). */
export function quotaLockMessage(state: QuotaState): string {
  const limit = state.lockReason === "Storage" ? "1 GB" : "500 MB";
  return `Đã đạt giới hạn ${state.lockReason} (${limit}). Hệ thống tạm khóa mọi thao tác ghi — hãy giải phóng dung lượng rồi thử lại.`;
}
