"use client";

import toast from "react-hot-toast";
import { getToastRuntime } from "@/lib/toast-runtime";

/**
 * Gửi form cài đặt qua server action và hiện toast theo tiến trình lưu:
 * đang lưu (loading) → thành công hoặc lỗi. Lỗi mạng cũng thành toast lỗi.
 * Thời gian hiện và bật/tắt theo cấu hình admin (lib/toast.ts).
 */
export function submitWithToast<T extends { ok: boolean; message?: string }>(
  formData: FormData,
  action: (prev: T | null, formData: FormData) => Promise<T>,
  messages: { loading: string; error?: string } = { loading: "Đang lưu..." },
) {
  const cfg = getToastRuntime();
  const promise = action(null, formData).then((state) => {
    if (!state.ok) throw Object.assign(new Error(state.message || "Không lưu được."), { state });
    return state;
  });
  if (!cfg.enabled) {
    return promise.catch((err: Error & { state?: T }) => {
      if (err.state) return err.state;
      return { ok: false, message: err.message || messages.error || "Không thể kết nối máy chủ." } as T;
    });
  }
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: (state) => <b>{state.message || "Đã lưu."}</b>,
      error: (err) => <b>{(err as Error).message || messages.error || "Không lưu được."}</b>,
    },
    { success: { duration: cfg.successDurationMs }, error: { duration: cfg.errorDurationMs } },
  ).catch((err: Error & { state?: T }) => {
    if (err.state) return err.state;
    return {
      ok: false,
      message: err.message || messages.error || "Không thể kết nối máy chủ.",
    } as T;
  });
}
