import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/update-session";

/**
 * Next.js 16: `middleware` đã đổi tên thành `proxy`.
 * Chạy cho mọi request để làm mới phiên Supabase và bảo vệ /admin/*.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Bỏ qua ảnh tĩnh, favicon, api (xử lý riêng), và sitemap/robots.
     */
    "/((?!_next/static|_next/image|favicon.ico|images/|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
