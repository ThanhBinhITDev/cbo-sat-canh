import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp, cleanupRateLimits, rateLimit } from "@/lib/rate-limit";
import { sendContactToSheet } from "@/lib/sheets";
import { SERVICE_OPTIONS } from "@/lib/types";

export const runtime = "nodejs";

type Body = {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  service_interest?: unknown;
  message?: unknown;
  website?: unknown;
};

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
  cleanupRateLimits();

  const ip = getClientIp(request);
  const limit = rateLimit(`contact:${ip}`, 3, 10 * 60 * 1000);
  if (!limit.ok) {
    return bad(
      `Bạn gửi quá nhanh. Vui lòng thử lại sau ${limit.retryAfterSec} giây.`,
      429,
    );
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return bad("Dữ liệu gửi lên không hợp lệ.");
  }

  // Honeypot: bot thường điền ô ẩn → bỏ qua im lặng
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const name = String(body.name ?? "").trim();
  const phone = String(body.phone ?? "").replace(/[\s.\-()]/g, "");
  const email = String(body.email ?? "").trim();
  const service = String(body.service_interest ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (name.length < 2 || name.length > 100) {
    return bad("Vui lòng nhập họ và tên hợp lệ.");
  }
  if (!/^0\d{9,10}$/.test(phone)) {
    return bad("Số điện thoại chưa hợp lệ.");
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return bad("Email chưa đúng định dạng.");
  }
  if (message.length < 10 || message.length > 2000) {
    return bad("Nội dung câu hỏi cần từ 10 đến 2000 ký tự.");
  }

  const allowedServices = SERVICE_OPTIONS.map((s) => s.value);
  const serviceInterest =
    service && allowedServices.includes(service as never) ? service : "other";

  // Chặn chèn script/HTML
  const sanitize = (value: string) =>
    value.replace(/<[^>]*>/g, "").replace(/\s{2,}/g, " ").trim();
  const clean = {
    name: sanitize(name),
    phone,
    email: sanitize(email),
    service_interest: serviceInterest,
    message: sanitize(message),
  };

  // 1) BẢN CHÍNH: Supabase
  const admin = createAdminClient();
  let stored = false;

  if (admin) {
    const { error } = await admin.from("contact_messages").insert({
      ...clean,
      source: "website",
    });
    if (error) {
      console.error("[contact] insert failed:", error.message);
      return bad("Không gửi được câu hỏi. Vui lòng thử lại hoặc gọi hotline.");
    }
    stored = true;
  } else {
    console.warn(
      "[contact] SUPABASE chưa cấu hình — câu hỏi chỉ được log, không lưu. " +
        "Thêm SUPABASE_SERVICE_ROLE_KEY vào .env.local",
    );
    console.warn(
      "[contact] payload:",
      JSON.stringify({ ...clean, message: `${clean.message.slice(0, 80)}…` }),
    );
  }

  // 2) BẢN SAO: Google Sheets (không chặn trả lời cho khách)
  if (stored) {
    void sendContactToSheet(clean);
  }

  return NextResponse.json({ ok: true, stored });
}
