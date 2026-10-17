import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Thẻ số liệu dùng chung cho các trang quản trị cộng tác.
 * Có `href` thì thẻ là liên kết; không thì chỉ hiển thị.
 */
export function StatCard({
  icon,
  label,
  value,
  hint,
  href,
  tone = "primary",
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint?: string;
  href?: string;
  tone?: "primary" | "green" | "yellow" | "red" | "gray";
}) {
  const toneClass: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    green: "bg-emerald-100 text-emerald-600",
    yellow: "bg-amber-100 text-amber-600",
    red: "bg-red-100 text-red-600",
    gray: "bg-muted text-ink/60",
  };

  const body = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-ink/70">{label}</p>
        <p className="mt-1.5 text-3xl font-extrabold text-primary-dark">{value}</p>
        {hint && <p className="mt-1 text-xs text-ink/70">{hint}</p>}
      </div>
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${toneClass[tone]}`}
      >
        {icon}
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block bg-surface p-5 transition hover:bg-primary/5">
        {body}
      </Link>
    );
  }
  return <div className="bg-surface p-5">{body}</div>;
}
