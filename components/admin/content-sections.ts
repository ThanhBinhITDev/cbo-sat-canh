import {
  BookOpen,
  Eye,
  Gem,
  Image,
  MapPin,
  PanelBottom,
  Phone,
  Search,
  Target,
  type LucideIcon,
} from "lucide-react";

export const SECTIONS: ReadonlyArray<{
  key: string;
  label: string;
  icon: LucideIcon;
}> = [
  { key: "hero", label: "Banner trang chủ", icon: Image },
  { key: "about", label: "Giới thiệu", icon: BookOpen },
  { key: "vision", label: "Tầm nhìn", icon: Eye },
  { key: "mission", label: "Sứ mệnh", icon: Target },
  { key: "values", label: "Giá trị cốt lõi", icon: Gem },
  { key: "contact", label: "Liên hệ", icon: Phone },
  { key: "map", label: "Bản đồ", icon: MapPin },
  { key: "footer", label: "Footer", icon: PanelBottom },
  { key: "seo", label: "SEO", icon: Search },
];

export type SectionKey = (typeof SECTIONS)[number]["key"];

export type SectionProgress = { filled: number; total: number };

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object")
    return Object.values(value as Record<string, unknown>).some(isFilled);
  return true;
}

export function sectionProgress(value: unknown): SectionProgress {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return { filled: 0, total: 0 };
  const entries = Object.entries(value as Record<string, unknown>);
  return {
    filled: entries.filter(([, v]) => isFilled(v)).length,
    total: entries.length,
  };
}
