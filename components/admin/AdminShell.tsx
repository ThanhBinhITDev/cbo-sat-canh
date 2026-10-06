"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  FileText,
  Stethoscope,
  Handshake,
  Users,
  FileCode2,
  Palette,
  Images,
  CircleHelp,
  Mail,
  UserCog,
  LogOut,
  Menu,
  X,
  Home,
} from "lucide-react";
import Image from "next/image";
import { signOut } from "@/app/admin/actions";
import type { Role } from "@/lib/types";

export type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  roles: Role[];
  exact?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={18} />, roles: ["admin", "editor", "collaborator"], exact: true },
  { href: "/admin/bai-viet", label: "Bài viết & Tin tức", icon: <FileText size={18} />, roles: ["admin", "editor"] },
  { href: "/admin/dich-vu", label: "Dịch vụ", icon: <Stethoscope size={18} />, roles: ["admin"] },
  { href: "/admin/doi-tac", label: "Đối tác", icon: <Handshake size={18} />, roles: ["admin"] },
  { href: "/admin/doi-ngu", label: "Đội ngũ", icon: <Users size={18} />, roles: ["admin"] },
  { href: "/admin/noi-dung", label: "Nội dung tĩnh", icon: <FileCode2 size={18} />, roles: ["admin"] },
  { href: "/admin/giao-dien", label: "Giao diện", icon: <Palette size={18} />, roles: ["admin"] },
  { href: "/admin/anh", label: "Quản lý ảnh", icon: <Images size={18} />, roles: ["admin", "editor"] },
  { href: "/admin/cau-hoi", label: "Câu hỏi liên hệ", icon: <CircleHelp size={18} />, roles: ["admin", "editor", "collaborator"] },
  { href: "/admin/newsletter", label: "Đăng ký nhận tin", icon: <Mail size={18} />, roles: ["admin", "collaborator"] },
  { href: "/admin/tai-khoan", label: "Tài khoản", icon: <UserCog size={18} />, roles: ["admin"] },
];

const ROLE_LABELS: Record<Role, string> = {
  admin: "Quản trị viên",
  editor: "Biên tập viên",
  collaborator: "Cộng tác viên",
};

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export default function AdminShell({
  children,
  fullName,
  email,
  role,
}: {
  children: ReactNode;
  fullName: string;
  email: string;
  role: Role;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-[68px] items-center gap-2.5 border-b border-line px-5">
        <Image
          src="/images/brand/logo-vong-tron.png"
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 rounded-lg"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold leading-tight text-primary-dark">
            CBO Sát Cánh
          </p>
          <p className="truncate text-xs text-ink/80">Quản trị nội dung</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="ml-auto grid h-9 w-9 place-items-center rounded-lg border border-line lg:hidden"
          aria-label="Đóng menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3" aria-label="Menu quản trị">
        {items.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`mb-1 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${
                active
                  ? "bg-primary/10 font-medium text-primary-dark"
                  : "font-normal text-ink/80 hover:bg-muted hover:text-primary-dark"
              }`}
            >
              <span className={active ? "text-primary-dark" : "text-primary"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}

        <div className="my-3 border-t border-line" />

        <Link
          href="/"
          className="mb-1 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-normal text-ink/80 transition hover:bg-muted hover:text-primary-dark"
        >
          <Home size={18} /> Xem trang web
        </Link>
      </nav>

      <div className="border-t border-line p-3">
        <div className="mb-2 px-2">
          <p className="truncate text-sm font-bold">{fullName || email}</p>
          <p className="text-xs text-primary-dark">{ROLE_LABELS[role]}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="t-danger flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition"
          >
            <LogOut size={18} /> Đăng xuất
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-muted">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-surface lg:block">
        {sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Đóng menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/45"
          />
          <aside className="animate-slide-in shadow-modal absolute inset-y-0 left-0 w-72 border-r border-line bg-surface">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
        <header className="sticky top-0 z-20 flex h-[68px] items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-line lg:hidden"
            aria-label="Mở menu"
          >
            <Menu size={20} />
          </button>
          <p className="truncate text-sm text-ink/80">
            Quản trị website CBO Sát Cánh
          </p>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-primary-dark sm:inline-flex">
              <span className="dot-new h-2 w-2 rounded-full" /> Đang hoạt động
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-dark text-xs font-black text-white">
              {(fullName || email).slice(0, 1).toUpperCase()}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
