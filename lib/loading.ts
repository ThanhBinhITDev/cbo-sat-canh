"use client";

import { useEffect } from "react";

type Listener = () => void;

const holders = new Set<symbol>();
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

export function subscribeLoading(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Có đang tải không (nguồn: điều hướng, lưu form, hook thủ công). */
export function isLoading() {
  return holders.size > 0;
}

/** Giữ trạng thái đang tải; tự nhả sau tối đa 20s để tránh kẹt vô hạn. */
export function hold(): symbol {
  const token = Symbol("loading");
  holders.add(token);
  emit();
  window.setTimeout(() => release(token), 20_000);
  return token;
}

export function release(token: symbol | null | undefined) {
  if (!token) return;
  if (holders.delete(token)) emit();
}

/** Nhả toàn bộ (dùng khi điều hướng đã xong). */
export function releaseAll() {
  if (holders.size === 0) return;
  holders.clear();
  emit();
}

/**
 * Giữ loader khi một tác vụ đang pending (dùng cho form useActionState
 * không điều hướng, ví dụ lưu bài viết / tạo tài khoản).
 */
export function useGlobalLoading(pending: boolean) {
  useEffect(() => {
    if (!pending) return;
    const token = hold();
    return () => release(token);
  }, [pending]);
}
