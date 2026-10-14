"use client";

import { type ReactNode } from "react";
import { confirmDialog } from "@/lib/swal";

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
      type="button"
      name={name}
      value={value}
      disabled={disabled}
      onClick={async (e) => {
        const btn = e.currentTarget as HTMLButtonElement;
        const form = btn.closest("form") ?? btn.form;
        if (!form) return;

        const isConfirmed = await confirmDialog({
          title: "Xác nhận thao tác",
          text: confirmText,
          confirmButtonText: danger ? "Đồng ý xoá" : "Xác nhận",
          cancelButtonText: "Huỷ bỏ",
          isDanger: danger,
        });

        if (isConfirmed) {
          if (name && value !== undefined) {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = name;
            input.value = value;
            form.appendChild(input);
          }

          // Dùng nút submit tạm thời để dispatch sự kiện submit chuẩn cho React Server Action
          const submitter = document.createElement("button");
          submitter.type = "submit";
          submitter.style.display = "none";
          form.appendChild(submitter);
          submitter.click();
          submitter.remove();
        }
      }}
      className={`inline-flex h-8 items-center gap-1.5 rounded-xl border border-line px-3 text-xs font-bold transition disabled:opacity-50 ${
        danger ? "t-danger" : "text-ink/80 hover:bg-primary/5 hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}
