/**
 * Gửi dữ liệu sang Google Sheets qua Apps Script Web App.
 * Xem hướng dẫn tạo Web App: docs/09-api-form-va-tin.md
 *
 * THIẾT KẾ: Sheets chỉ là BẢN SAO. Ghi vào Supabase luôn chạy trước,
 * nếu Sheets lỗi chỉ log lại — câu hỏi của khách không bị mất.
 */

const WEBHOOK = process.env.GOOGLE_SHEETS_WEBHOOK ?? "";
const SECRET = process.env.GOOGLE_SHEETS_SECRET ?? "";
const TIMEOUT_MS = 6000;

export type ContactRow = {
  name: string;
  phone: string;
  email?: string;
  service_interest?: string;
  message: string;
};

export type SheetResult = { ok: boolean; skipped?: boolean; error?: string };

async function post(sheet: string, payload: Record<string, unknown>) {
  if (!WEBHOOK) return { ok: false, skipped: true as const };

  const url = new URL(WEBHOOK);
  if (SECRET) url.searchParams.set("k", SECRET);

  const body = { sheet, ...payload };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
      signal: controller.signal,
      redirect: "follow",
    });
    return { ok: res.ok, skipped: false as const };
  } catch (error) {
    return {
      ok: false,
      skipped: false as const,
      error: error instanceof Error ? error.message : "unknown",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function sendContactToSheet(row: ContactRow): Promise<SheetResult> {
  const result = await post("Form", {
    time: new Date().toISOString(),
    name: row.name,
    phone: row.phone,
    email: row.email ?? "",
    service: row.service_interest ?? "",
    message: row.message,
  });
  if (!result.ok && !result.skipped) {
    console.error("[sheets] contact failed:", result.error);
  }
  return { ok: result.ok, skipped: result.skipped, error: result.error };
}

export async function sendNewsletterToSheet(email: string, source: string) {
  const result = await post("Newsletter", {
    time: new Date().toISOString(),
    email,
    source,
  });
  if (!result.ok && !result.skipped) {
    console.error("[sheets] newsletter failed:", result.error);
  }
  return result;
}
