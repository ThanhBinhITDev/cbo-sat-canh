"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import type { ContactInfo } from "@/lib/types";

const NAV = [
  { href: "/", label: "Trang chủ" },
  { href: "/#gioi-thieu", label: "Giới thiệu" },
  { href: "/#dich-vu", label: "Dịch vụ" },
  { href: "/tin-tuc", label: "Tin tức" },
  { href: "/#doi-ngu", label: "Đội ngũ" },
  { href: "/#doi-tac", label: "Đối tác" },
  { href: "/lien-he", label: "Liên hệ" },
];

export default function Header({ contact }: { contact: ContactInfo }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const hotline = contact.hotline[0] ?? "";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-surface/95 backdrop-blur border-b border-line shadow-[0_6px_20px_-16px_rgba(0,0,0,.5)]"
          : "bg-surface/80 backdrop-blur"
      }`}
    >
      <div className="container-site flex h-[72px] items-center gap-4">
        <Link href="/" aria-label="CBO Sát Cánh — Trang chủ" className="shrink-0">
          <Image
            src="/images/brand/logo-cau.png"
            alt="Logo CBO Sát Cánh"
            width={190}
            height={48}
            priority
            className="h-11 w-auto"
          />
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-[0.95rem] font-medium text-ink transition hover:bg-muted hover:text-primary-dark"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <a
            href={`tel:${hotline.replace(/\D/g, "")}`}
            className="hidden items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-bold text-primary-dark transition hover:bg-muted sm:inline-flex"
          >
            <Phone size={16} aria-hidden />
            {hotline}
          </a>
          <Link href="/lien-he" className="btn btn-primary hidden !py-2.5 !text-sm md:inline-flex">
            Hỏi thêm
          </Link>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Mở menu"
            className="grid h-11 w-11 place-items-center rounded-xl border border-line text-primary-dark lg:hidden"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {open && (
        <>
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] lg:hidden"
          />
          <div className="fixed left-0 top-0 z-50 flex h-dvh w-[86%] max-w-sm flex-col bg-surface shadow-2xl lg:hidden">
            <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-line px-5">
              <Image
                src="/images/brand/logo-cau.png"
                alt="Logo CBO Sát Cánh"
                width={150}
                height={40}
                className="h-9 w-auto"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng menu"
                className="grid h-10 w-10 place-items-center rounded-xl border border-line"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2.5">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block w-full break-words rounded-xl px-4 py-2.5 text-base font-medium text-ink transition hover:bg-muted hover:text-primary-dark"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="shrink-0 space-y-2 border-t border-line p-4">
              <a href={`tel:${hotline.replace(/\D/g, "")}`} className="btn btn-ghost w-full border border-line">
                <Phone size={17} /> <span className="truncate">Gọi {hotline}</span>
              </a>
              <Link href="/lien-he" onClick={() => setOpen(false)} className="btn btn-ghost w-full">
                Nhắn tin hỏi thêm
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
