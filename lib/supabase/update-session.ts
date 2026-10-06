import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  isSupabaseConfigured,
} from "@/lib/env";

/**
 * Làm mới phiên Supabase và bảo vệ /admin/*.
 * Chạy trong proxy.ts (Next.js 16 — thay cho middleware.ts).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  if (!isSupabaseConfigured) {
    if (request.nextUrl.pathname.startsWith("/api/admin")) {
      return NextResponse.json(
        { error: "Supabase chưa được cấu hình" },
        { status: 503 },
      );
    }
    if (
      request.nextUrl.pathname.startsWith("/admin") &&
      !request.nextUrl.pathname.startsWith("/admin/login")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return response;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({
          request: { headers: request.headers },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // KHÔNG gọi getUser() ở đây — chỉ refresh token để cookie không hết hạn.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (path.startsWith("/admin/login")) {
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (path.startsWith("/admin") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = path !== "/admin" ? `?den=${encodeURIComponent(path)}` : "";
    return NextResponse.redirect(url);
  }

  // API quản trị: trả 401 JSON thay vì chuyển hướng trang.
  if (path.startsWith("/api/admin") && !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  return response;
}
