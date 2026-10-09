import { redirect } from "next/navigation";
import { KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Field, Flash, PageHeader, Panel, PanelHead } from "@/components/admin/ui";
import AvatarPicker from "@/components/admin/AvatarPicker";
import { getSessionUser } from "@/lib/auth";
import {
  changeMyEmail,
  changeMyPassword,
  updateMyProfile,
} from "@/lib/admin/actions";
import { ROLE_LABELS } from "@/lib/types";

export default async function ProfilePage({
  searchParams,
}: PageProps<"/admin/ho-so">) {
  const sp = await searchParams;
  const user = await getSessionUser();
  if (!user?.profile) redirect("/admin/login");
  const p = user.profile;

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Sửa hồ sơ"
        description="Ảnh đại diện, tên đăng nhập, họ tên, email và mật khẩu của bạn."
      />

      <Flash
        flash={typeof sp.flash === "string" ? sp.flash : undefined}
        error={typeof sp.err === "string" ? sp.err : undefined}
      />

      <div className="grid gap-5 lg:grid-cols-[1.15fr,1fr]">
        <Panel>
          <PanelHead
            title="Hồ sơ"
            subtitle="Hiển thị trong trang quản trị"
            action={<UserRound size={18} className="text-primary" />}
          />
          <div className="space-y-5 p-5">
            <AvatarPicker
              profileId={user.id}
              value={p.avatar_url}
              fullName={p.full_name || user.email}
            />

            <form action={updateMyProfile} className="space-y-4">
              <input
                type="hidden"
                name="original_username"
                value={p.username ?? ""}
              />
              <Field label="Họ và tên" required>
                <input
                  name="full_name"
                  required
                  maxLength={150}
                  defaultValue={p.full_name}
                  className="input"
                  placeholder="Nguyễn Văn A"
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
                  defaultValue={p.username ?? ""}
                  className="input"
                  placeholder="nguyenvana"
                />
              </Field>

              <button type="submit" className="btn btn-primary !py-2.5 text-sm">
                Lưu hồ sơ
              </button>
            </form>
          </div>
        </Panel>

        <div className="grid content-start gap-5">
          <Panel>
            <PanelHead
              title="Email đăng nhập"
              subtitle={user.email}
              action={<Mail size={18} className="text-primary" />}
            />
            <div className="p-5">
              <form action={changeMyEmail} className="space-y-4">
                <Field
                  label="Email mới"
                  hint="Hệ thống gửi link xác nhận tới email mới — vẫn đăng nhập bằng email cũ cho đến khi bạn bấm link."
                >
                  <input
                    name="email"
                    type="email"
                    required
                    defaultValue={user.email}
                    className="input"
                  />
                </Field>
                <button
                  type="submit"
                  className="btn btn-ghost !py-2.5 text-sm font-semibold"
                >
                  Cập nhật email
                </button>
              </form>
            </div>
          </Panel>

          <Panel>
            <PanelHead
              title="Mật khẩu"
              subtitle="Đổi mật khẩu đăng nhập"
              action={<KeyRound size={18} className="text-primary" />}
            />
            <form action={changeMyPassword} className="space-y-4 p-5">
              <Field label="Mật khẩu mới" required hint="Tối thiểu 8 ký tự.">
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
              <Field label="Nhập lại mật khẩu mới" required>
                <input
                  name="confirm"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="input"
                  placeholder="••••••••"
                />
              </Field>
              <button
                type="submit"
                className="btn btn-ghost !py-2.5 text-sm font-semibold"
              >
                Đổi mật khẩu
              </button>
            </form>
          </Panel>

          <div className="card flex items-center gap-3 p-4">
            <ShieldCheck size={18} className="shrink-0 text-primary" />
            <p className="text-sm text-ink/70">
              Vai trò hiện tại:{" "}
              <b className="text-primary-dark">{ROLE_LABELS[p.role]}</b>
              {p.role !== "admin" && " — liên hệ quản trị viên nếu cần đổi."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
