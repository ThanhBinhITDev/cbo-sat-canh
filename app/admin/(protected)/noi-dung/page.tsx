import Link from "next/link";
import { FileCode2 } from "lucide-react";
import { Flash, PageHeader } from "@/components/admin/ui";
import ContentEditor, { SECTIONS } from "@/components/admin/ContentEditor";
import { getContent } from "@/lib/settings";

export default async function StaticContentPage({
  searchParams,
}: PageProps<"/admin/noi-dung">) {
  const sp = await searchParams;
  const content = await getContent();
  const requested = typeof sp.phan === "string" ? sp.phan : "hero";
  const section = (SECTIONS.find((s) => s.key === requested)?.key ?? "hero") as
    (typeof SECTIONS)[number]["key"];

  const initial = (content as unknown as Record<string, unknown>)[section];
  const payload =
    initial && typeof initial === "object"
      ? (initial as Record<string, unknown>)
      : {};

  return (
    <>
      <PageHeader
        title="Nội dung tĩnh"
        description="Nội dung văn bản hiển thị ở các trang khách. Chọn từng phần để chỉnh sửa."
        action={
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-xs font-bold text-ink/60">
            <FileCode2 size={15} /> {SECTIONS.length} phần nội dung
          </span>
        }
      />

      <Flash
        flash={typeof sp.flash === "string" ? sp.flash : undefined}
        error={typeof sp.err === "string" ? sp.err : undefined}
      />

      <div className="grid gap-5 lg:grid-cols-[220px,1fr]">
        <nav className="h-fit space-y-1" aria-label="Phần nội dung">
          {SECTIONS.map((item) => {
            const active = item.key === section;
            return (
              <Link
                key={item.key}
                href={`/admin/noi-dung?phan=${item.key}`}
                className={`block rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  active
                    ? "bg-primary text-white"
                    : "border border-line bg-white text-ink/65 hover:border-primary hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <ContentEditor key={section} section={section} initial={payload} />
      </div>
    </>
  );
}
