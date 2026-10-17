"use server";

import { revalidatePath } from "next/cache";
import { requireRole, AuthError } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getQuotaStatus } from "@/lib/admin/data";
import { quotaState, quotaLockMessage } from "@/lib/admin/quota";
import { invalidateSettingsCache, getSettings } from "@/lib/settings";
import { slugify } from "@/lib/slug";
import { normalizeTheme, type Theme } from "@/lib/theme";
import { normalizeUsername, validateUsername, isValidEmail } from "@/lib/account";
import {
  BRAND_FIELDS,
  brandImageUrl,
  brandPath,
  normalizeBrand,
  validateBrandImageFile,
  type Brand,
} from "@/lib/brand";
import {
  loaderImageUrl,
  loaderPath,
  normalizeLoader,
  validateLoaderFile,
  type LoaderConfig,
} from "@/lib/loader";
import { storagePathFromPublicUrl } from "@/lib/avatar";
import { collectUsedPaths, SITE_ASSETS_BUCKET } from "@/lib/admin/storage";
import { toDirectImageUrl } from "@/lib/drive-link";
import { SUPABASE_URL } from "@/lib/env";
import { cleanPostHtml, htmlToText } from "@/lib/sanitize";
import { normalizeToast, TOAST_POSITIONS, type ToastConfig, type ToastPosition } from "@/lib/toast";
import type {
  ContactStatus,
  PostCategory,
  PostStatus,
  Role,
} from "@/lib/types";

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

export type ActionState = { ok: boolean; message?: string };

const REDIRECT_BACK = new Set(["undefined", "null", ""]);

function back(path?: string | null) {
  const raw = (path ?? "").trim();
  if (!raw || REDIRECT_BACK.has(raw) || !raw.startsWith("/")) return "/admin";
  return raw;
}

/** Tín hiệu kết thúc action: `run` đổi thành ActionState để client hiện toast. */
class ActionDone extends Error {
  constructor(
    readonly ok: boolean,
    message?: string,
  ) {
    super(message);
  }
}

function flash(
  _path: string,
  message: string,
  isError = false,
  _params: Record<string, string> = {},
): never {
  throw new ActionDone(!isError, message);
}

function fail(path: string, message: string, params?: Record<string, string>): never {
  flash(path, message, true, params);
}

/** Chạy thân action; kết thúc bằng flash/fail thì trả ActionState, lỗi khác thì ném tiếp. */
async function run(fn: () => Promise<unknown>): Promise<ActionState> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    if (e instanceof ActionDone) return { ok: e.ok, message: e.message };
    throw e;
  }
}

/**
 * Bọc action trả ActionState: lỗi bất ngờ (mạng, Storage, DB) thành thông báo
 * thay vì văng ra error boundary làm trang trắng.
 */
async function safeAction(
  label: string,
  fn: () => Promise<ActionState>,
): Promise<ActionState> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ActionDone) return { ok: e.ok, message: e.message };
    const detail = e instanceof Error ? e.message : String(e);
    console.error(`[admin:${label}]`, e);
    return { ok: false, message: `Có lỗi khi ${label}: ${detail.slice(0, 200)}` };
  }
}

/** Thông điệp lỗi quyền cho action trả ActionState. */
function authMessage(e: unknown): string {
  if (e instanceof AuthError) {
    return e.code === "forbidden"
      ? "Bạn không có quyền thực hiện thao tác này."
      : "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }
  throw e;
}

/** Chặn ghi khi hết hạn mức, trả ActionState thay vì redirect. */
async function quotaBlock(): Promise<ActionState | null> {
  const status = await getQuotaStatus();
  if (!status?.ok) return null;
  const state = quotaState(status.value);
  return state.locked ? { ok: false, message: quotaLockMessage(state) } : null;
}

/** Bọc lỗi quyền để trang gọi chuyển hướng đúng chỗ. */
function guard(e: unknown, path: string): never {
  if (e instanceof AuthError) {
    fail(
      path,
      e.code === "forbidden"
        ? "Bạn không có quyền thực hiện thao tác này."
        : "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    );
  }
  throw e;
}

function text(v: FormDataEntryValue | null, fallback = "") {
  if (typeof v !== "string") return fallback;
  return v.trim();
}

function str(v: FormDataEntryValue | null, max = 10_000) {
  return text(v).slice(0, max);
}

function bool(v: FormDataEntryValue | null) {
  return v === "on" || v === "true" || v === "1";
}

function num(v: FormDataEntryValue | null, fallback = 0) {
  const n = Number(text(v, String(fallback)));
  return Number.isFinite(n) ? n : fallback;
}

/** Ghi 1 dòng vào bảng, trả về error.message nếu có. */
async function write(
  table: string,
  row: Record<string, unknown>,
  options: { onConflict?: string } = {},
) {
  const supabase = await createClient();
  if (!supabase) return "Chưa cấu hình Supabase (thiếu .env.local).";

  const query = supabase.from(table).upsert(row, {
    onConflict: options.onConflict,
    ignoreDuplicates: false,
  });
  const { error } = await query;
  return error?.message ?? null;
}

async function remove(table: string, id: string) {
  const supabase = await createClient();
  if (!supabase) return "Chưa cấu hình Supabase (thiếu .env.local).";
  const { error } = await supabase.from(table).delete().eq("id", id);
  return error?.message ?? null;
}

function revalidatePublic() {
  invalidateSettingsCache();
  revalidatePath("/", "layout");
}

/**
 * Chặn mọi lệnh ghi khi đã chạm hạn mức (Database ≥500 MB hoặc Storage ≥1 GB).
 * Không kiểm tra được (lỗi RPC) thì cho qua — nền tảng Supabase vẫn tự
 * read-only ở đúng hạn nên đây chỉ là lớp thông báo thân thiện hơn.
 */
async function assertWritable(path: string): Promise<void> {
  const status = await getQuotaStatus();
  if (!status?.ok) return;
  const state = quotaState(status.value);
  if (state.locked) fail(path, quotaLockMessage(state));
}

/* ------------------------------------------------------------------ *
 * Ảnh bìa bài viết
 * ------------------------------------------------------------------ */

const COVER_MAX_BYTES = 5 * 1024 * 1024;
const COVER_TIMEOUT_MS = 12_000;

function extFromMime(type: string): string | null {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
    "image/svg+xml": "svg",
  };
  return map[type] ?? null;
}

/**
 * Đưa ảnh bìa từ link ngoài về Supabase Storage (không phụ thuộc bên thứ ba).
 * - Rỗng, đường dẫn nội bộ (/...), hoặc ảnh đã ở Supabase của mình → giữ nguyên.
 * - Tải thất bại (bị chặn, quá lớn, không phải ảnh...) → trả `error` để chặn lưu.
 */
async function rehostCover(
  raw: string,
  userId: string,
): Promise<{ url: string | null; error?: string }> {
  const value = raw.trim();
  if (!value) return { url: null };
  if (value.startsWith("/")) return { url: value };
  if (!/^https?:\/\//i.test(value)) {
    return {
      url: null,
      error: "Link ảnh bìa không hợp lệ. Vui lòng dán link http(s) hoặc tải ảnh lên.",
    };
  }

  // Ảnh đã nằm trên Supabase của mình → không cần tải lại.
  if (
    SUPABASE_URL &&
    value.includes(new URL(SUPABASE_URL).host) &&
    value.includes("/storage/v1/object/public/site-assets/")
  ) {
    return { url: value };
  }

  const direct = toDirectImageUrl(value);
  if (!direct) {
    return {
      url: null,
      error: "Không nhận diện được ảnh từ link bìa. Vui lòng tải ảnh lên.",
    };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      url: null,
      error: "Thiếu SUPABASE_SECRET_KEY nên không tải được ảnh bìa về máy chủ.",
    };
  }

  let res: Response;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), COVER_TIMEOUT_MS);
    try {
      res = await fetch(direct, {
        signal: controller.signal,
        redirect: "follow",
        headers: { "User-Agent": "CBOSatCanhBot/1.0 (+https://satcanh.angiang.vn)" },
      });
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return {
      url: null,
      error: "Không tải được ảnh bìa từ link (quá thời gian hoặc bị chặn). Vui lòng tải ảnh lên.",
    };
  }

  if (!res.ok) {
    return {
      url: null,
      error: `Không tải được ảnh bìa (mã ${res.status}). Vui lòng tải ảnh lên.`,
    };
  }

  const mime = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!mime.startsWith("image/")) {
    return { url: null, error: "Link bìa không trỏ tới ảnh. Vui lòng tải ảnh lên." };
  }
  const ext = extFromMime(mime);
  if (!ext) {
    return { url: null, error: "Định dạng ảnh bìa không được hỗ trợ. Vui lòng tải ảnh lên." };
  }

  const declared = Number(res.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > COVER_MAX_BYTES) {
    return { url: null, error: "Ảnh bìa lớn hơn 5MB. Vui lòng tải ảnh lên." };
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > COVER_MAX_BYTES) {
    return { url: null, error: "Ảnh bìa lớn hơn 5MB. Vui lòng tải ảnh lên." };
  }

  const key = `uploads/${userId}/cover-${Date.now()}.${ext}`;
  const { error: up } = await admin.storage
    .from("site-assets")
    .upload(key, buf, { cacheControl: "3600", contentType: mime, upsert: false });
  if (up) return { url: null, error: `Không lưu được ảnh bìa: ${up.message}` };

  const { data } = admin.storage.from("site-assets").getPublicUrl(key);
  return { url: data.publicUrl };
}

/* ------------------------------------------------------------------ *
 * Bài viết
 * ------------------------------------------------------------------ */

export async function savePost(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const id = str(formData.get("id"));
  const listPath = str(formData.get("back")) || "/admin/bai-viet";
  const path = id ? listPath : "/admin/bai-viet/moi";

  const user = await requireRole(["admin", "editor"]).catch((e) => guard(e, path));
  await assertWritable(path);
  if (!user.profile) return { ok: false, message: "Bạn không có quyền thực hiện thao tác này." };

  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Chưa cấu hình Supabase (thiếu .env.local)." };

  const title = str(formData.get("title"), 300);
  const contentHtml = cleanPostHtml(str(formData.get("content_html"), 200_000));
  const category = str(formData.get("category")) as PostCategory;
  const status = str(formData.get("status")) as PostStatus;

  if (!title) return { ok: false, message: "Vui lòng nhập tiêu đề." };
  if (!htmlToText(contentHtml)) return { ok: false, message: "Vui lòng nhập nội dung bài viết." };
  if (!["tin-tuc", "hoat-dong"].includes(category)) {
    return { ok: false, message: "Danh mục không hợp lệ." };
  }
  if (!["draft", "published"].includes(status)) {
    return { ok: false, message: "Trạng thái không hợp lệ." };
  }

  let slug = str(formData.get("slug")) || slugify(title);
  if (!slug) return { ok: false, message: "Không tạo được slug từ tiêu đề." };

  // Tránh trùng slug với bài khác
  let check = supabase.from("posts").select("id").eq("slug", slug);
  check = id ? check.neq("id", id) : check;
  const { data: dup } = await check.limit(1);
  if (dup?.length) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  // Ảnh bìa: bài cũ giữ nguyên cover → bỏ qua tải lại.
  const rawCover = str(formData.get("cover_url"), 2000);
  let existingCover: string | null = null;
  if (id) {
    const { data: current } = await supabase
      .from("posts")
      .select("cover_url")
      .eq("id", id)
      .maybeSingle();
    existingCover = (current?.cover_url as string | null) ?? null;
  }

  let coverUrl: string | null;
  if (rawCover && rawCover === existingCover) {
    coverUrl = existingCover;
  } else {
    const cover = await rehostCover(rawCover, user.id);
    if (cover.error) return { ok: false, message: cover.error };
    coverUrl = cover.url;
  }

  const row = {
    slug,
    title,
    excerpt: str(formData.get("excerpt"), 220) || null,
    content_html: contentHtml,
    content_md: null,
    cover_url: coverUrl,
    category,
    status,
    is_featured: bool(formData.get("is_featured")),
    meta_title: str(formData.get("meta_title"), 180) || null,
    meta_description: str(formData.get("meta_description"), 320) || null,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { data: existing } = await supabase
      .from("posts")
      .select("published_at")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabase
      .from("posts")
      .update({
        ...row,
        published_at:
          status === "published"
            ? (existing?.published_at ?? new Date().toISOString())
            : null,
      })
      .eq("id", id);
    if (error) return { ok: false, message: `Lỗi khi cập nhật: ${error.message}` };
  } else {
    const { error } = await supabase
      .from("posts")
      .insert({
        ...row,
        author_id: user.id,
        created_at: new Date().toISOString(),
        published_at: status === "published" ? new Date().toISOString() : null,
      });
    if (error) return { ok: false, message: `Lỗi khi tạo bài: ${error.message}` };
  }

  revalidatePublic();
  return { ok: true, message: status === "published" ? "Đã xuất bản bài viết." : "Đã lưu nháp." };
}

export async function deletePost(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const id = str(formData.get("id"));
  const backPath = back(str(formData.get("back")) || "/admin/bai-viet");
  return run(async () => {
    try {
    await requireRole(["admin"]);
  } catch (e) {
    guard(e, backPath);
  }
  await assertWritable(backPath);

  const err = await remove("posts", id);
  if (err) fail(backPath, `Không xoá được: ${err}`);

  revalidatePublic();
    flash(backPath, "Đã xoá bài viết.");
  });
}

/* ------------------------------------------------------------------ *
 * Dịch vụ / Đối tác / Đội ngũ
 * ------------------------------------------------------------------ */

export async function saveService(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const id = str(formData.get("id"));
  return run(async () => {
    try {
      await requireRole(["admin"]);
    } catch (e) {
      guard(e, "/admin/dich-vu");
    }
    await assertWritable("/admin/dich-vu");

    const title = str(formData.get("title"), 300);
    if (!title) fail("/admin/dich-vu", "Vui lòng nhập tên dịch vụ.");

    const row = {
      title,
      slug: str(formData.get("slug")) || slugify(title),
      description: str(formData.get("description"), 500) || null,
      icon: str(formData.get("icon"), 60) || null,
      color: str(formData.get("color"), 20) || null,
      sort_order: num(formData.get("sort_order"), 0),
      is_active: bool(formData.get("is_active")),
      ...(id ? { id } : {}),
    };

    const err = await write("services", row, { onConflict: "id" });
    if (err) fail("/admin/dich-vu", `Không lưu được: ${err}`);

    revalidatePublic();
    flash("/admin/dich-vu", id ? "Đã cập nhật dịch vụ." : "Đã thêm dịch vụ.");
  });
}

export async function deleteService(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  return run(async () => {
    try {
    await requireRole(["admin"]);
  } catch (e) {
    guard(e, "/admin/dich-vu");
  }
  await assertWritable("/admin/dich-vu");
  const err = await remove("services", str(formData.get("id")));
  if (err) fail("/admin/dich-vu", `Không xoá được: ${err}`);
  revalidatePublic();
    flash("/admin/dich-vu", "Đã xoá dịch vụ.");
  });
}

export async function savePartner(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const id = str(formData.get("id"));
  return run(async () => {
    try {
      await requireRole(["admin"]);
    } catch (e) {
      guard(e, "/admin/doi-tac");
    }
    await assertWritable("/admin/doi-tac");

    const group = str(formData.get("group"), 60);

    const name = str(formData.get("name"), 200);
    if (!name) fail("/admin/doi-tac", "Vui lòng nhập tên đối tác.");
    if (!group) fail("/admin/doi-tac", "Vui lòng chọn nhóm đối tác.");

    // Nhóm phải tồn tại trong partner_groups (bỏ qua nếu bảng chưa có — chưa chạy migration)
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("partner_groups")
        .select("key")
        .eq("key", group)
        .limit(1);
      if (!error && (!data || data.length === 0)) {
        fail("/admin/doi-tac", "Nhóm đối tác không tồn tại. Hãy chọn nhóm khác.");
      }
    }

    const row = {
      name,
      group,
      logo_url: str(formData.get("logo_url"), 2000) || null,
      website_url: str(formData.get("website_url"), 2000) || null,
      sort_order: num(formData.get("sort_order"), 0),
      is_active: bool(formData.get("is_active")),
      ...(id ? { id } : {}),
    };

    const err = await write("partners", row, { onConflict: "id" });
    if (err) fail("/admin/doi-tac", `Không lưu được: ${err}`);

    revalidatePublic();
    flash("/admin/doi-tac", id ? "Đã cập nhật đối tác." : "Đã thêm đối tác.");
  });
}

export async function deletePartner(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const keep = { nhom: str(formData.get("nhom"), 60) };
  return run(async () => {
    try {
    await requireRole(["admin"]);
  } catch (e) {
    guard(e, "/admin/doi-tac");
  }
  await assertWritable("/admin/doi-tac");
  const err = await remove("partners", str(formData.get("id")));
  if (err) fail("/admin/doi-tac", `Không xoá được: ${err}`, keep);
  revalidatePublic();
    flash("/admin/doi-tac", "Đã xoá đối tác.", false, keep);
  });
}

export async function savePartnerGroup(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const path = "/admin/doi-tac";
  const original = str(formData.get("original"), 60);
  return run(async () => {
    try {
      await requireRole(["admin"]);
    } catch (e) {
      guard(e, path);
    }
    await assertWritable(path);

    const label = str(formData.get("label"), 100);
    const title = str(formData.get("title"), 200);
    if (!label) fail(path, "Vui lòng nhập tên nhóm.");
    if (!title) fail(path, "Vui lòng nhập tiêu đề hiển thị ở trang khách.");

    // Khóa kỹ thuật: tự sinh khi thêm, giữ nguyên khi sửa (đối tác đang gắn khóa cũ)
    const key = original || slugify(label).slice(0, 60);
    if (!key) fail(path, "Không tạo được khóa nhóm từ tên. Hãy dùng tên có chữ cái.");

    const row = {
      label,
      title,
      subtitle: str(formData.get("subtitle"), 200) || null,
      sort_order: num(formData.get("sort_order"), 0),
      is_active: bool(formData.get("is_active")),
    };

    const supabase = await createClient();
    if (!supabase) fail(path, "Chưa cấu hình Supabase (thiếu .env.local).");

    const { error } = original
      ? await supabase.from("partner_groups").update(row).eq("key", original)
      : await supabase.from("partner_groups").insert({ key, ...row });

    if (error) {
      fail(
        path,
        error.code === "23505"
          ? "Tên nhóm đã tồn tại (khóa trùng). Hãy đổi tên nhóm khác."
          : `Không lưu được: ${error.message}`,
      );
    }

    revalidatePublic();
    flash(path, original ? "Đã cập nhật nhóm đối tác." : "Đã thêm nhóm đối tác.");
  });
}

export async function deletePartnerGroup(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const path = "/admin/doi-tac";
  return run(async () => {
    try {
    await requireRole(["admin"]);
  } catch (e) {
    guard(e, path);
  }
  await assertWritable(path);

  const key = str(formData.get("key"), 60);
  if (!key) fail(path, "Thiếu khóa nhóm.");

  const supabase = await createClient();
  if (!supabase) fail(path, "Chưa cấu hình Supabase (thiếu .env.local).");

  const { count, error: countErr } = await supabase
    .from("partners")
    .select("id", { count: "exact", head: true })
    .eq("group", key);
  if (countErr) {
    fail(path, `Không kiểm tra được nhóm: ${countErr.message}`, { nhom: key });
  }
  if (count) {
    fail(
      path,
      `Nhóm này còn ${count} đối tác. Hãy chuyển đối tác sang nhóm khác trước khi xoá.`,
      { nhom: key },
    );
  }

  const { error } = await supabase.from("partner_groups").delete().eq("key", key);
  if (error) fail(path, `Không xoá được: ${error.message}`, { nhom: key });

  revalidatePublic();
    flash(path, "Đã xoá nhóm đối tác.");
  });
}

export async function saveTeamMember(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const id = str(formData.get("id"));
  return run(async () => {
    try {
      await requireRole(["admin"]);
    } catch (e) {
      guard(e, "/admin/doi-ngu");
    }
    await assertWritable("/admin/doi-ngu");

    const full_name = str(formData.get("full_name"), 150);
    if (!full_name) fail("/admin/doi-ngu", "Vui lòng nhập họ tên.");

    const row = {
      full_name,
      position: str(formData.get("position"), 150) || null,
      avatar_url: str(formData.get("avatar_url"), 2000) || null,
      bio: str(formData.get("bio"), 600) || null,
      sort_order: num(formData.get("sort_order"), 0),
      is_active: bool(formData.get("is_active")),
      ...(id ? { id } : {}),
    };

    const err = await write("team_members", row, { onConflict: "id" });
    if (err) fail("/admin/doi-ngu", `Không lưu được: ${err}`);

    revalidatePublic();
    flash("/admin/doi-ngu", id ? "Đã cập nhật thành viên." : "Đã thêm thành viên.");
  });
}

export async function deleteTeamMember(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  return run(async () => {
    try {
    await requireRole(["admin"]);
  } catch (e) {
    guard(e, "/admin/doi-ngu");
  }
  await assertWritable("/admin/doi-ngu");
  const err = await remove("team_members", str(formData.get("id")));
  if (err) fail("/admin/doi-ngu", `Không xoá được: ${err}`);
  revalidatePublic();
    flash("/admin/doi-ngu", "Đã xoá thành viên.");
  });
}

/* ------------------------------------------------------------------ *
 * Nội dung tĩnh & giao diện
 * ------------------------------------------------------------------ */

/** Ghi setting và trả kết quả để client (toast.promise) hiển thị. */
async function saveSetting(key: string, value: unknown): Promise<ActionState> {
  const err = await write(
    "site_settings",
    { key, value, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );
  if (err) return { ok: false, message: `Không lưu được: ${err}` };
  revalidatePublic();
  return { ok: true, message: "Đã lưu thay đổi." };
}

function parseJson(raw: string, path: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return fail(path, "Dữ liệu gửi lên không hợp lệ.");
  }
}

export async function saveContentSection(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  return run(async () => {
    try {
      await requireRole(["admin"]);
    } catch (e) {
      guard(e, "/admin/noi-dung");
    }
    await assertWritable("/admin/noi-dung");

    const section = str(formData.get("section"));
    const payload = str(formData.get("payload"));
    const value = parseJson(payload, "/admin/noi-dung");

    const allowed = ["header", "hero", "about", "vision", "mission", "values", "contact", "map", "footer", "seo"];
    if (!allowed.includes(section)) fail("/admin/noi-dung", "Phần nội dung không hợp lệ.");

    const result = await saveSetting(section, value);
    if (!result.ok) fail("/admin/noi-dung", result.message ?? "Không lưu được.");
    flash("/admin/noi-dung", result.message ?? "Đã lưu thay đổi.");
  });
}

export async function saveTheme(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  return safeAction("lưu giao diện", () => saveThemeInner(formData));
}

async function saveThemeInner(formData: FormData): Promise<ActionState> {
  try {
    await requireRole(["admin"]);
  } catch (e) {
    return { ok: false, message: authMessage(e) };
  }
  const quota = await quotaBlock();
  if (quota) return quota;

  const draft = {
    primary: str(formData.get("primary")),
    dark: str(formData.get("dark")),
    ink: str(formData.get("ink")),
    surface: str(formData.get("surface")),
    muted: str(formData.get("muted")),
    accent: str(formData.get("accent")),
    line: str(formData.get("line")),
    radius: num(formData.get("radius"), 16),
    fontScale: num(formData.get("fontScale"), 1),
  };

  const theme = normalizeTheme(draft);
  return saveSetting("theme", theme satisfies Theme);
}

export async function saveBrand(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  return safeAction("lưu thương hiệu", () => saveBrandInner(formData));
}

async function saveBrandInner(formData: FormData): Promise<ActionState> {
  try {
    await requireRole(["admin"]);
  } catch (e) {
    return { ok: false, message: authMessage(e) };
  }
  const quota = await quotaBlock();
  if (quota) return quota;

  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, message: "Thiếu SUPABASE_SECRET_KEY trong .env.local nên không upload được ảnh." };
  }

  const current = normalizeBrand((await getSettings()).brand);

  // Bước 1: đọc & hợp lệ hoá cả 4 trường (chưa upload gì cả).
  const plan: { field: (typeof BRAND_FIELDS)[number]; file: File | null; value: string | null }[] = [];
  for (const field of BRAND_FIELDS) {
    const fileValue = formData.get(`${field}File`);
    const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
    if (file) {
      const err = validateBrandImageFile(file);
      const name =
        field === "logoWide"
          ? "logo dài"
          : field === "logoSquare"
            ? "logo vuông"
            : field === "faviconLight"
              ? "favicon sáng"
              : "favicon tối";
      if (err) return { ok: false, message: `Ảnh ${name}: ${err}` };
    }
    const clear = bool(formData.get(`${field}Clear`));
    const url = str(formData.get(`${field}Url`), 2000);

    let value: string | null;
    if (file) {
      value = "pending"; // sẽ gán URL thật sau khi upload
    } else if (clear) {
      value = null;
    } else if (url.trim()) {
      value = brandImageUrl(url);
      if (!value) {
        return { ok: false, message: "Ảnh phải là link http/https hoặc đường dẫn bắt đầu bằng /." };
      }
    } else {
      value = null;
    }
    plan.push({ field, file, value });
  }

  // Bước 2: upload (nếu có file).
  const uploaded: string[] = [];
  const next: Brand = { ...current };
  for (const item of plan) {
    if (!item.file || !item.value) continue;
    const key = brandPath(item.field, item.file.name);
    const { error: up } = await admin.storage
      .from("site-assets")
      .upload(key, item.file, { cacheControl: "3600", upsert: false });
    if (up) {
      for (const k of uploaded) await admin.storage.from("site-assets").remove([k]);
      return { ok: false, message: `Không upload được ảnh: ${up.message}` };
    }
    uploaded.push(key);
    const { data: pub } = admin.storage.from("site-assets").getPublicUrl(key);
    item.value = pub.publicUrl;
  }
  for (const item of plan) next[item.field] = item.value;

  // Bước 3: dọn object cũ trong site-assets khi bị thay/bỏ.
  const stale = BRAND_FIELDS.filter((f) => {
    const old = current[f];
    return old && old !== next[f] && storagePathFromPublicUrl(old);
  });
  if (stale.length) {
    const keys = stale
      .map((f) => storagePathFromPublicUrl(current[f] as string))
      .filter((k): k is string => !!k);
    await admin.storage.from("site-assets").remove(keys);
  }

  return saveSetting("brand", next);
}

/* ------------------------------------------------------------------ *
 * Màn hình chờ (Loader)
 * ------------------------------------------------------------------ */

export async function saveLoader(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  return safeAction("lưu màn hình chờ", () => saveLoaderInner(formData));
}

async function saveLoaderInner(formData: FormData): Promise<ActionState> {
  try {
    await requireRole(["admin"]);
  } catch (e) {
    return { ok: false, message: authMessage(e) };
  }
  const quota = await quotaBlock();
  if (quota) return quota;

  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, message: "Thiếu SUPABASE_SECRET_KEY trong .env.local nên không upload được ảnh." };
  }

  const current = normalizeLoader((await getSettings()).loader);

  const fileValue = formData.get("imageFile");
  const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
  if (file) {
    const err = validateLoaderFile(file);
    if (err) return { ok: false, message: `Ảnh loader: ${err}` };
  }

  const clear = bool(formData.get("clearImage"));
  const url = str(formData.get("imageUrl"), 2000);

  let pendingUpload = false;
  let imageUrl: string | null;
  if (file) {
    imageUrl = null;
    pendingUpload = true;
  } else if (clear) {
    imageUrl = null;
  } else if (url.trim()) {
    imageUrl = loaderImageUrl(url);
    if (!imageUrl) {
      return { ok: false, message: "Ảnh phải là link http/https hoặc đường dẫn bắt đầu bằng /." };
    }
  } else {
    imageUrl = current.imageUrl;
  }

  const bg = str(formData.get("background"));
  const background =
    bool(formData.get("customBackground")) && /^#[0-9a-fA-F]{6}$/.test(bg.trim())
      ? bg.trim()
      : null;

  const next: LoaderConfig = {
    enabled: bool(formData.get("enabled")),
    imageUrl,
    background,
    minDurationMs: Math.min(5000, Math.max(0, num(formData.get("minDurationMs"), 600))),
    oncePerSession: bool(formData.get("oncePerSession")),
    showText: bool(formData.get("showText")),
    text: str(formData.get("text"), 120).replace(/\s+/g, " ").trim(),
  };

  // Upload ảnh mới (nếu có). Lỗi thì dừng, chưa ghi setting.
  if (file && pendingUpload) {
    const key = loaderPath(file.name);
    const { error: up } = await admin.storage
      .from("site-assets")
      .upload(key, file, { cacheControl: "3600", upsert: false });
    if (up) return { ok: false, message: `Không upload được ảnh: ${up.message}` };
    const { data: pub } = admin.storage.from("site-assets").getPublicUrl(key);
    next.imageUrl = pub.publicUrl;
  }

  // Dọn object cũ trong site-assets khi bị thay hoặc bỏ.
  const oldUrl = current.imageUrl;
  if (oldUrl && oldUrl !== next.imageUrl) {
    const oldKey = storagePathFromPublicUrl(oldUrl);
    if (oldKey) await admin.storage.from("site-assets").remove([oldKey]);
  }

  return saveSetting("loader", next);
}

/* ------------------------------------------------------------------ *
 * Thông báo toast
 * ------------------------------------------------------------------ */

export async function saveToast(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  try {
    await requireRole(["admin"]);
  } catch (e) {
    return { ok: false, message: authMessage(e) };
  }
  const quota = await quotaBlock();
  if (quota) return quota;

  const posRaw = str(formData.get("position"));
  const position = (TOAST_POSITIONS.map((p) => p.value) as string[]).includes(posRaw)
    ? (posRaw as ToastPosition)
    : "top-right";

  const next: ToastConfig = normalizeToast({
    position,
    enabled: bool(formData.get("enabled")),
    successDurationMs: num(formData.get("successDurationMs"), 4000),
    errorDurationMs: num(formData.get("errorDurationMs"), 5000),
  });

  return saveSetting("toast", next);
}

/* ------------------------------------------------------------------ *
 * Slider banner trang chủ
 * ------------------------------------------------------------------ */

/** Đường dẫn object trong bucket site-assets: slides/<ts>-<ten>. */
function slideUploadPath(fileName: string): string {
  const safe =
    fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .slice(-60) || "image";
  return `slides/${Date.now()}-${safe}`;
}

export async function saveHeroSlide(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const path = "/admin/slider";
  const id = str(formData.get("id"));
  return run(async () => {
    try {
      await requireRole(["admin"]);
    } catch (e) {
      guard(e, path);
    }
    await assertWritable(path);

    const alt = str(formData.get("alt"), 300);
    const sort_order = num(formData.get("sort_order"), 0);
    const is_active = bool(formData.get("is_active"));

    const fileValue = formData.get("image_file");
    const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
    const url = brandImageUrl(str(formData.get("image_url"), 2000));

    let imageUrl: string | null = null;
    let uploadedKey: string | null = null;
    if (file) {
      const err = validateBrandImageFile(file);
      if (err) fail(path, err);
      const admin = createAdminClient();
      if (!admin) fail(path, "Thiếu SUPABASE_SECRET_KEY trong .env.local nên không upload được ảnh.");
      const key = slideUploadPath(file.name);
      const { error: up } = await admin.storage
        .from("site-assets")
        .upload(key, file, { cacheControl: "3600", upsert: false });
      if (up) fail(path, `Không upload được ảnh: ${up.message}`);
      uploadedKey = key;
      const { data: pub } = admin.storage.from("site-assets").getPublicUrl(key);
      imageUrl = pub.publicUrl;
    } else if (url) {
      imageUrl = url;
    }
    if (!imageUrl) fail(path, "Vui lòng chọn file ảnh hoặc nhập URL ảnh.");

    // Ảnh cũ (nếu là object trong site-assets) sẽ bị dọn sau khi lưu thành công.
    let oldKey: string | null = null;
    if (id) {
      const supabase = await createClient();
      if (supabase) {
        const { data: old } = await supabase
          .from("hero_slides")
          .select("image_url")
          .eq("id", id)
          .maybeSingle();
        const oldUrl = old?.image_url;
        if (typeof oldUrl === "string" && oldUrl && oldUrl !== imageUrl) {
          oldKey = storagePathFromPublicUrl(oldUrl);
        }
      }
    }

    const row = {
      image_url: imageUrl,
      alt: alt || null,
      sort_order,
      is_active,
      ...(id ? { id } : {}),
    };
    const err = await write("hero_slides", row, { onConflict: "id" });
    if (err) {
      if (uploadedKey) await createAdminClient()?.storage.from("site-assets").remove([uploadedKey]);
      fail(path, `Không lưu được: ${err}`);
    }

    if (oldKey) await createAdminClient()?.storage.from("site-assets").remove([oldKey]);

    revalidatePublic();
    flash(path, id ? "Đã cập nhật slide." : "Đã thêm slide.");
  });
}

export async function deleteHeroSlide(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const path = "/admin/slider";
  const id = str(formData.get("id"));
  return run(async () => {
    try {
    await requireRole(["admin"]);
  } catch (e) {
    guard(e, path);
  }
  await assertWritable(path);

  const supabase = await createClient();
  if (supabase) {
    const { data: row } = await supabase
      .from("hero_slides")
      .select("image_url")
      .eq("id", id)
      .maybeSingle();
    const key =
      typeof row?.image_url === "string"
        ? storagePathFromPublicUrl(row.image_url)
        : null;
    if (key) await createAdminClient()?.storage.from("site-assets").remove([key]);
  }

  const err = await remove("hero_slides", id);
  if (err) fail(path, `Không xoá được: ${err}`);
  revalidatePublic();
    flash(path, "Đã xoá slide.");
  });
}

/* ------------------------------------------------------------------ *
 * Quản lý ảnh
 * ------------------------------------------------------------------ */

export async function saveMediaMeta(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const id = str(formData.get("id"));
  const path = str(formData.get("back")) || "/admin/anh";
  return run(async () => {
    const user = await requireRole(["admin", "editor"]).catch((e) => guard(e, path));
    await assertWritable(path);

    const isAdmin = user.profile?.role === "admin";
    const alt = str(formData.get("alt"), 300);
    const kind = str(formData.get("kind"), 30);

    const row: Record<string, unknown> = { alt: alt || null };
    // Chỉ admin đổi được loại ảnh (banner/logo/trang trí)
    if (kind && isAdmin) row.kind = kind;
    if (id) row.id = id;

    const err = await write("media", row, { onConflict: "id" });
    if (err) fail(path, `Không lưu được: ${err}`);

    revalidatePath("/admin/anh");
    flash(path, "Đã cập nhật ảnh.");
  });
}

export async function deleteMedia(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const backPath = back(str(formData.get("back")) || "/admin/anh");
  return run(async () => {
    try {
    await requireRole(["admin"]);
  } catch (e) {
    guard(e, backPath);
  }
  await assertWritable(backPath);

  const id = str(formData.get("id"));
  const storagePath = str(formData.get("storage_path"));

  const supabase = await createClient();
  if (!supabase) fail(backPath, "Chưa cấu hình Supabase (thiếu .env.local).");

  if (storagePath) {
    await supabase.storage.from("site-assets").remove([storagePath]);
  }
  const { error } = await supabase.from("media").delete().eq("id", id);
  if (error) fail(backPath, `Không xoá được: ${error.message}`);

  revalidatePath("/admin/anh");
    flash(backPath, "Đã xoá ảnh.");
  });
}

/* ------------------------------------------------------------------ *
 * Lưu trữ (đọc/ dọn tệp trong bucket site-assets)
 * ------------------------------------------------------------------ */

/**
 * Xoá tệp khỏi bucket theo path. Chỉ cho phép tệp mồ côi; tệp đang dùng phải
 * bật `force` (đã cảnh báo ở giao diện). Kiểm tra lại ngay trước khi xoá để
 * tránh xoá nhầm tệp vừa được dùng lại.
 */
export async function deleteStorageFiles(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const path = "/admin/luu-tru";
  return safeAction("xoá tệp lưu trữ", () =>
    run(async () => {
      try {
        await requireRole(["admin"]);
      } catch (e) {
        guard(e, path);
      }
      await assertWritable(path);

      const admin = createAdminClient();
      if (!admin) fail(path, "Chưa cấu hình Supabase (thiếu SUPABASE_SECRET_KEY).");

      const paths = str(formData.get("paths"), 40_000)
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 200);
      if (!paths.length) fail(path, "Không có tệp nào để xoá.");

      const force = bool(formData.get("force"));

      const used = await collectUsedPaths(admin);
      const blocked = paths.filter((p) => used.has(p));
      if (blocked.length && !force) {
        fail(
          path,
          `Có ${blocked.length} tệp đang được sử dụng. Bỏ chọn chúng hoặc xác nhận vẫn xoá.`,
        );
      }

      const { error } = await admin.storage.from(SITE_ASSETS_BUCKET).remove(paths);
      if (error) fail(path, `Không xoá được tệp: ${error.message}`);

      // Dọn dòng thư viện ảnh trỏ tới tệp vừa xoá để không còn liên kết hỏng.
      const { error: dbErr } = await admin.from("media").delete().in("storage_path", paths);
      if (dbErr) console.error("[admin:xoá-tệp-dọn-media]", dbErr);

      revalidatePath("/admin/luu-tru");
      revalidatePath("/admin/anh");
      flash(path, `Đã xoá ${paths.length} tệp khỏi kho lưu trữ.`);
    }),
  );
}

/* ------------------------------------------------------------------ *
 * Câu hỏi liên hệ & Newsletter
 * ------------------------------------------------------------------ */

export async function updateContactStatus(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const path = "/admin/cau-hoi";
  return run(async () => {
    try {
      await requireRole(["admin", "editor", "collaborator"]);
    } catch (e) {
      guard(e, path);
    }
    await assertWritable(path);

    const id = str(formData.get("id"));
    const status = str(formData.get("status")) as ContactStatus;
    if (!["new", "replied", "archived"].includes(status)) fail(path, "Trạng thái không hợp lệ.");

    // collaborator chỉ xem — không cho đổi trạng thái
    const user = await requireRole(["admin", "editor"]).catch((e) => guard(e, path));
    if (!user.profile) fail(path, "Bạn không có quyền thực hiện thao tác này.");

    const err = await write(
      "contact_messages",
      { id, status, handled_by: user.id, updated_at: new Date().toISOString() },
      { onConflict: "id" },
    );
    if (err) fail(path, `Không lưu được: ${err}`);

    revalidatePath("/admin/cau-hoi");
    flash(
      path,
      status === "replied"
        ? "Đã đánh dấu đã trả lời."
        : status === "archived"
          ? "Đã lưu trữ câu hỏi."
          : "Đã chuyển về trạng thái mới.",
    );
  });
}

export async function deleteContactMessage(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const path = "/admin/cau-hoi";
  return run(async () => {
    try {
    await requireRole(["admin"]);
  } catch (e) {
    guard(e, path);
  }
  await assertWritable(path);
  const err = await remove("contact_messages", str(formData.get("id")));
  if (err) fail(path, `Không xoá được: ${err}`);
  revalidatePath("/admin/cau-hoi");
    flash(path, "Đã xoá câu hỏi.");
  });
}

export async function deleteNewsletter(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const path = "/admin/newsletter";
  return run(async () => {
    try {
    await requireRole(["admin"]);
  } catch (e) {
    guard(e, path);
  }
  await assertWritable(path);
  const err = await remove("newsletters", str(formData.get("id")));
  if (err) fail(path, `Không xoá được: ${err}`);
  revalidatePath("/admin/newsletter");
    flash(path, "Đã xoá người đăng ký.");
  });
}

export async function toggleNewsletter(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const path = "/admin/newsletter";
  return run(async () => {
    try {
    await requireRole(["admin"]);
  } catch (e) {
    guard(e, path);
  }
  await assertWritable(path);

  const id = str(formData.get("id"));
  const active = bool(formData.get("is_active")) === false;
  const err = await write(
    "newsletters",
    { id, is_active: active, updated_at: new Date().toISOString() },
    { onConflict: "id" },
  );
  if (err) fail(path, `Không lưu được: ${err}`);

  revalidatePath("/admin/newsletter");
    flash(path, active ? "Đã kích hoạt lại." : "Đã ngừng gửi tin cho email này.");
  });
}

/* ------------------------------------------------------------------ *
 * Tài khoản
 * ------------------------------------------------------------------ */

export async function updateAccountRole(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const path = "/admin/tai-khoan";
  return run(async () => {
    try {
      await requireRole(["admin"]);
    } catch (e) {
      guard(e, path);
    }
    await assertWritable(path);

    const id = str(formData.get("id"));
    const role = str(formData.get("role")) as Role;
    if (!["admin", "editor", "collaborator"].includes(role)) {
      fail(path, "Vai trò không hợp lệ.");
    }

    const supabase = await createClient();
    if (!supabase) fail(path, "Chưa cấu hình Supabase (thiếu .env.local).");

    const { data: admin } = await supabase.auth.getUser();
    if (admin.user?.id === id) {
      fail(path, "Bạn không thể tự đổi vai trò của chính mình.");
    }

    const err = await write(
      "profiles",
      { id, role, updated_at: new Date().toISOString() },
      { onConflict: "id" },
    );
    if (err) fail(path, `Không cập nhật được: ${err}`);

    revalidatePath(path);
    flash(path, "Đã cập nhật vai trò.");
  });
}

export async function toggleAccountActive(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const path = "/admin/tai-khoan";
  return run(async () => {
    try {
    await requireRole(["admin"]);
  } catch (e) {
    guard(e, path);
  }
  await assertWritable(path);

  const id = str(formData.get("id"));
  const active = bool(formData.get("is_active")) === false;

  const supabase = await createClient();
  if (!supabase) fail(path, "Chưa cấu hình Supabase (thiếu .env.local).");

  const { data: admin } = await supabase.auth.getUser();
  if (admin.user?.id === id) fail(path, "Bạn không thể khóa chính tài khoản của mình.");

  const err = await write(
    "profiles",
    { id, is_active: active, updated_at: new Date().toISOString() },
    { onConflict: "id" },
  );
  if (err) fail(path, `Không cập nhật được: ${err}`);

  revalidatePath(path);
    flash(path, active ? "Đã mở khóa tài khoản." : "Đã khóa tài khoản.");
  });
}

/** Cấp/thu quyền quản lý cộng tác (giao việc, duyệt kết quả) cho một tài khoản. */
export async function toggleManageTasks(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const path = "/admin/tai-khoan";
  return run(async () => {
    try {
      await requireRole(["admin"]);
    } catch (e) {
      guard(e, path);
    }
    await assertWritable(path);

    const id = str(formData.get("id"));
    const next = !bool(formData.get("can_manage_tasks"));

    const err = await write(
      "profiles",
      { id, can_manage_tasks: next, updated_at: new Date().toISOString() },
      { onConflict: "id" },
    );
    if (err) fail(path, `Không cập nhật được: ${err}`);

    revalidatePath(path);
    flash(path, next ? "Đã cấp quyền quản lý cộng tác." : "Đã thu quyền quản lý cộng tác.");
  });
}

export async function createAccount(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const path = "/admin/tai-khoan";
  try {
    await requireRole(["admin"]);
  } catch (e) {
    guard(e, path);
  }
  await assertWritable(path);

  const full_name = str(formData.get("full_name"), 150);
  const username = normalizeUsername(str(formData.get("username"), 30));
  const email = str(formData.get("email")).toLowerCase();
  const password = str(formData.get("password"));
  const role = str(formData.get("role")) as Role;

  if (!full_name || !email || !password) {
    return { ok: false, message: "Vui lòng nhập đủ tên, email và mật khẩu tạm." };
  }
  if (!isValidEmail(email)) {
    return { ok: false, message: "Email không hợp lệ." };
  }
  if (password.length < 8) {
    return { ok: false, message: "Mật khẩu tạm phải có ít nhất 8 ký tự." };
  }
  if (!["admin", "editor", "collaborator"].includes(role)) {
    return { ok: false, message: "Vai trò không hợp lệ." };
  }
  const usernameErr = validateUsername(username);
  if (usernameErr) return { ok: false, message: usernameErr };

  // auth.admin.* CHỈ chạy được với service-role key.
  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      message: "Thiếu SUPABASE_SECRET_KEY trong .env.local — không tạo được tài khoản.",
    };
  }

  if (username) {
    const { data: resolved } = await admin.rpc("resolve_login_identifier", {
      p_identifier: username,
    });
    if (typeof resolved === "string") {
      return { ok: false, message: `Tên đăng nhập "${username}" đã được dùng. Hãy chọn tên khác.` };
    }
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (error || !created.user) {
    return {
      ok: false,
      message:
        error?.message?.includes("already")
          ? "Email này đã tồn tại trong hệ thống."
          : `Không tạo được tài khoản: ${error?.message ?? "lỗi không rõ"}`,
    };
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: created.user.id,
    full_name,
    username: username || null,
    email,
    role,
    is_active: true,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    if (profileError.message.includes("username")) {
      return { ok: false, message: "Tên đăng nhập đã tồn tại." };
    }
    if (profileError.message.includes("email")) {
      return { ok: false, message: "Email này đã tồn tại." };
    }
    return { ok: false, message: `Không tạo được hồ sơ: ${profileError.message}` };
  }

  revalidatePath(path);
  return { ok: true, message: `Đã tạo tài khoản ${email}.` };
}

/* ------------------------------------------------------------------ *
 * Tài khoản — hồ sơ / email / mật khẩu
 * ------------------------------------------------------------------ */

/** Admin sửa tài khoản bất kỳ: họ tên, username, email (xác nhận ngay), mật khẩu. */
export async function updateAccountProfile(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const id = str(formData.get("id"));
  const path = id ? `/admin/tai-khoan/${id}` : "/admin/tai-khoan";
  try {
    await requireRole(["admin"]);
  } catch (e) {
    guard(e, path);
  }
  await assertWritable(path);

  const full_name = str(formData.get("full_name"), 150);
  const username = normalizeUsername(str(formData.get("username"), 30));
  const original_username = normalizeUsername(str(formData.get("original_username"), 30));
  const email = str(formData.get("email")).toLowerCase();
  const original_email = str(formData.get("original_email")).toLowerCase();
  const password = str(formData.get("password"));

  if (!id) return { ok: false, message: "Thiếu mã tài khoản." };
  if (!full_name) return { ok: false, message: "Họ tên không được để trống." };
  if (!isValidEmail(email)) return { ok: false, message: "Email không hợp lệ." };
  if (password && password.length < 8) {
    return { ok: false, message: "Mật khẩu mới phải có ít nhất 8 ký tự." };
  }
  const usernameErr = validateUsername(username);
  if (usernameErr) return { ok: false, message: usernameErr };

  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Chưa cấu hình Supabase (thiếu .env.local)." };
  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      message: "Thiếu SUPABASE_SECRET_KEY trong .env.local — không sửa được tài khoản.",
    };
  }

  if (username && username !== original_username) {
    const { data: resolved } = await supabase.rpc("resolve_login_identifier", {
      p_identifier: username,
    });
    if (typeof resolved === "string") {
      return { ok: false, message: `Tên đăng nhập "${username}" đã được dùng. Hãy chọn tên khác.` };
    }
  }

  if (email !== original_email) {
    const { error } = await admin.auth.admin.updateUserById(id, {
      email,
      email_confirm: true,
    });
    if (error) {
      return {
        ok: false,
        message: error.message.includes("already")
          ? "Email này đã tồn tại trong hệ thống."
          : `Không đổi được email: ${error.message}`,
      };
    }
  }

  if (password) {
    const { error } = await admin.auth.admin.updateUserById(id, { password });
    if (error) return { ok: false, message: `Không đổi được mật khẩu: ${error.message}` };
  }

  const err = await write(
    "profiles",
    {
      id,
      full_name,
      username: username || null,
      email,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (err) {
    if (err.includes("username")) return { ok: false, message: "Tên đăng nhập đã tồn tại." };
    if (err.includes("email")) return { ok: false, message: "Email này đã tồn tại." };
    return { ok: false, message: `Không cập nhật được hồ sơ: ${err}` };
  }

  revalidatePath(path);
  revalidatePath("/admin/tai-khoan");
  return {
    ok: true,
    message: password
      ? "Đã lưu tài khoản (kể cả mật khẩu mới)."
      : "Đã lưu tài khoản.",
  };
}

/** Mọi vai trò sửa hồ sơ của chính mình tại /admin/ho-so. */
export async function updateMyProfile(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const path = "/admin/ho-so";
  return run(async () => {
    const supabase = await createClient();
    if (!supabase) fail(path, "Chưa cấu hình Supabase (thiếu .env.local).");

    let me;
    try {
      me = await requireRole(["admin", "editor", "collaborator"]);
    } catch (e) {
      guard(e, path);
    }
    await assertWritable(path);

    const full_name = str(formData.get("full_name"), 150);
    const username = normalizeUsername(str(formData.get("username"), 30));
    const original_username = normalizeUsername(str(formData.get("original_username"), 30));

    if (!full_name) fail(path, "Họ tên không được để trống.");
    const usernameErr = validateUsername(username);
    if (usernameErr) fail(path, usernameErr);

    if (username && username !== original_username) {
      const { data: resolved } = await supabase.rpc("resolve_login_identifier", {
        p_identifier: username,
      });
      if (typeof resolved === "string") {
        fail(path, `Tên đăng nhập "${username}" đã được dùng. Hãy chọn tên khác.`);
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({ full_name, username: username || null })
      .eq("id", me.id);
    if (error) {
      if (error.code === "23505") fail(path, "Tên đăng nhập đã tồn tại.");
      fail(path, `Không cập nhật được hồ sơ: ${error.message}`);
    }

    revalidatePath(path);
    flash(path, "Đã lưu hồ sơ.");
  });
}

/** Đổi email của chính mình — cần bấm link xác nhận trong email mới. */
export async function changeMyEmail(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const path = "/admin/ho-so";
  return run(async () => {
    const supabase = await createClient();
    if (!supabase) fail(path, "Chưa cấu hình Supabase (thiếu .env.local).");

    try {
      await requireRole(["admin", "editor", "collaborator"]);
    } catch (e) {
      guard(e, path);
    }
    await assertWritable(path);

    const email = str(formData.get("email")).toLowerCase();
    if (!isValidEmail(email)) fail(path, "Email không hợp lệ.");

    const { data: au } = await supabase.auth.getUser();
    if (au.user?.email === email) fail(path, "Email mới trùng email hiện tại.");

    const { error } = await supabase.auth.updateUser({ email });
    if (error) fail(path, `Không gửi được yêu cầu đổi email: ${error.message}`);

    flash(
      path,
      `Đã gửi link xác nhận tới ${email}. Bấm link trong email để hoàn tất — vẫn đăng nhập bằng email cũ cho đến khi xác nhận.`,
    );
  });
}

/** Đổi mật khẩu của chính mình. */
export async function changeMyPassword(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const path = "/admin/ho-so";
  return run(async () => {
    const supabase = await createClient();
    if (!supabase) fail(path, "Chưa cấu hình Supabase (thiếu .env.local).");

    try {
      await requireRole(["admin", "editor", "collaborator"]);
    } catch (e) {
      guard(e, path);
    }
    await assertWritable(path);

    const password = str(formData.get("password"));
    const confirm = str(formData.get("confirm"));
    if (password.length < 8) fail(path, "Mật khẩu mới phải có ít nhất 8 ký tự.");
    if (password !== confirm) fail(path, "Mật khẩu nhập lại không khớp.");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) fail(path, `Không đổi được mật khẩu: ${error.message}`);

    flash(path, "Đã đổi mật khẩu.");
  });
}
