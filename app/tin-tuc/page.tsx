import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import ThemeSwitcher from "@/components/site/ThemeSwitcher";
import FloatingContact from "@/components/site/FloatingContact";
import PostCard from "@/components/site/PostCard";
import { getPosts } from "@/lib/content";
import { getContent } from "@/lib/settings";
import { CATEGORY_LABELS, type PostCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tin tức & Hoạt động",
  description:
    "Tin tức, sự kiện và các hoạt động cộng đồng của Tổ chức Dựa vào Cộng đồng CBO Sát Cánh.",
};

const FILTERS = [
  { key: "", label: "Tất cả" },
  { key: "tin-tuc", label: "Tin tức" },
  { key: "hoat-dong", label: "Hoạt động" },
];

export default async function NewsPage({
  searchParams,
}: PageProps<"/tin-tuc">) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : "";
  const page = Math.max(1, Number(params.trang) || 1);
  const perPage = 12;

  const [content, allPosts] = await Promise.all([
    getContent(),
    getPosts({ category: category || undefined, limit: 200 }),
  ]);

  const totalPages = Math.max(1, Math.ceil(allPosts.length / perPage));
  const posts = allPosts.slice((page - 1) * perPage, page * perPage);

  const buildHref = (key: string, targetPage = 1) => {
    const query = new URLSearchParams();
    if (key) query.set("category", key);
    if (targetPage > 1) query.set("trang", String(targetPage));
    const qs = query.toString();
    return `/tin-tuc${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <Header contact={content.contact} />
      <main className="flex-1 pt-[72px]">
        <div
          className="border-b border-line"
          style={{ background: "var(--brand-muted)" }}
        >
          <div className="container-site py-12 text-center">
            <span className="section-kicker">Cập nhật</span>
            <h1 className="section-title">Tin tức &amp; Hoạt động</h1>
            <p className="mx-auto mt-3 max-w-2xl text-ink/70">
              Những chia sẻ, sự kiện và hoạt động vì sức khỏe cộng đồng từ CBO
              Sát Cánh.
            </p>

            <nav className="mt-7 flex flex-wrap justify-center gap-2" aria-label="Lọc danh mục">
              {FILTERS.map((f) => {
                const active = category === f.key;
                return (
                  <Link
                    key={f.key}
                    href={buildHref(f.key)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? "text-white shadow-sm"
                        : "border border-line bg-surface text-ink/70 hover:border-primary hover:text-primary"
                    }`}
                    style={active ? { background: "var(--brand-primary)" } : undefined}
                  >
                    {f.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        <section className="section bg-surface">
          <div className="container-site">
            {posts.length === 0 ? (
              <div className="card grid place-items-center gap-3 p-14 text-center">
                <Newspaper size={44} className="text-primary" />
                <p className="text-lg font-bold text-primary-dark">
                  Chưa có bài viết nào
                </p>
                <p className="max-w-md text-sm text-ink/65">
                  {category
                    ? `Danh mục "${
                        CATEGORY_LABELS[category as PostCategory] ?? category
                      }" chưa có bài.`
                    : "Chúng tôi đang chuẩn bị những chia sẻ mới. Hãy quay lại sau."}
                </p>
                <Link href="/lien-he" className="btn btn-primary !py-2.5 !text-sm">
                  Liên hệ tư vấn
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <nav
                className="mt-10 flex items-center justify-center gap-2"
                aria-label="Phân trang"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <Link
                    key={n}
                    href={buildHref(category, n)}
                    aria-current={n === page ? "page" : undefined}
                    className={`grid h-10 w-10 place-items-center rounded-xl text-sm font-bold transition ${
                      n === page
                        ? "text-white"
                        : "border border-line text-ink/70 hover:border-primary hover:text-primary"
                    }`}
                    style={n === page ? { background: "var(--brand-primary)" } : undefined}
                  >
                    {n}
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </section>
      </main>
      <Footer
        contact={content.contact}
        slogan={content.footer.slogan}
        copyright={content.footer.copyright}
        address={content.contact.address}
      />
      <FloatingContact contact={content.contact} />
      <ThemeSwitcher />
    </>
  );
}
