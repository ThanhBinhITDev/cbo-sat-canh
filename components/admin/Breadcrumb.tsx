import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Crumb } from "@/lib/admin/nav";

/** Breadcrumb cho khu quản trị. Mục cuối là trang hiện tại (không link). */
export default function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Vị trí hiện tại" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
              {i > 0 && <ChevronRight size={14} className="shrink-0 text-ink/40" aria-hidden />}
              {crumb.href && !last ? (
                <Link
                  href={crumb.href}
                  className="truncate text-ink/60 transition hover:text-primary-dark"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className={`truncate ${last ? "font-semibold text-ink" : "text-ink/60"}`}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
