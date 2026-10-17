import Link from "next/link";

function buildHref(
  basePath: string,
  params: Record<string, string | undefined>,
  page: number,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  else search.delete("page");
  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Phân trang server-side: hiển thị Trước / Sau và số trang hiện tại. */
export function Pagination({
  basePath,
  params,
  page,
  pageSize,
  total,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  pageSize: number;
  total: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const prev = page > 1 ? buildHref(basePath, params, page - 1) : null;
  const next = page < totalPages ? buildHref(basePath, params, page + 1) : null;

  return (
    <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-sm">
      <span className="text-ink/70">
        Trang <b>{page}</b> / {totalPages} · {total} mục
      </span>
      <div className="flex gap-2">
        {prev ? (
          <Link href={prev} className="btn btn-ghost px-4 py-2 text-sm">
            ← Trước
          </Link>
        ) : (
          <span className="btn btn-ghost pointer-events-none px-4 py-2 text-sm opacity-40">
            ← Trước
          </span>
        )}
        {next ? (
          <Link href={next} className="btn btn-ghost px-4 py-2 text-sm">
            Sau →
          </Link>
        ) : (
          <span className="btn btn-ghost pointer-events-none px-4 py-2 text-sm opacity-40">
            Sau →
          </span>
        )}
      </div>
    </div>
  );
}
