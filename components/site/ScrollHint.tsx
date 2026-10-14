"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

/** Ngưỡng cuộn: qua đoạn này thì gợi ý ẩn đi (chỉ "bám" một đoạn đầu trang). */
const HIDE_AFTER = 140;

/**
 * Gợi ý cuộn xuống bám đáy cửa sổ (tablet + desktop).
 * — Nằm cố định gần cuối khung nhìn, tự ẩn khi cuộn xuống.
 * — Pill kính mờ nền tối + chữ trắng nên đọc được trên cả ảnh slider lẫn nền sáng.
 */
export default function ScrollHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const update = () => setVisible(window.scrollY <= HIDE_AFTER);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <a
      href="#gioi-thieu"
      aria-label="Cuộn xuống"
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-6 left-1/2 z-30 hidden -translate-x-1/2 items-center gap-2 rounded-full bg-black/40 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg ring-1 ring-white/25 backdrop-blur-md transition-opacity duration-300 md:inline-flex ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <span
        aria-hidden
        className="flex h-4 w-[11px] justify-center rounded-[5px] border-2 border-white/90 pt-[2px]"
      >
        <span className="h-1 w-[2px] rounded-full bg-white" />
      </span>
      <span className="whitespace-nowrap">Cuộn xuống</span>
      <ChevronDown size={13} className="animate-bounce" />
    </a>
  );
}
