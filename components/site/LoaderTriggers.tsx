"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { hold, releaseAll } from "@/lib/loading";

/** Trễ nhỏ trước khi hiện — điều hướng prefetch tức thì sẽ không nháy loader. */
const SHOW_DELAY_MS = 200;

/**
 * Gắn sự kiện để hiện loader khi thực sự có chờ:
 * - Bấm link nội bộ (điều hướng trang).
 * - Submit form server action (lưu trong admin); form xử lý bằng fetch được bỏ qua.
 * Loader tự ẩn khi điều hướng xong (pathname/search đổi).
 */
export default function LoaderTriggers({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const timer = useRef(0);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Điều hướng xong → nhả mọi tác vụ đang chờ.
  useEffect(() => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = 0;
    }
    releaseAll();
  }, [pathname, search]);

  useEffect(() => {
    const arm = () => {
      if (!enabledRef.current) return;
      if (timer.current) return;
      timer.current = window.setTimeout(() => {
        timer.current = 0;
        hold();
      }, SHOW_DELAY_MS);
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      if (href.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(href)) return;
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }
      arm();
    };

    const onSubmit = (e: Event) => {
      const form = (e.target as Element | null)?.closest?.("form");
      if (!form) return;
      // Form không có action/method = xử lý bằng fetch/JS (có spinner riêng) → bỏ qua.
      if (!form.hasAttribute("action") && !form.hasAttribute("method")) return;
      if (form.getAttribute("data-global-loader") === "manual") return;
      const mode = form.getAttribute("data-loading-mode");
      if (mode === "toast" || mode === "none") return;
      arm();
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      if (timer.current) {
        window.clearTimeout(timer.current);
        timer.current = 0;
      }
    };
  }, []);

  return null;
}
