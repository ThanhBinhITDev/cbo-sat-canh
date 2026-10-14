"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Palette, RotateCcw, Check } from "lucide-react";
import { DEFAULT_THEME, THEME_PRESETS, type Theme } from "@/lib/theme";

const KEY = "cbosc.theme.override";

const FIELDS: { key: keyof Omit<Theme, "radius" | "fontScale">; label: string }[] = [
  { key: "primary", label: "Màu chính" },
  { key: "dark", label: "Màu đậm" },
  { key: "ink", label: "Màu chữ" },
  { key: "surface", label: "Nền" },
  { key: "muted", label: "Nền phụ" },
  { key: "accent", label: "Màu nhấn" },
  { key: "line", label: "Viền" },
];

function applyTheme(t: Theme) {
  const root = document.documentElement.style;
  root.setProperty("--brand-primary", t.primary);
  root.setProperty("--brand-dark", t.dark);
  root.setProperty("--brand-ink", t.ink);
  root.setProperty("--brand-surface", t.surface);
  root.setProperty("--brand-muted", t.muted);
  root.setProperty("--brand-accent", t.accent);
  root.setProperty("--brand-line", t.line);
  root.setProperty("--brand-radius", `${t.radius}px`);
  root.setProperty("--brand-font-scale", String(t.fontScale));
}

function readServerTheme(): Theme {
  const cs = getComputedStyle(document.documentElement);
  const get = (n: string, fb: string) => cs.getPropertyValue(n).trim() || fb;
  const radius = parseFloat(get("--brand-radius", "16"));
  const scale = parseFloat(get("--brand-font-scale", "1"));
  return {
    primary: get("--brand-primary", DEFAULT_THEME.primary),
    dark: get("--brand-dark", DEFAULT_THEME.dark),
    ink: get("--brand-ink", DEFAULT_THEME.ink),
    surface: get("--brand-surface", DEFAULT_THEME.surface),
    muted: get("--brand-muted", DEFAULT_THEME.muted),
    accent: get("--brand-accent", DEFAULT_THEME.accent),
    line: get("--brand-line", DEFAULT_THEME.line),
    radius: Number.isFinite(radius) ? radius : 16,
    fontScale: Number.isFinite(scale) ? scale : 1,
  };
}

const subscribeStorage = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};

const readOverride = (): string | null => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

const subscribeMounted = () => () => {};

type Pos = { right: number; top?: number; bottom?: number };

/** Khách tự chỉnh màu — lưu trên máy họ (localStorage).
 *  `variant="bar"`: nút gọn trong tầng trên navbar.
 *  `variant="menu"`: nút rộng trong menu trượt (điện thoại).
 *  Bảng điều khiển render qua portal, tự chọn mở xuống hay mở lên cho vừa màn hình. */
export default function ThemeSwitcher({
  variant = "bar",
}: {
  variant?: "bar" | "menu";
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Theme | null>(null);
  const [saved, setSaved] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Giá trị nhị phân: false khi SSR/hydration, true sau khi gắn xong.
  const mounted = useSyncExternalStore(
    subscribeMounted,
    () => true,
    () => false,
  );
  const overrideRaw = useSyncExternalStore(
    subscribeStorage,
    readOverride,
    () => null,
  );

  const base = useMemo(
    () => (mounted ? readServerTheme() : { ...DEFAULT_THEME }),
    [mounted],
  );

  const storedTheme = useMemo(() => {
    if (!mounted || !overrideRaw) return null;
    try {
      const parsed = JSON.parse(overrideRaw);
      if (!parsed || typeof parsed !== "object") return null;
      return { ...base, ...(parsed as Partial<Theme>) } as Theme;
    } catch {
      return null;
    }
  }, [mounted, overrideRaw, base]);

  const theme = draft ?? storedTheme ?? base;

  const placePanel = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const gap = 8;
    const estH = Math.min(vh * 0.7, 460) + gap;
    const spaceBelow = vh - r.bottom;
    const openUp = spaceBelow < estH && r.top > spaceBelow;
    setPos({
      right: vw - r.right,
      ...(openUp ? { bottom: vh - r.top + gap } : { top: r.bottom + gap }),
    });
  };

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    placePanel();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const reposition = () => placePanel();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open]);

  const update = (patch: Partial<Theme>) => {
    setSaved(false);
    const next = { ...theme, ...patch };
    setDraft(next);
    applyTheme(next);
  };

  const save = () => {
    localStorage.setItem(KEY, JSON.stringify(theme));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const restore = () => {
    localStorage.removeItem(KEY);
    const server = readServerTheme();
    setDraft(server);
    applyTheme(server);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const panel =
    mounted && open && pos ? (
      <div
        ref={panelRef}
        style={{
          position: "fixed",
          right: pos.right,
          zIndex: 50,
          ...(pos.top != null ? { top: pos.top } : { bottom: pos.bottom }),
        }}
        className="max-h-[70vh] w-[19rem] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-line bg-surface p-4 text-ink shadow-2xl"
      >
        <p className="mb-3 text-sm font-bold text-primary-dark">
          Tùy chỉnh giao diện
        </p>

        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink/60">
          Mẫu có sẵn
        </p>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => update(preset.theme)}
              className="flex items-center gap-2 rounded-xl border border-line p-2 text-left text-xs font-medium transition hover:border-primary"
            >
              <span
                className="h-6 w-6 shrink-0 rounded-md"
                style={{ background: preset.theme.primary }}
              />
              <span className="leading-tight">{preset.name}</span>
            </button>
          ))}
        </div>

        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink/60">
          Tự chọn
        </p>
        <div className="space-y-2">
          {FIELDS.map((field) => (
            <label
              key={field.key}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span>{field.label}</span>
              <input
                type="color"
                value={theme[field.key]}
                onChange={(e) => update({ [field.key]: e.target.value } as Partial<Theme>)}
                className="h-8 w-12 cursor-pointer rounded border border-line bg-transparent p-0"
                aria-label={field.label}
              />
            </label>
          ))}

          <label className="block text-sm">
            <span className="flex justify-between">
              Bo góc <b>{theme.radius}px</b>
            </span>
            <input
              type="range"
              min={0}
              max={32}
              value={theme.radius}
              onChange={(e) => update({ radius: Number(e.target.value) })}
              className="w-full accent-[var(--brand-primary)]"
            />
          </label>

          <label className="block text-sm">
            <span className="flex justify-between">
              Cỡ chữ <b>{Math.round(theme.fontScale * 100)}%</b>
            </span>
            <input
              type="range"
              min={0.9}
              max={1.2}
              step={0.05}
              value={theme.fontScale}
              onChange={(e) => update({ fontScale: Number(e.target.value) })}
              className="w-full accent-[var(--brand-primary)]"
            />
          </label>
        </div>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={save} className="btn btn-primary flex-1 !py-2 !text-sm">
            {saved ? <Check size={16} /> : null}
            {saved ? "Đã lưu" : "Lưu trên máy"}
          </button>
          <button
            type="button"
            onClick={restore}
            className="btn btn-ghost !px-3 !py-2"
            title="Khôi phục màu mặc định"
          >
            <RotateCcw size={16} />
          </button>
        </div>
        <p className="mt-2 text-[0.72rem] leading-snug text-ink/60">
          Màu bạn chọn chỉ áp dụng trên máy này. Muốn đổi cho toàn bộ trang,
          quản trị viên vào mục <b>Giao diện</b> trong trang quản trị.
        </p>
      </div>
    ) : null;

  return (
    <>
      {variant === "menu" ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary-dark"
        >
          <Palette size={17} aria-hidden />
          <span>Tùy chỉnh màu sắc</span>
        </button>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-label="Tùy chỉnh giao diện"
          title="Tùy chỉnh giao diện"
          style={{
            borderColor: "currentColor",
            backgroundColor: "color-mix(in srgb, currentColor 14%, transparent)",
          }}
          className="flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-medium opacity-90 transition hover:opacity-100"
        >
          <Palette size={13} aria-hidden />
          <span>Màu sắc</span>
        </button>
      )}

      {panel ? createPortal(panel, document.body) : null}
    </>
  );
}
