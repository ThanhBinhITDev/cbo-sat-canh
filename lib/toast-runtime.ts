import { DEFAULT_TOAST, type ToastConfig } from "@/lib/toast";

/**
 * Cấu hình toast hiện hành ở phía trình duyệt. Được đồng bộ từ layout
 * (ToastConfigSync) để các hàm gọi toast ngoài React tree vẫn đọc đúng.
 */
let current: ToastConfig = DEFAULT_TOAST;

export function setToastRuntime(config: ToastConfig) {
  current = config;
}

export function getToastRuntime(): ToastConfig {
  return current;
}
