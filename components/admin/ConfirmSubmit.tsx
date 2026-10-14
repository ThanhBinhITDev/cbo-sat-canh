"use client";

import { type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
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
        const btn = e.currentTarget as HTMLButtonElement;
        const form = btn.form;
        if (!form) return;

        toast(
          (t) => (
            <div className="flex w-[min(94vw,440px)] flex-col gap-5 rounded-2xl border border-line bg-surface p-6 shadow-2xl">
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600">
                  <AlertTriangle size={22} />
                </span>
                <p className="text-base font-semibold leading-relaxed text-ink">
                  {confirmText}
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-ink/70 transition hover:bg-muted/60"
                  onClick={() => toast.dismiss(t.id)}
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 active:scale-95"
                  onClick={() => {
                    toast.dismiss(t.id);
                    if (name && value !== undefined) {
                      const input = document.createElement("input");
                      input.type = "hidden";
                      input.name = name;
                      input.value = value;
                      form.appendChild(input);
                      form.requestSubmit();
                      form.removeChild(input);
                    } else {
                      form.requestSubmit();
                    }
                  }}
                >
                  Xác nhận xoá
                </button>
              </div>
            </div>
          ),
          { duration: Infinity, position: "top-center" }
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
