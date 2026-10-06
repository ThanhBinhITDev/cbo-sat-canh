"use client";

import { useSyncExternalStore } from "react";
import { Phone, MessageCircle, Mail } from "lucide-react";
import type { ContactInfo } from "@/lib/types";

const subscribeNoop = () => () => {};

/** Cột nút liên hệ nhanh (desktop) / thanh dưới đáy (mobile). */
export default function FloatingContact({ contact }: { contact: ContactInfo }) {
  // Chỉ render sau khi hydration xong để tránh lệch HTML giữa server và client.
  const ready = useSyncExternalStore(subscribeNoop, () => true, () => false);
  if (!ready) return null;

  const hotline = contact.hotline[0] ?? "";
  const tel = hotline.replace(/\D/g, "");
  const zalo = contact.zalo.replace(/\D/g, "");

  const items = [
    {
      href: `tel:${tel}`,
      label: `Gọi ${hotline}`,
      icon: <Phone size={18} />,
      bg: "var(--brand-dark)",
      fg: "#fff",
      showLabel: true,
    },
    {
      href: `https://zalo.me/${zalo}`,
      label: "Zalo",
      icon: <MessageCircle size={18} />,
      bg: "#0068FF",
      fg: "#fff",
      showLabel: false,
      external: true,
    },
    {
      href: contact.fanpage_url,
      label: "Messenger",
      icon: <Mail size={18} />,
      bg: "var(--brand-primary)",
      fg: "#fff",
      showLabel: false,
      external: true,
    },
  ];

  return (
    <>
      {/* Desktop: cột phải giữa màn hình */}
      <div className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2 md:flex">
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noopener noreferrer" : undefined}
            title={item.label}
            aria-label={item.label}
            className="grid h-12 w-12 place-items-center rounded-full text-white shadow-lg transition hover:scale-110"
            style={{ background: item.bg, color: item.fg }}
          >
            {item.icon}
          </a>
        ))}
      </div>

      {/* Mobile: thanh dưới đáy */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-3">
          <a
            href={`tel:${tel}`}
            className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-white"
            style={{ background: "var(--brand-dark)" }}
          >
            <Phone size={17} /> Gọi ngay
          </a>
          <a
            href={`https://zalo.me/${zalo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 border-x border-line py-3 text-sm font-bold"
            style={{ background: "#0068FF", color: "#fff" }}
          >
            <MessageCircle size={17} /> Zalo
          </a>
          <a
            href="/lien-he"
            className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-white"
            style={{ background: "var(--brand-primary)" }}
          >
            <Mail size={17} /> Hỏi thêm
          </a>
        </div>
      </div>
    </>
  );
}
