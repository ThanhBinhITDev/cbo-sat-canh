"use client";

import { type ReactNode } from "react";

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
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 ${
        danger
          ? "border border-red-200 bg-white text-red-600 hover:bg-red-50"
          : "border border-line bg-white text-ink/70 hover:border-primary hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}
