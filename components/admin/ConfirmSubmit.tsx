"use client";

import { type ReactNode } from "react";
import toast from "react-hot-toast";

/** Nút submit hỏi xác nhận trước khi gửi (xoá / thao tác nguy hiểm). */
export default function ConfirmSubmit({
  children,
  confirmText = "Bạn chắc chắn muốn thực hiện thao tác này?",
  danger = true,
  disabled = false,
  name,
  value,
}: {
  children: ReactNode;
  confirmText?: string;
  danger?: boolean;
  disabled?: boolean;
  name?: string;
  value?: string;
}) {
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={disabled}
      onClick={async (e) => {
        e.preventDefault();
        const form = e.currentTarget.form;
        if (!form) return;
        const ok = await toast.promise(
          new Promise((res) => {
            if (window.confirm(confirmText)) res(true);
            else res(false);
          }),
          {
            loading: "Đang xác nhận...",
            success: "Đã xác nhận",
            error: "Đã huỷ",
          },
          { success: { duration: 1000 }, error: { duration: 1000 } }
        );
        if (ok) form.requestSubmit();
      }}
      className={`inline-flex h-8 items-center gap-1.5 rounded-xl border border-line px-3 text-xs font-bold transition disabled:opacity-50 ${
        danger ? "t-danger" : "text-ink/80 hover:bg-primary/5 hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}
