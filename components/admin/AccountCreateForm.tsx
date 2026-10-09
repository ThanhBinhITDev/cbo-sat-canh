"use client";

import { useActionState } from "react";
import { Loader2, UserPlus, ShieldCheck } from "lucide-react";
import { createAccount, type ActionState } from "@/lib/admin/actions";
import { ROLE_LABELS, type Role } from "@/lib/types";
import { Field } from "./ui";

export default function AccountCreateForm() {
  const [state, formAction, pending] = useActionState<ActionState | null, FormData>(
    createAccount,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Họ và tên" required>
        <input name="full_name" required maxLength={150} className="input" placeholder="Nguyễn Văn A" />
      </Field>

      <Field
        label="Tên đăng nhập"
        hint="Tùy chọn — dùng để đăng nhập thay cho email. 3–30 ký tự: chữ thường, số và . _ -"
      >
        <input
          name="username"
          maxLength={30}
          autoComplete="off"
          className="input"
          placeholder="nguyenvana"
        />
      </Field>

      <Field label="Email" required>
        <input name="email" type="email" required className="input" placeholder="ten@email.com" />
      </Field>

      <Field label="Mật khẩu tạm" required hint="Tối thiểu 8 ký tự. Người dùng nên tự đổi sau lần đăng nhập đầu.">
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input"
          placeholder="••••••••"
        />
      </Field>

      <Field label="Vai trò">
        <select name="role" defaultValue="editor" className="select">
          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </Field>

      {state?.message && (
        <p className={state.ok ? "alert-ok" : "alert-error"} role="alert">
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary w-full py-2.5 text-sm disabled:opacity-60">
        {pending ? <Loader2 size={17} className="animate-spin" /> : <UserPlus size={17} />}
        {pending ? "Đang tạo..." : "Tạo tài khoản"}
      </button>

      <p className="flex items-start gap-2 text-xs text-ink/55">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-primary" />
        Chỉ quản trị viên tạo được tài khoản. Người dùng không có hồ sơ sẽ thấy
        trang &ldquo;tài khoản chưa được cấp quyền&rdquo;.
      </p>
    </form>
  );
}
