"use client";

import { useState, type CSSProperties } from "react";
import { RotateCcw, Palette, CheckCircle2 } from "lucide-react";
import { saveTheme } from "@/lib/admin/actions";
import { DEFAULT_THEME, THEME_PRESETS, type Theme } from "@/lib/theme";

type Props = { initial: Theme };

const COLORS: { key: keyof Theme; label: string; hint: string }[] = [
  { key: "primary", label: "Màu chính", hint: "Nút bấm, link, tiêu đề nhấn" },
  { key: "dark", label: "Màu đậm", hint: "Tiêu đề, footer" },
  { key: "ink", label: "Màu chữ", hint: "Nội dung thân bài" },
  { key: "surface", label: "Nền", hint: "Nền trang" },
  { key: "muted", label: "Nền phụ", hint: "Ô lọc, khối phụ" },
  { key: "accent", label: "Màu nhấn", hint: "Badge, chi tiết nổi bật" },
  { key: "line", label: "Màu viền", hint: "Đường phân cách" },
];

export default function ThemeEditor({ initial }: Props) {
  const [theme, setTheme] = useState<Theme>(() => ({ ...DEFAULT_THEME, ...initial }));
  const set = <K extends keyof Theme>(key: K, value: Theme[K]) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  const previewStyle = {
    "--brand-primary": theme.primary,
    "--brand-dark": theme.dark,
    "--brand-ink": theme.ink,
    "--brand-surface": theme.surface,
    "--brand-muted": theme.muted,
    "--brand-accent": theme.accent,
    "--brand-line": theme.line,
    "--brand-radius": `${theme.radius}px`,
    "--brand-font-scale": String(theme.fontScale),
  } as CSSProperties;

  return (
    <div className="grid gap-5 xl:grid-cols-[1.3fr,1fr]">
      <form action={saveTheme} className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Palette size={18} className="text-primary" />
          <h2 className="text-base font-bold">Bảng màu</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {COLORS.map((c) => (
            <label key={c.key} className="field">
              <span className="field-label">{c.label}</span>
              <span className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme[c.key] as string}
                  onChange={(e) => set(c.key, e.target.value as Theme[typeof c.key])}
                  className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-line bg-white p-1"
                />
                <input
                  name={c.key}
                  value={theme[c.key] as string}
                  onChange={(e) => set(c.key, e.target.value as Theme[typeof c.key])}
                  className="input font-mono uppercase !text-sm"
                  pattern="^#[0-9a-fA-F]{6}$"
                />
              </span>
              <span className="hint">{c.hint}</span>
            </label>
          ))}
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <label className="field">
            <span className="field-label">
              Bo góc: <b>{theme.radius}px</b>
            </span>
            <input
              type="range"
              name="radius"
              min={0}
              max={40}
              step={2}
              value={theme.radius}
              onChange={(e) => set("radius", Number(e.target.value))}
              className="w-full accent-[var(--brand-primary)]"
            />
            <span className="hint">0px (vuông) → 40px (tròn)</span>
          </label>

          <label className="field">
            <span className="field-label">
              Cỡ chữ: <b>{Math.round(theme.fontScale * 100)}%</b>
            </span>
            <input
              type="range"
              name="fontScale"
              min={0.9}
              max={1.2}
              step={0.05}
              value={theme.fontScale}
              onChange={(e) => set("fontScale", Number(e.target.value))}
              className="w-full accent-[var(--brand-primary)]"
            />
            <span className="hint">90% → 120%</span>
          </label>
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <p className="label">Bộ màu có sẵn</p>
          <div className="mb-5 flex flex-wrap gap-2">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => setTheme({ ...preset.theme })}
                className="group flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-xs font-bold text-ink/70 transition hover:border-primary"
              >
                <span className="flex">
                  <span className="h-4 w-4 rounded-l-md" style={{ background: preset.theme.primary }} />
                  <span className="h-4 w-4" style={{ background: preset.theme.dark }} />
                  <span className="h-4 w-4 rounded-r-md" style={{ background: preset.theme.accent }} />
                </span>
                {preset.name}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className="btn btn-primary py-2.5 text-sm">
              <CheckCircle2 size={17} /> Lưu áp dụng toàn trang
            </button>
            <button
              type="button"
              onClick={() => setTheme({ ...DEFAULT_THEME })}
              className="btn btn-ghost py-2.5 text-sm"
            >
              <RotateCcw size={16} /> Khôi phục màu nhận diện
            </button>
          </div>
        </div>
      </form>

      {/* Xem thử */}
      <div className="xl:sticky xl:top-24 xl:h-fit">
        <div className="card overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-base font-bold">Xem thử</h2>
            <p className="text-xs text-ink/55">Thay đổi hiện ngay trong khung này</p>
          </div>

          <div style={previewStyle} className="bg-[var(--brand-surface)] p-5">
            <div className="rounded-[var(--brand-radius)] bg-[var(--brand-muted)] p-4">
              <p className="text-sm font-bold text-[var(--brand-dark)]">
                CBO Sát Cánh
              </p>
              <p className="mt-1 text-sm text-[var(--brand-ink)]">
                Mỗi hành động yêu thương đều có thể tạo nên thay đổi ý nghĩa.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-[var(--brand-radius)] bg-[var(--brand-primary)] px-4 py-2 text-sm font-bold text-white">
                  Nhận tư vấn
                </span>
                <span className="inline-flex items-center rounded-[var(--brand-radius)] border border-[var(--brand-line)] px-4 py-2 text-sm font-bold text-[var(--brand-dark)]">
                  Xem thêm
                </span>
                <span className="badge" style={{ background: "var(--brand-accent)", color: "#231a05" }}>
                  Nổi bật
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[var(--brand-radius)] border border-[var(--brand-line)] p-3">
                <p className="text-sm font-bold text-[var(--brand-dark)]">Thẻ nội dung</p>
                <p className="mt-1 text-xs text-[var(--brand-ink)]/80">
                  Viền bo {theme.radius}px, chữ {Math.round(theme.fontScale * 100)}%.
                </p>
              </div>
              <div className="rounded-[var(--brand-radius)] border border-[var(--brand-line)] p-3">
                <p className="text-sm font-bold text-[var(--brand-dark)]">Thẻ nội dung</p>
                <p className="mt-1 text-xs text-[var(--brand-ink)]/80">
                  Nền phụ dùng màu đã chọn.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
