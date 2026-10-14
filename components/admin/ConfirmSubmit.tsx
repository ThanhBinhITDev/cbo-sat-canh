"use client";

import { type ReactNode } from "react";
import toast from "react-hot-toast";

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
      onClick={(e) => {
        const form = (e.currentTarget as HTMLButtonElement).form;
        if (!form) return;
        toast(
          (t) => (
            <div className="flex flex-col gap-2 p-1">
              <p className="text-sm text-ink">{confirmText}</p>
              <div className="flex gap-2">
                <button
                  className="btn btn-primary py-1 text-xs"
                  onClick={() => {
                    toast.dismiss(t.id);
                    form.requestSubmit();
                  }}
                >
                  Xoá
                </button>
                <button
                  className="btn bg-muted py-1 text-xs text-ink/80"
                  onClick={() => toast.dismiss(t.id)}
                >
                  Huỷ
                </button>
              </div>
            </div>
          ),
          { duration: Infinity }
        );
      }}
      className={`inline-flex h-8 items-center gap-1.5 rounded-xl border border-line px-3 text-xs font-bold transition disabled:opacity-50 ${
        danger ? "t-danger" : "text-ink/80 hover:bg-primary/5 hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}
