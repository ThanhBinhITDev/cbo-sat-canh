import Link from "next/link";
import Image from "next/image";
import { CalendarDays, ArrowRight } from "lucide-react";
import { CATEGORY_LABELS, type PostCategory } from "@/lib/types";
import type { PostListItem } from "@/lib/content";
import PostAuthor from "./PostAuthor";

export function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function PostCard({
  post,
  featured = false,
}: {
  post: PostListItem;
  featured?: boolean;
}) {
  return (
    <article className="card card-hover group flex h-full flex-col overflow-hidden">
      <Link href={`/tin-tuc/${post.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-muted">
        {post.cover_url ? (
          <Image
            src={post.cover_url}
            alt={post.title}
            fill
            sizes={featured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 33vw"}
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="grid h-full w-full place-items-center text-3xl font-black text-white/90"
            style={{ background: "linear-gradient(135deg, var(--brand-primary), var(--brand-dark))" }}
          >
            CBO
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-surface/95 px-3 py-1 text-xs font-bold text-primary-dark">
          {CATEGORY_LABELS[post.category as PostCategory] ?? "Tin tức"}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/60">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={13} /> {formatDate(post.published_at)}
          </span>
          {post.author_name ? (
            <PostAuthor
              name={post.author_name}
              avatarUrl={post.author_avatar_url}
              size="sm"
              className="[&>span:last-child]:font-medium [&>span:last-child]:text-ink/70 text-xs"
            />
          ) : null}
        </div>
        <h3 className="mb-2 text-lg font-bold leading-snug text-primary-dark">
          <Link href={`/tin-tuc/${post.slug}`} className="transition group-hover:text-primary">
            {post.title}
          </Link>
        </h3>
        {post.excerpt && (
          <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-ink/75">
            {post.excerpt}
          </p>
        )}
        <Link
          href={`/tin-tuc/${post.slug}`}
          className="mt-auto inline-flex items-center gap-1.5 text-sm font-bold text-primary transition group-hover:gap-2.5"
        >
          Đọc tiếp <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}
