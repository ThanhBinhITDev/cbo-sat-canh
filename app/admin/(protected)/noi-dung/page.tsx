import Link from "next/link";
import { Flash, PageHeader } from "@/components/admin/ui";
import ContentEditor from "@/components/admin/ContentEditor";
import { SECTIONS, sectionProgress } from "@/components/admin/content-sections";
import { getContent } from "@/lib/settings";

export default async function StaticContentPage({
  searchParams,
}: PageProps<"/admin/noi-dung">) {
  const sp = await searchParams;
  const content = await getContent();
  const store = (content ?? {}) as Record<string, unknown>;
  const requested = typeof sp.phan === "string" ? sp.phan : "hero";
  const section = SECTIONS.find((s) => s.key === requested)?.key || "hero";

  const initial = store[section];
  const payload =
    initial && typeof initial === "object"
      ? (initial as Record<string, unknown>)
      : {};

  return (
    <>
      <PageHeader
        title="Nội dung tĩnh"
        description="Nội dung văn bản hiển thị ở các trang khách. Chọn từng phần để chỉnh sửa."
        action={<span className="badge badge-gray">{SECTIONS.length} phần</span>}
      />

      <Flash
        flash={typeof sp.flash === "string" ? sp.flash : undefined}
        error={typeof sp.err === "string" ? sp.err : undefined}
      />

      <div className="grid gap-5 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <nav
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden"
          aria-label="Phần nội dung"
        >
          {SECTIONS.map((item) => {
            const active = item.key === section;
            return (
              <Link
                key={item.key}
                href={`/admin/noi-dung?phan=${item.key}`}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-bold transition ${
                  active
                    ? "border-primary/30 bg-primary/10 text-primary-dark"
                    : "border-line bg-surface text-ink/65 hover:bg-primary/5 hover:text-primary-dark"
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <nav
          className="card hidden p-2 lg:sticky lg:top-[92px] lg:block lg:self-start"
          aria-label="Phần nội dung"
        >
          <div className="flex flex-col gap-1">
            {SECTIONS.map((item) => {
              const active = item.key === section;
              const progress = sectionProgress(store[item.key]);
              return (
                <Link
                  key={item.key}
                  href={`/admin/noi-dung?phan=${item.key}`}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-primary/10 font-semibold text-primary-dark"
                      : "text-ink/70 hover:bg-muted hover:text-primary-dark"
                  }`}
                >
                  <item.icon size={17} className="mt-0.5 shrink-0" />
                  <span className="min-w-0">
                    <span className="block truncate">{item.label}</span>
                    <span className="mt-0.5 block text-xs font-medium text-ink/80">
                      {progress.total > 0
                        ? `${progress.filled}/${progress.total} trường`
                        : "Chưa điền"}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="min-w-0">
          <ContentEditor key={section} section={section} initial={payload} />
        </div>
      </div>
    </>
  );
}
