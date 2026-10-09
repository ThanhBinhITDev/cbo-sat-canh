"use client";

import { useActionState } from "react";
import { Loader2, Save, UserCog } from "lucide-react";
import { updateAccountProfile, type ActionState } from "@/lib/admin/actions";
import { ROLE_LABELS, type Profile } from "@/lib/types";
import { Field } from "./ui";
import AvatarPicker from "./AvatarPicker";

export default function AccountEditForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState<ActionState | null, FormData>(
    updateAccountProfile,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={profile.id} />
      <input
        type="hidden"
        name="original_username"
        value={profile.username ?? ""}
      />
      <input type="hidden" name="original_email" value={profile.email} />

      <div className="card bg-muted/50 p-4">
        <AvatarPicker
          profileId={profile.id}
          value={profile.avatar_url}
          fullName={profile.full_name || profile.email}
        />
      </div>

      <Field label="Họ và tên" required>
        <input
          name="full_name"
          required
          maxLength={150}
          defaultValue={profile.full_name}
          className="input"
        />
      </Field>

      <Field
        label="Tên đăng nhập"
        hint="Tùy chọn — dùng để đăng nhập thay cho email. 3–30 ký tự: chữ thường, số và . _ -"
      >
        <input
          name="username"
          maxLength={30}
          autoComplete="off"
          defaultValue={profile.username ?? ""}
          className="input"
          placeholder="nguyenvana"
        />
      </Field>

      <Field label="Email" required hint="Đổi email sẽ ghi đè ngay (admin xác nhận thay cho người dùng).">
        <input
          name="email"
          type="email"
          required
          defaultValue={profile.email}
          className="input"
        />
      </Field>

      <Field
        label="Mật khẩu mới"
        hint="Để trống nếu không đổi. Tối thiểu 8 ký tự."
      >
        <input
          name="password"
          type="password"
          minLength={8}
          autoComplete="new-password"
          className="input"
          placeholder="Để trống nếu không đổi"
        />
      </Field>

      <p className="text-xs text-ink/55">
        Vai trò: <b>{ROLE_LABELS[profile.role]}</b> — đổi ở trang danh sách Tài khoản.
      </p>

      {state?.message && (
        <p className={state.ok ? "alert-ok" : "alert-error"} role="alert">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary w-full py-2.5 text-sm disabled:opacity-60"
      >
        {pending ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
        {pending ? "Đang lưu..." : "Lưu thay đổi"}
      </button>

      <p className="flex items-start gap-2 text-xs text-ink/55">
        <UserCog size={15} className="mt-0.5 shrink-0 text-primary" />
        Họ tên, username, email, mật khẩu, ảnh đại diện — sửa trực tiếp hồ sơ
        người này.
      </p>
    </form>
  );
}
