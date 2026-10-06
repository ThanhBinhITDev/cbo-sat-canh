import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, CalendarDays, UserRound } from "lucide-react";
import { FacebookIcon } from "@/components/site/BrandIcons";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import ThemeSwitcher from "@/components/site/ThemeSwitcher";
import FloatingContact from "@/components/site/FloatingContact";
import PostCard from "@/components/site/PostCard";
import { getPostBySlug, getPosts } from "@/lib/content";
import { getContent, absoluteUrl } from "@/lib/settings";
import { CATEGORY_LABELS } from "@/lib/types";
import { SITE_NAME } from "@/lib/env";
import CopyLinkButton from "@/components/site/CopyLinkButton";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Không tìm thấy bài viết" };

  const title = post.meta_title || post.title;
  const description =
    post.meta_description ||
    post.excerpt ||
    `${SITE_NAME} — tin tức và hoạt động cộng đồng`;

  return {
    title,
    description,
    openGraph: {
      type: "article",
      locale: "vi_VN",
      title,
      description,
      url: absoluteUrl(`/tin-tuc/${post.slug}`),
      images: post.cover_url ? [{ url: post.cover_url }] : undefined,
      publishedTime: post.published_at ?? undefined,
      authors: post.author?.full_name ? [post.author.full_name] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.cover_url ? [post.cover_url] : undefined,
    },
  };
}

export default async function PostPage({ params }: PageProps<"/tin-tuc/[slug]">) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const [content, related] = await Promise.all([
    getContent(),
    getPosts({ category: post.category, limit: 4 }),
  ]);

  const siblings = related.filter((p) => p.slug !== post.slug).slice(0, 3);
  const url = absoluteUrl(`/tin-tuc/${post.slug}`);
  const published = post.published_at
    ? new Date(post.published_at).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";

  return (
    <>
      <Header contact={content.contact} />
      <main className="flex-1 pt-[72px]">
        <div
          className="border-b border-line"
          style={{ background: "var(--brand-muted)" }}
        >
          <div className="container-site py-8">
            <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-sm text-ink/60">
              <Link href="/" className="transition hover:text-primary">
                Trang chủ
              </Link>
              <span>/</span>
              <Link href="/tin-tuc" className="transition hover:text-primary">
                Tin tức
              </Link>
              <span>/</span>
              <span className="line-clamp-1 max-w-[16rem] text-ink">
                {post.title}
              </span>
            </nav>

            <span
              className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-bold text-white"
              style={{ background: "var(--brand-primary)" }}
            >
              {CATEGORY_LABELS[post.category] ?? "Tin tức"}
            </span>

            <h1 className="max-w-4xl text-[clamp(1.6rem,4vw,2.6rem)] font-extrabold leading-tight">
              {post.title}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink/65">
              {published && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={15} /> {published}
                </span>
              )}
              {post.author?.full_name && (
                <span className="inline-flex items-center gap-1.5">
                  <UserRound size={15} /> {post.author.full_name}
                </span>
              )}
              <span className="flex items-center gap-2">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-primary transition hover:gap-2.5"
                >
                  <FacebookIcon size={15} /> Chia sẻ
                </a>
                <CopyLinkButton url={url} />
              </span>
            </div>
          </div>
        </div>

        <article className="section bg-surface">
          <div className="container-site">
            <div className="mx-auto max-w-3xl">
              {post.cover_url && (
                <div className="relative mb-8 aspect-[16/10] overflow-hidden rounded-3xl bg-muted">
                  <Image
                    src={post.cover_url}
                    alt={post.title}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="object-cover"
                  />
                </div>
              )}

              <div className="prose-post">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {post.content_md ?? ""}
                </ReactMarkdown>
              </div>

              <Link
                href="/tin-tuc"
                className="mt-10 inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:gap-3"
              >
                <ArrowLeft size={16} /> Quay lại danh sách tin tức
              </Link>
            </div>
          </div>
        </article>

        {siblings.length > 0 && (
          <section className="section" style={{ background: "var(--brand-muted)" }}>
            <div className="container-site">
              <h2 className="section-title mb-8 text-center">Bài viết liên quan</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {siblings.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            </div>
          </section>
        )}
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
