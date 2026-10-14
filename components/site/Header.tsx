"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Menu, X, Phone, MapPin, Search, Globe } from "lucide-react";
import SearchModal from "@/components/site/SearchModal";
import ThemeSwitcher from "@/components/site/ThemeSwitcher";
import type { HeaderContent } from "@/lib/types";

export default function Header({
  header,
  logoUrl,
}: {
  header: HeaderContent;
  logoUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const address = header.address.trim();
  const phone = header.phone.trim();
  const nav = header.nav;
  const logo = logoUrl || "/images/brand/logo-cau.png";

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
    <>
      {/* Tầng trên: địa chỉ + hotline (trái), khẩu hiệu + đổi ngôn ngữ (phải).
          Màu nền/chữ do admin chỉnh; mặc định dùng màu chính nhận diện.
          Ẩn trên điện thoại (màn hình hẹp < 640px); cuộn đi cùng trang. */}
      <div
        className="relative z-40 hidden sm:block"
        style={{
          background: header.top_color || "var(--brand-primary)",
          color: header.top_text_color || "#ffffff",
        }}
      >
        <div className="container-bar flex h-10 items-center gap-3 text-xs sm:text-[13px]">
          {/* Trái: địa chỉ, rồi tới hotline. */}
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-5">
            {address && (
              <p className="flex min-w-0 items-center gap-1.5 font-normal">
                <MapPin size={14} aria-hidden className="shrink-0" />
                <span className="truncate">{address}</span>
              </p>
            )}

            {phone && (
              <a
                href={`tel:${phone.replace(/\D/g, "")}`}
                className="flex shrink-0 items-center gap-1.5 font-light opacity-90 transition hover:opacity-100"
              >
                <Phone size={13} aria-hidden />
                <span className="whitespace-nowrap">{phone}</span>
              </a>
            )}
          </div>

          {/* Phải: khẩu hiệu + tùy chỉnh màu + chỗ đổi ngôn ngữ. */}
          <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
            {header.slogan && (
              <p className="hidden text-right font-normal italic opacity-90 lg:block">
                {header.slogan}
              </p>
            )}

            <ThemeSwitcher />

            {header.show_language && (
              <button
                type="button"
                disabled
                title="Đổi ngôn ngữ (đang phát triển)"
                aria-label="Đổi ngôn ngữ (đang phát triển)"
                style={{
                  borderColor: "currentColor",
                  backgroundColor: "color-mix(in srgb, currentColor 14%, transparent)",
                }}
                className="flex cursor-not-allowed items-center gap-1.5 rounded-md border px-2 py-0.5 font-medium opacity-85"
              >
                <Globe size={13} aria-hidden />
                <span>VI</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tầng dưới: logo, menu, tìm kiếm, liên hệ. Dính đỉnh khi cuộn. */}
      <div
        className={`sticky top-0 z-50 backdrop-blur transition-shadow duration-300 ${
          scrolled
            ? "bg-surface/95 border-b border-line shadow-[0_6px_20px_-16px_rgba(0,0,0,.5)]"
            : "bg-surface/90"
        }`}
      >
        <div className="container-bar flex h-[76px] flex-nowrap items-center gap-4">
          <Link href="/" aria-label="CBO Sát Cánh — Trang chủ" className="shrink-0">
            <Image
              src={logo}
              alt="Logo CBO Sát Cánh"
              width={190}
              height={48}
              priority
              className="h-12 w-auto lg:h-11 xl:h-12"
            />
          </Link>

          <nav className="hidden min-w-0 flex-1 flex-nowrap items-center justify-center gap-0.5 lg:flex xl:gap-1">
            {nav.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className="nav-link shrink-0 whitespace-nowrap rounded-full px-2 py-2 text-[0.95rem] font-semibold text-ink xl:px-3.5 xl:text-[1rem]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
            {/* Desktop ≥ xl: mở command palette kèm nhãn */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Mở tìm kiếm"
              className="hidden items-center gap-2 rounded-full border border-line bg-muted px-4 py-2.5 text-sm font-medium text-ink/60 transition hover:border-primary hover:text-primary xl:inline-flex"
            >
              <Search size={16} aria-hidden />
              <span>Tìm kiếm...</span>
            </button>

            {/* Desktop lg–xl: chỉ icon tìm kiếm để thanh menu không tràn */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Mở tìm kiếm"
              className="hidden h-11 w-11 place-items-center rounded-full border border-line bg-muted text-ink/60 transition hover:border-primary hover:text-primary lg:grid xl:hidden"
            >
              <Search size={18} aria-hidden />
            </button>

            {/* Nút CTA chỉ hiện từ md trở lên. Bọc trong div để `.hidden`/`md:block`
                thắng được `display` của `.btn` (lớp .btn nằm ngoài @layer nên áp đảo utility). */}
            <div className="hidden shrink-0 md:block">
              <Link
                href={header.cta_href || "/lien-he"}
                className="btn btn-primary !py-2.5 !text-[0.95rem]"
              >
                {header.cta_label || "Liên hệ"}
              </Link>
            </div>

            {/* Mobile/tablet: tìm kiếm + mở menu (thay nút Liên hệ) */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Tìm kiếm"
              className="grid h-11 w-11 place-items-center rounded-xl border border-line text-primary-dark transition hover:border-primary hover:text-primary lg:hidden"
            >
              <Search size={21} />
            </button>

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Mở menu"
              className="grid h-11 w-11 place-items-center rounded-xl border border-line text-primary-dark transition hover:border-primary hover:text-primary lg:hidden"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {open && (
        <>
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] lg:hidden"
          />
          <div className="fixed left-0 top-0 z-50 flex h-dvh w-[86%] max-w-sm flex-col bg-surface shadow-2xl lg:hidden">
            <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-line px-5">
              <Image
                src={logo}
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
              {nav.map((item) => (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block w-full break-words rounded-xl px-4 py-3 text-base font-semibold text-ink transition hover:bg-muted hover:text-primary-dark"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="shrink-0 border-t border-line p-4">
              {/* Điện thoại (<640px): tầng trên navbar bị ẩn nên đưa nút đổi màu vào đây. */}
              <div className="mb-3 sm:hidden">
                <ThemeSwitcher variant="menu" />
              </div>
              {phone && (
                <a
                  href={`tel:${phone.replace(/\D/g, "")}`}
                  className="btn btn-ghost w-full border border-line"
                >
                  <Phone size={17} /> <span className="truncate">Gọi {phone}</span>
                </a>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
