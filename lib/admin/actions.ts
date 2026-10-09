"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, AuthError } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getQuotaStatus } from "@/lib/admin/data";
import { quotaState, quotaLockMessage } from "@/lib/admin/quota";
import { invalidateSettingsCache } from "@/lib/settings";
import { slugify } from "@/lib/slug";
import { normalizeTheme, type Theme } from "@/lib/theme";
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

function flash(
  path: string,
  message: string,
  isError = false,
  params: Record<string, string> = {},
): never {
  const q = new URLSearchParams({
    [isError ? "err" : "flash"]: message,
    ...params,
  });
  redirect(`${path}?${q.toString()}`);
}

function fail(path: string, message: string, params?: Record<string, string>): never {
  flash(path, message, true, params);
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
  const contentMd = str(formData.get("content_md"), 200_000);
  const category = str(formData.get("category")) as PostCategory;
  const status = str(formData.get("status")) as PostStatus;

  if (!title) return { ok: false, message: "Vui lòng nhập tiêu đề." };
  if (!contentMd) return { ok: false, message: "Vui lòng nhập nội dung bài viết." };
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

  const row = {
    slug,
    title,
    excerpt: str(formData.get("excerpt"), 220) || null,
    content_md: contentMd,
    cover_url: str(formData.get("cover_url"), 2000) || null,
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

export async function deletePost(formData: FormData) {
  const id = str(formData.get("id"));
  const backPath = back(str(formData.get("back")) || "/admin/bai-viet");

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
}

/* ------------------------------------------------------------------ *
 * Dịch vụ / Đối tác / Đội ngũ
 * ------------------------------------------------------------------ */

export async function saveService(formData: FormData) {
  const id = str(formData.get("id"));
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
}

export async function deleteService(formData: FormData) {
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
}

export async function savePartner(formData: FormData) {
  const id = str(formData.get("id"));
  try {
    await requireRole(["admin"]);
  } catch (e) {
    guard(e, "/admin/doi-tac");
  }
  await assertWritable("/admin/doi-tac");

  const group = str(formData.get("group"), 60);
  const keep = { nhom: group };

  const name = str(formData.get("name"), 200);
  if (!name) fail("/admin/doi-tac", "Vui lòng nhập tên đối tác.", keep);
  if (!group) fail("/admin/doi-tac", "Vui lòng chọn nhóm đối tác.", keep);

  // Nhóm phải tồn tại trong partner_groups (bỏ qua nếu bảng chưa có — chưa chạy migration)
  const supabase = await createClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("partner_groups")
      .select("key")
      .eq("key", group)
      .limit(1);
    if (!error && (!data || data.length === 0)) {
      fail("/admin/doi-tac", "Nhóm đối tác không tồn tại. Hãy chọn nhóm khác.", keep);
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
  if (err) fail("/admin/doi-tac", `Không lưu được: ${err}`, keep);

  revalidatePublic();
  flash(
    "/admin/doi-tac",
    id ? "Đã cập nhật đối tác." : "Đã thêm đối tác.",
    false,
    keep,
  );
}

export async function deletePartner(formData: FormData) {
  const keep = { nhom: str(formData.get("nhom"), 60) };
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
}

export async function savePartnerGroup(formData: FormData) {
  const path = "/admin/doi-tac";
  const original = str(formData.get("original"), 60);
  const keep = { grp: original || "new" };

  try {
    await requireRole(["admin"]);
  } catch (e) {
    guard(e, path);
  }
  await assertWritable(path);

  const label = str(formData.get("label"), 100);
  const title = str(formData.get("title"), 200);
  if (!label) fail(path, "Vui lòng nhập tên nhóm.", keep);
  if (!title) fail(path, "Vui lòng nhập tiêu đề hiển thị ở trang khách.", keep);

  // Khóa kỹ thuật: tự sinh khi thêm, giữ nguyên khi sửa (đối tác đang gắn khóa cũ)
  const key = original || slugify(label).slice(0, 60);
  if (!key) {
    fail(path, "Không tạo được khóa nhóm từ tên. Hãy dùng tên có chữ cái.", {
      grp: "new",
    });
  }

  const row = {
    label,
    title,
    subtitle: str(formData.get("subtitle"), 200) || null,
    sort_order: num(formData.get("sort_order"), 0),
    is_active: bool(formData.get("is_active")),
  };

  const supabase = await createClient();
  if (!supabase) fail(path, "Chưa cấu hình Supabase (thiếu .env.local).", keep);

  const { error } = original
    ? await supabase.from("partner_groups").update(row).eq("key", original)
    : await supabase.from("partner_groups").insert({ key, ...row });

  if (error) {
    fail(
      path,
      error.code === "23505"
        ? "Tên nhóm đã tồn tại (khóa trùng). Hãy đổi tên nhóm khác."
        : `Không lưu được: ${error.message}`,
      keep,
    );
  }

  revalidatePublic();
  flash(
    path,
    original ? "Đã cập nhật nhóm đối tác." : "Đã thêm nhóm đối tác.",
    false,
    { nhom: key },
  );
}

export async function deletePartnerGroup(formData: FormData) {
  const path = "/admin/doi-tac";
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
}

export async function saveTeamMember(formData: FormData) {
  const id = str(formData.get("id"));
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
}

export async function deleteTeamMember(formData: FormData) {
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
}

/* ------------------------------------------------------------------ *
 * Nội dung tĩnh & giao diện
 * ------------------------------------------------------------------ */

async function saveSetting(key: string, value: unknown, path: string) {
  const err = await write(
    "site_settings",
    { key, value, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );
  if (err) fail(path, `Không lưu được: ${err}`);
  revalidatePublic();
  flash(path, "Đã lưu thay đổi.");
}

function parseJson(raw: string, path: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return fail(path, "Dữ liệu gửi lên không hợp lệ.");
  }
}

export async function saveContentSection(formData: FormData) {
  try {
    await requireRole(["admin"]);
  } catch (e) {
    guard(e, "/admin/noi-dung");
  }
  await assertWritable("/admin/noi-dung");

  const section = str(formData.get("section"));
  const payload = str(formData.get("payload"));
  const value = parseJson(payload, "/admin/noi-dung");

  const allowed = ["hero", "about", "vision", "mission", "values", "contact", "map", "footer", "seo"];
  if (!allowed.includes(section)) fail("/admin/noi-dung", "Phần nội dung không hợp lệ.");

  await saveSetting(section, value, "/admin/noi-dung");
}

export async function saveTheme(formData: FormData) {
  try {
    await requireRole(["admin"]);
  } catch (e) {
    guard(e, "/admin/giao-dien");
  }
  await assertWritable("/admin/giao-dien");

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
  await saveSetting("theme", theme satisfies Theme, "/admin/giao-dien");
}

/* ------------------------------------------------------------------ *
 * Quản lý ảnh
 * ------------------------------------------------------------------ */

export async function saveMediaMeta(formData: FormData) {
  const id = str(formData.get("id"));
  const path = str(formData.get("back")) || "/admin/anh";
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
}

export async function deleteMedia(formData: FormData) {
  const backPath = back(str(formData.get("back")) || "/admin/anh");
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
}

/* ------------------------------------------------------------------ *
 * Câu hỏi liên hệ & Newsletter
 * ------------------------------------------------------------------ */

export async function updateContactStatus(formData: FormData) {
  const path = "/admin/cau-hoi";
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
}

export async function deleteContactMessage(formData: FormData) {
  const path = "/admin/cau-hoi";
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
}

export async function deleteNewsletter(formData: FormData) {
  const path = "/admin/newsletter";
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
}

export async function toggleNewsletter(formData: FormData) {
  const path = "/admin/newsletter";
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
}

/* ------------------------------------------------------------------ *
 * Tài khoản
 * ------------------------------------------------------------------ */

export async function updateAccountRole(formData: FormData) {
  const path = "/admin/tai-khoan";
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
}

export async function toggleAccountActive(formData: FormData) {
  const path = "/admin/tai-khoan";
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

  const full_name = str(formData.get("full_name"));
  const email = str(formData.get("email")).toLowerCase();
  const password = str(formData.get("password"));
  const role = str(formData.get("role")) as Role;

  if (!full_name || !email || !password) {
    return { ok: false, message: "Vui lòng nhập đủ tên, email và mật khẩu tạm." };
  }
  if (password.length < 8) {
    return { ok: false, message: "Mật khẩu tạm phải có ít nhất 8 ký tự." };
  }
  if (!["admin", "editor", "collaborator"].includes(role)) {
    return { ok: false, message: "Vai trò không hợp lệ." };
  }

  const admin = await createClient();
  if (!admin) return { ok: false, message: "Chưa cấu hình Supabase (thiếu .env.local)." };

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
    email,
    role,
    is_active: true,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { ok: false, message: `Không tạo được hồ sơ: ${profileError.message}` };
  }

  revalidatePath(path);
  return { ok: true, message: `Đã tạo tài khoản ${email}.` };
}
