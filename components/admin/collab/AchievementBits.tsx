import { Medal as MedalIcon } from "lucide-react";
import { TIER_BADGE, TIER_LABELS, type MedalTier } from "@/lib/types";

const TIER_EMOJI: Record<MedalTier, string> = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  platinum: "💎",
};

/** Nhãn huy chương theo cấp bậc (màu + emoji). */
export function MedalBadge({
  tier,
  name,
  compact = false,
}: {
  tier: MedalTier;
  name?: string;
  compact?: boolean;
}) {
  return (
    <span
      className={`badge ${TIER_BADGE[tier]}`}
      title={TIER_LABELS[tier]}
    >
      <span aria-hidden>{TIER_EMOJI[tier]}</span>
      {compact ? TIER_LABELS[tier] : (name ?? TIER_LABELS[tier])}
    </span>
  );
}

/** Huy chương nhỏ trong danh sách (icon + tên). */
export function MedalChip({ tier, name }: { tier: MedalTier; name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-semibold">
      <span aria-hidden>{TIER_EMOJI[tier]}</span>
      {name}
    </span>
  );
}

/** Ảnh đại diện tròn; không có thì hiện chữ đầu tên. */
export function PersonAvatar({
  name,
  url,
  size = "md",
}: {
  name: string | null | undefined;
  url?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm";
  const label = (name ?? "?").trim();
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 font-black text-primary ${dim}`}
      aria-hidden
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        (label.slice(0, 1).toUpperCase() || "?")
      )}
    </span>
  );
}

/** Dòng tổng quan điểm/huy chương của một người. */
export function StatChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary-dark">
      {icon}
      <span className="sr-only">{label}</span>
      {value}
    </span>
  );
}

export { MedalIcon };
