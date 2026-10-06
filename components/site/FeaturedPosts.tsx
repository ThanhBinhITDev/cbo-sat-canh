import Link from "next/link";
import { Newspaper, ArrowRight } from "lucide-react";
import SectionHeading from "./SectionHeading";
import PostCard from "./PostCard";
import type { PostListItem } from "@/lib/content";

export default function FeaturedPosts({ posts }: { posts: PostListItem[] }) {
  return (
    <section id="tin-tuc" className="section" style={{ background: "var(--brand-muted)" }}>
      <div className="container-site">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            kicker="Tin tức & Hoạt động"
            title="Cập nhật từ cộng đồng"
            align="left"
          />
          <Link
            href="/tin-tuc"
            className="btn btn-ghost mb-10 !py-2.5 !text-sm"
          >
            Xem tất cả <ArrowRight size={16} />
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="card grid place-items-center gap-2 p-12 text-center">
            <Newspaper size={40} className="text-primary" />
            <p className="font-semibold text-primary-dark">Chưa có bài viết nào</p>
            <p className="max-w-md text-sm text-ink/65">
              Chúng tôi đang chuẩn bị những chia sẻ mới. Hãy quay lại sau hoặc
              liên hệ trực tiếp qua hotline để được tư vấn.
            </p>
            <Link href="/lien-he" className="btn btn-primary mt-2 !py-2.5 !text-sm">
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
      </div>
    </section>
  );
}
