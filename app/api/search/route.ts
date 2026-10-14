import { NextResponse } from "next/server";
import { getPosts } from "@/lib/content";

/** Tìm bài viết cho ô tìm kiếm dạng command palette. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().slice(0, 100);

  if (!q) return NextResponse.json({ items: [] });

  const posts = await getPosts({ q, limit: 6 });

  return NextResponse.json({
    items: posts.map((post) => ({
      slug: post.slug,
      title: post.title,
      category: post.category,
    })),
  });
}
