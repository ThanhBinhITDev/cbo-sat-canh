import type { CSSProperties } from "react";

export const DEFAULT_THEME = {
  primary: "#279CD7",
  dark: "#1C4592",
  ink: "#454C56",
  surface: "#FFFFFF",
  muted: "#F5F8FA",
  accent: "#FFB020",
  line: "#E3EAF0",
  radius: 16,
  fontScale: 1,
} as const;

export type Theme = {
  primary: string;
  dark: string;
  ink: string;
  surface: string;
  muted: string;
  accent: string;
  line: string;
  radius: number;
  fontScale: number;
};

export const THEME_PRESETS: { name: string; theme: Theme }[] = [
  {
    name: "Nhận diện CBO (mặc định)",
    theme: { ...DEFAULT_THEME },
  },
  {
    name: "Chuyên nghiệp",
    theme: {
      ...DEFAULT_THEME,
      primary: "#0EA5E9",
      dark: "#0C4A6E",
      ink: "#334155",
      accent: "#F97316",
      line: "#E2E8F0",
    },
  },
  {
    name: "Sức khỏe",
    theme: {
      ...DEFAULT_THEME,
      primary: "#10B981",
      dark: "#065F46",
      ink: "#3F3F46",
      accent: "#F59E0B",
      line: "#E5E7EB",
    },
  },
  {
    name: "Ấm áp",
    theme: {
      ...DEFAULT_THEME,
      primary: "#EF4444",
      dark: "#7F1D1D",
      ink: "#44403C",
      accent: "#FACC15",
      line: "#E7E5E4",
    },
  },
];

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Ghép theme đã lưu (DB) hoặc giá trị mặc định, lọc bỏ giá trị hỏng. */
export function normalizeTheme(input: unknown): Theme {
  const out: Theme = { ...DEFAULT_THEME };
  if (!input || typeof input !== "object") return out;

  const raw = input as Record<string, unknown>;

  (["primary", "dark", "ink", "surface", "muted", "accent", "line"] as const)
    .forEach((key) => {
      const value = raw[key];
      if (typeof value === "string" && HEX.test(value.trim())) {
        out[key] = value.trim();
      }
    });

  if (typeof raw.radius === "number" && raw.radius >= 0 && raw.radius <= 40) {
    out.radius = raw.radius;
  }
  if (
    typeof raw.fontScale === "number" &&
    raw.fontScale >= 0.9 &&
    raw.fontScale <= 1.2
  ) {
    out.fontScale = raw.fontScale;
  }
  return out;
}

/** Theme -> object style gán cho <html> để server render đúng màu ngay. */
export function themeToStyle(theme: Theme): CSSProperties {
  return {
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
}
