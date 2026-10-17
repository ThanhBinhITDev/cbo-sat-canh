"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  FileText,
  FileCode2,
  Images,
  GalleryHorizontal,
  Palette,
  Stethoscope,
  Users,
  Handshake,
  CircleHelp,
  Mail,
  UserCog,
  UserRound,
  LogOut,
  Menu,
  X,
  Home,
  HardDrive,
  ListChecks,
  ClipboardList,
  Trophy,
  Award,
} from "lucide-react";
import Image from "next/image";
import { signOut } from "@/app/admin/actions";
import Breadcrumb from "./Breadcrumb";
import type { Role } from "@/lib/types";
import {
  buildBreadcrumbs,
  isNavActive,
  visibleNav,
} from "@/lib/admin/nav";

const ICONS: Record<string, ReactNode> = {
  "/admin": <LayoutDashboard size={18} />,
  "/admin/bai-viet": <FileText size={18} />,
  "/admin/noi-dung": <FileCode2 size={18} />,
  "/admin/anh": <Images size={18} />,
  "/admin/slider": <GalleryHorizontal size={18} />,
  "/admin/giao-dien": <Palette size={18} />,
  "/admin/dich-vu": <Stethoscope size={18} />,
  "/admin/doi-ngu": <Users size={18} />,
  "/admin/doi-tac": <Handshake size={18} />,
  "/admin/cau-hoi": <CircleHelp size={18} />,
  "/admin/newsletter": <Mail size={18} />,
  "/admin/tai-khoan": <UserCog size={18} />,
  "/admin/luu-tru": <HardDrive size={18} />,
  "/admin/viec-cua-toi": <ClipboardList size={18} />,
  "/admin/nhiem-vu": <ListChecks size={18} />,
  "/admin/xep-hang": <Trophy size={18} />,
  "/admin/dong-gop": <Award size={18} />,
  "/admin/huy-chuong": <Award size={18} />,
  "/admin/du-an": <ListChecks size={18} />,
  "/admin/hoat-dong": <ClipboardList size={18} />,
  "/admin/tai-lieu": <FileText size={18} />,
};

const ROLE_LABELS: Record<Role, string> = {
  admin: "Quản trị viên",
  editor: "Biên tập viên",
  collaborator: "Cộng tác viên",
};

export default function AdminShell({
  children,
  fullName,
  email,
  role,
  avatarUrl,
  logoSquareUrl,
  canManageTasks = false,
}: {
  children: ReactNode;
  fullName: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
  logoSquareUrl?: string | null;
  canManageTasks?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const groups = visibleNav(role, { canManage: canManageTasks });
  const crumbs = buildBreadcrumbs(pathname);
  const initial = (fullName || email).slice(0, 1).toUpperCase();

  const avatar = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
  ) : (
    initial
  );

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-[68px] items-center gap-2.5 border-b border-line px-5">
        <Image
          src={logoSquareUrl || "/images/brand/logo-vong-tron.png"}
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
        {groups.map((group) => (
          <div key={group.key} className="mb-3">
            <p className="px-3.5 pb-1.5 pt-2 text-[11px] font-bold uppercase tracking-wide text-ink/50">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = isNavActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`mb-1 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${
                    active
                      ? "bg-primary/10 font-medium text-primary-dark"
                      : "font-normal text-ink/80 hover:bg-muted hover:text-primary-dark"
                  }`}
                >
                  <span className={active ? "text-primary-dark" : "text-primary"}>
                    {ICONS[item.href]}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}

        <div className="my-3 border-t border-line" />

        <Link
          href="/"
          className="mb-1 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-normal text-ink/80 transition hover:bg-muted hover:text-primary-dark"
        >
          <Home size={18} /> Xem trang web
        </Link>
      </nav>

      <div className="border-t border-line p-3">
        <div className="mb-2 flex items-center gap-2.5 px-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-sm font-black text-primary">
            {avatar}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{fullName || email}</p>
            <p className="truncate text-xs text-primary-dark">
              {ROLE_LABELS[role]}
            </p>
          </div>
        </div>
        <Link
          href="/admin/ho-so"
          onClick={() => setOpen(false)}
          className="mb-1 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink/80 transition hover:bg-muted hover:text-primary-dark"
        >
          <UserRound size={18} /> Sửa hồ sơ
        </Link>
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
          <Breadcrumb crumbs={crumbs} />
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-primary-dark sm:inline-flex">
              <span className="dot-new h-2 w-2 rounded-full" /> Đang hoạt động
            </span>
            <Link
              href="/admin/ho-so"
              aria-label="Sửa hồ sơ"
              className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-primary-dark text-xs font-black text-white"
            >
              {avatar}
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
