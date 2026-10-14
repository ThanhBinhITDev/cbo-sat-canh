"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { isLoading, subscribeLoading } from "@/lib/loading";
import type { LoaderConfig } from "@/lib/loader";

const MAX_WAIT_MS = 8000;
const FADE_MS = 350;

const subscribeNoop = () => () => {};

/**
 * Lớp phủ màn hình chờ dùng chung:
 * - Splash khi mở trang lần đầu (GIF admin tải lên, hoặc spinner mặc định).
 * - Hiện trong lúc điều hướng / lưu form chậm (qua store ở lib/loading).
 */
export default function GlobalLoader({ config }: { config: LoaderConfig }) {
  const enabled = config.enabled;
  const storeLoading = useSyncExternalStore(subscribeLoading, isLoading, () => false);

  // Cờ do script boot gắn trước khi hydrate (splash chỉ hiện 1 lần trong phiên).
  const skipped = useSyncExternalStore(
    subscribeNoop,
    () => document.documentElement.hasAttribute("data-loader-skip"),
    () => false,
  );

  const [splash, setSplash] = useState(enabled);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    if (!enabled || skipped) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const minMs = reduced ? 0 : config.minDurationMs;
    const start = performance.now();
    let done = false;
    let holdTimer = 0;

    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(holdTimer);
      setHiding(true);
      window.setTimeout(() => setSplash(false), FADE_MS);
      if (config.oncePerSession) {
        try {
          sessionStorage.setItem("cbosc.loader.shown", "1");
        } catch {
          /* chế độ riêng tư có thể chặn sessionStorage */
        }
      }
    };

    const reveal = () => {
      const remain = Math.max(0, minMs - (performance.now() - start));
      if (remain > 0) holdTimer = window.setTimeout(finish, remain);
      else finish();
    };

    const maxTimer = window.setTimeout(finish, MAX_WAIT_MS);
    const loadTimer = document.readyState === "complete" ? window.setTimeout(reveal, 0) : 0;
    if (!loadTimer) window.addEventListener("load", reveal, { once: true });

    return () => {
      window.removeEventListener("load", reveal);
      window.clearTimeout(holdTimer);
      window.clearTimeout(maxTimer);
      window.clearTimeout(loadTimer);
    };
  }, [enabled, skipped, config.minDurationMs, config.oncePerSession]);

  const active = enabled && (storeLoading || (splash && !skipped));
  if (!active) return null;

  const label = config.showText ? config.text.trim() : "";

  return (
    <div
      id="site-loader"
      role="status"
      aria-label={label || "Đang tải"}
      className={`fixed inset-0 z-[100] grid place-items-center transition-opacity duration-300 ${
        hiding && !storeLoading ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{ background: config.background ?? "var(--brand-surface)" }}
    >
      {config.imageUrl ? (
        <div className="flex flex-col items-center gap-4 px-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- GIF động, cần <img> thường để chạy */}
          <img
            src={config.imageUrl}
            alt=""
            aria-hidden
            className="h-auto max-h-[45vh] w-auto max-w-[70vw] object-contain"
          />
          {label && (
            <p className="max-w-[80vw] text-balance text-base font-semibold text-ink/70 sm:text-lg">
              {label}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 px-6 text-center">
          <span className="h-12 w-12 animate-spin rounded-full border-4 border-line border-t-primary" />
          {label && (
            <span className="max-w-[80vw] text-balance text-sm font-semibold text-ink/70">
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
