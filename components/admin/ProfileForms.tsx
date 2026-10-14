"use client";

import type { FormEvent, ReactNode } from "react";
import { confirmDialog } from "@/lib/swal";
import type { ActionState } from "@/lib/admin/actions";
import { submitWithToast } from "@/lib/admin/submit-with-toast";

type Action = (prev: ActionState | null, formData: FormData) => Promise<ActionState>;

/** Form gửi qua submitWithToast: không dùng action= để toast có Promise kết quả. */
export function ToastForm({
  action,
  loading,
  className,
  confirmText,
  children,
}: {
  action: Action;
  loading: string;
  className?: string;
  confirmText?: string;
  children: ReactNode;
}) {
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (confirmText) {
      void confirmDialog({ title: "Xác nhận thao tác", text: confirmText, confirmButtonText: "Đồng ý xoá", cancelButtonText: "Huỷ bỏ", isDanger: true }).then((confirmed) => {
        if (confirmed) submit(form);
      });
      return;
    }
    submit(form);
  };
  const submit = (form: HTMLFormElement) => {
    const formData = new FormData(form);
    const submitter = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submitter?.name) formData.set(submitter.name, submitter.value);
    void submitWithToast(formData, action, { loading });
  };
  return (
    <form onSubmit={onSubmit} className={className}>
      {children}
    </form>
  );
}
