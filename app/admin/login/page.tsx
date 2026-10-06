"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, ShieldAlert, ArrowLeft } from "lucide-react";
import { signIn } from "../actions";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(signIn, null);

  return (
    <main className="grid min-h-screen place-items-center bg-muted px-5 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 transition hover:text-primary"
        >
          <ArrowLeft size={16} /> Về trang chủ
        </Link>

        <div className="card overflow-hidden p-0">
          <div
            className="flex items-center gap-3 px-7 py-6 text-white"
            style={{
              background: "linear-gradient(120deg, var(--brand-dark), var(--brand-primary))",
            }}
          >
            <Image
              src="/images/brand/logo-vong-tron.png"
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 rounded-xl bg-white/95 p-1"
            />
            <div>
              <p className="text-lg font-extrabold leading-tight">
                CBO Sát Cánh
              </p>
              <p className="text-xs text-white/80">Trang quản trị nội dung</p>
            </div>
          </div>

          <div className="p-7">
            <h1 className="text-xl font-bold">Đăng nhập</h1>
            <p className="mb-6 mt-1 text-sm text-ink/65">
              Dùng tài khoản được cấp để quản trị website.
            </p>

            <form action={formAction} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">Email</span>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="ban@email.com"
                  className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">Mật khẩu</span>
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary"
                />
              </label>

              {state?.error && (
                <p
                  className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                  role="alert"
                >
                  <ShieldAlert size={17} className="mt-0.5 shrink-0" />
                  {state.error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="btn btn-primary w-full disabled:opacity-60"
              >
                {pending && <Loader2 size={18} className="animate-spin" />}
                {pending ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-ink/50">
          Quên mật khẩu? Liên hệ quản trị viên để được đặt lại.
        </p>
      </div>
    </main>
  );
}
