import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp, cleanupRateLimits, rateLimit } from "@/lib/rate-limit";
import { sendNewsletterToSheet } from "@/lib/sheets";

export const runtime = "nodejs";

export async function POST(request: Request) {
  cleanupRateLimits();

  const ip = getClientIp(request);
  const limit = rateLimit(`newsletter:${ip}`, 5, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: `Bạn thao tác quá nhanh. Thử lại sau ${limit.retryAfterSec} giây.`,
      },
      { status: 429 },
    );
  }

  let body: { email?: unknown; name?: unknown; source?: unknown; website?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Dữ liệu không hợp lệ." },
      { status: 400 },
    );
  }

  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim().slice(0, 100);
  const source = String(body.source ?? "footer").trim().slice(0, 50);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
    return NextResponse.json(
      { ok: false, message: "Email chưa đúng định dạng." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  if (!admin) {
    console.warn(
      `[newsletter] SUPABASE chưa cấu hình — đăng ký ${email} chỉ được log.`,
    );
    return NextResponse.json({ ok: true, stored: false });
  }

  const { data: existing } = await admin
    .from("newsletters")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const { error } = await admin
    .from("newsletters")
    .insert({ email, name: name || null, source });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    console.error("[newsletter] insert failed:", error.message);
    return NextResponse.json(
      { ok: false, message: "Không đăng ký được, vui lòng thử lại." },
      { status: 500 },
    );
  }

  void sendNewsletterToSheet(email, source);

  return NextResponse.json({ ok: true, duplicate: false });
}
