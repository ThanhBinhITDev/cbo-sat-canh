"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import type { ActionState } from "@/lib/admin/actions";

export function useToastLoading(
  pending: boolean,
  opts: {
    loading?: string;
    id?: string;
  } = {},
) {
  const toastId = useRef<string | null>(null);
  const id = opts.id || "global-action-loading";

  useEffect(() => {
    if (pending && !toastId.current) {
      toastId.current = toast.loading(opts.loading || "Đang xử lý...", { id });
    }
    return () => {
      // Giữ toast đến khi có kết quả (redirect/unmount) để tránh giật
    };
  }, [pending, opts.loading, id]);

  return null;
}

export function useToastResult(
  state: ActionState | null | undefined,
  opts: { success?: string; error?: string; id?: string } = {},
) {
  const id = opts.id || "global-action-loading";
  const prev = useRef<ActionState | null>(null);

  useEffect(() => {
    if (!state || state === prev.current) return;
    prev.current = state;
    toast.dismiss(id);
    if (state.ok) {
      const msg = state.message || opts.success || "Thành công";
      toast.success(msg, { duration: 4000 });
    } else {
      const msg = state.message || opts.error || "Có lỗi xảy ra";
      toast.error(msg, { duration: 5000 });
    }
  }, [state, opts.success, opts.error, id]);

  return null;
}
