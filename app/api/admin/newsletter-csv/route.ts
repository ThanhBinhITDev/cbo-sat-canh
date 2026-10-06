import { NextResponse } from "next/server";
import { AuthError, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function escapeCell(value: unknown) {
  const raw = value == null ? "" : String(value);
  // Đẩy ký tự = + - @ ở đầu ra khỏi công thức Excel
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  try {
    await requireRole(["admin", "collaborator"]);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json(
        { error: e.code === "forbidden" ? "Forbidden" : "Unauthorized" },
        { status: e.code === "forbidden" ? 403 : 401 },
      );
    }
    throw e;
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase chưa được cấu hình" },
      { status: 503 },
    );
  }

  const { data, error } = await supabase
    .from("newsletters")
    .select("email, name, source, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const header = ["email", "ho_ten", "nguon", "dang_hoat_dong", "ngay_dang_ky"];
  const lines = [header.map(escapeCell).join(",")];

  for (const row of data ?? []) {
    lines.push(
      [
        row.email,
        row.name,
        row.source,
        row.is_active ? "co" : "khong",
        row.created_at,
      ]
        .map(escapeCell)
        .join(","),
    );
  }

  // BOM để Excel hiển thị tiếng Việt đúng
  const body = "\uFEFF" + lines.join("\r\n");
  const filename = `newsletter-cbo-sat-canh-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
