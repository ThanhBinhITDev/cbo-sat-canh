import { createAdminClient } from "@/lib/supabase/admin";
import { storagePathFromPublicUrl } from "@/lib/avatar";
import { NOT_CONFIGURED, type AdminError, type AdminResult } from "@/lib/admin/data";

/** Bucket công khai duy nhất của dự án. */
export const SITE_ASSETS_BUCKET = "site-assets";

/** Một chỗ đang dùng tệp (để hiện trong panel chi tiết). */
export type StorageUsage = { label: string; href?: string };

/** Một tệp trong bucket, kèm trạng thái dùng/mồ côi. */
export type StorageFile = {
  path: string;
  name: string;
  /** Thư mục gốc trong bucket: "uploads", "avatars", "slides", "brand"... */
  folder: string;
  size: number;
  createdAt: string | null;
  updatedAt: string | null;
  mime: string | null;
  used: boolean;
  usage: StorageUsage[];
  publicUrl: string;
};

type FileObject = {
  name: string;
  id: string | null;
  created_at: string | null;
  updated_at: string | null;
  metadata: { size?: number | string; mimetype?: string } | null;
};

const MAX_DEPTH = 5;

/** Liệt kê đệ quy mọi object trong bucket (bỏ qua thư mục rỗng). */
async function listObjects(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  prefix = "",
  depth = 0,
): Promise<Omit<StorageFile, "used" | "usage" | "publicUrl" | "folder">[]> {
  if (depth > MAX_DEPTH) return [];

  const { data, error } = await admin.storage
    .from(SITE_ASSETS_BUCKET)
    .list(prefix, { limit: 1000, offset: 0 });
  if (error) throw new Error(error.message);

  const out: Omit<StorageFile, "used" | "usage" | "publicUrl" | "folder">[] = [];
  for (const entry of (data ?? []) as FileObject[]) {
    const full = prefix ? `${prefix}/${entry.name}` : entry.name;
    const isFolder = entry.id === null || entry.metadata === null;
    if (isFolder) {
      out.push(...(await listObjects(admin, full, depth + 1)));
      continue;
    }
    const size = Number(entry.metadata?.size ?? 0);
    out.push({
      path: full,
      name: entry.name,
      size: Number.isFinite(size) ? size : 0,
      createdAt: entry.created_at ?? null,
      updatedAt: entry.updated_at ?? null,
      mime: entry.metadata?.mimetype ?? null,
    });
  }
  return out;
}

/** Thêm một URL/path vào bản đồ "đang dùng". Bỏ qua URL ngoài bucket. */
function mark(
  map: Map<string, StorageUsage[]>,
  raw: unknown,
  usage: StorageUsage,
) {
  if (typeof raw !== "string" || !raw) return;
  const path = storagePathFromPublicUrl(raw);
  if (!path) return;
  const list = map.get(path);
  if (list) {
    if (!list.some((u) => u.label === usage.label)) list.push(usage);
  } else {
    map.set(path, [usage]);
  }
}

const URL_RE = /https?:\/\/[^\s"'<>()]+/g;

/** Quét mọi chuỗi trong một giá trị JSON cấu hình. */
function walkSettings(value: unknown, key: string, map: Map<string, StorageUsage[]>) {
  if (typeof value === "string") {
    const matches = value.match(URL_RE);
    if (matches) for (const m of matches) mark(map, m, { label: `Cấu hình · ${key}`, href: SETTINGS_HREF[key] ?? "/admin/noi-dung" });
    else mark(map, value, { label: `Cấu hình · ${key}`, href: SETTINGS_HREF[key] ?? "/admin/noi-dung" });
    return;
  }
  if (Array.isArray(value)) {
    for (const v of value) walkSettings(v, key, map);
    return;
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value)) walkSettings(v, key, map);
  }
}

const SETTINGS_HREF: Record<string, string> = {
  brand: "/admin/giao-dien",
  loader: "/admin/giao-dien",
  hero: "/admin/noi-dung",
  header: "/admin/noi-dung",
  about: "/admin/noi-dung",
};

/**
 * Quét tất cả nguồn có thể tham chiếu tệp trong bucket và trả về bản đồ
 * path → danh sách nơi đang dùng. Bỏ qua URL ngoài bucket (Drive, CDN khác).
 */
export async function collectUsedPaths(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
): Promise<Map<string, StorageUsage[]>> {
  const map = new Map<string, StorageUsage[]>();

  const [slides, media, partners, posts, profiles, authors, services, team, settings] =
    await Promise.all([
      admin.from("hero_slides").select("id,image_url"),
      admin.from("media").select("id,public_url,storage_path"),
      admin.from("partners").select("name,logo_url"),
      admin.from("posts").select("id,title,cover_url,content_html"),
      admin.from("profiles").select("full_name,avatar_url"),
      admin.from("public_authors").select("full_name,avatar_url"),
      admin.from("services").select("title,icon"),
      admin.from("team_members").select("full_name,avatar_url"),
      admin.from("site_settings").select("key,value"),
    ]);

  for (const row of (slides.data ?? []) as { image_url: string | null }[]) {
    mark(map, row.image_url, { label: "Slider trang chủ", href: "/admin/slider" });
  }

  for (const row of (media.data ?? []) as {
    public_url: string | null;
    storage_path: string | null;
  }[]) {
    const usage: StorageUsage = { label: "Thư viện ảnh", href: "/admin/anh" };
    mark(map, row.public_url, usage);
    if (row.storage_path) mark(map, row.storage_path, usage);
  }

  for (const row of (partners.data ?? []) as {
    name: string | null;
    logo_url: string | null;
  }[]) {
    mark(map, row.logo_url, {
      label: `Đối tác · ${row.name ?? "?"}`,
      href: "/admin/doi-tac",
    });
  }

  for (const row of (posts.data ?? []) as {
    id: string;
    title: string | null;
    cover_url: string | null;
    content_html: string | null;
  }[]) {
    const href = `/admin/bai-viet/${row.id}`;
    const title = row.title ?? "(không tiêu đề)";
    mark(map, row.cover_url, { label: `Ảnh bìa · ${title}`, href });
    if (row.content_html) {
      const matches = row.content_html.match(URL_RE);
      if (matches) {
        for (const m of matches) {
          mark(map, m, { label: `Trong bài · ${title}`, href });
        }
      }
    }
  }

  for (const row of (profiles.data ?? []) as {
    full_name: string | null;
    avatar_url: string | null;
  }[]) {
    mark(map, row.avatar_url, {
      label: `Tài khoản · ${row.full_name ?? "?"}`,
      href: "/admin/tai-khoan",
    });
  }

  for (const row of (authors.data ?? []) as {
    full_name: string | null;
    avatar_url: string | null;
  }[]) {
    mark(map, row.avatar_url, {
      label: `Tác giả · ${row.full_name ?? "?"}`,
      href: "/admin/tai-khoan",
    });
  }

  for (const row of (services.data ?? []) as {
    title: string | null;
    icon: string | null;
  }[]) {
    mark(map, row.icon, {
      label: `Dịch vụ · ${row.title ?? "?"}`,
      href: "/admin/dich-vu",
    });
  }

  for (const row of (team.data ?? []) as {
    full_name: string | null;
    avatar_url: string | null;
  }[]) {
    mark(map, row.avatar_url, {
      label: `Đội ngũ · ${row.full_name ?? "?"}`,
      href: "/admin/doi-ngu",
    });
  }

  for (const row of (settings.data ?? []) as { key: string; value: unknown }[]) {
    walkSettings(row.value, row.key, map);
  }

  return map;
}

function publicUrlFor(admin: NonNullable<ReturnType<typeof createAdminClient>>, path: string) {
  return admin.storage.from(SITE_ASSETS_BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Danh sách tệp trong bucket kèm trạng thái dùng/mồ côi, sắp xếp mới nhất trước.
 * `usedPaths` tùy chọn — truyền vào để tránh quét lại khi đã có bản đồ.
 */
export async function listStorageFiles(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  usedPaths?: Map<string, StorageUsage[]>,
): Promise<StorageFile[]> {
  const [objects, used] = await Promise.all([
    listObjects(admin),
    usedPaths ?? collectUsedPaths(admin),
  ]);

  const rows: StorageFile[] = objects.map((o) => {
    const usage = used.get(o.path) ?? [];
    return {
      ...o,
      folder: o.path.includes("/") ? o.path.slice(0, o.path.indexOf("/")) : "(gốc)",
      used: usage.length > 0,
      usage,
      publicUrl: publicUrlFor(admin, o.path),
    };
  });

  rows.sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta || a.path.localeCompare(b.path);
  });

  return rows;
}

function fail(message: string, detail?: string): AdminError {
  return { ok: false, message, detail };
}

/** Đọc toàn bộ bucket + tham chiếu cho trang quản trị. */
export async function getStorageFiles(): Promise<AdminResult<StorageFile>> {
  const admin = createAdminClient();
  if (!admin) return NOT_CONFIGURED;

  try {
    return { ok: true, rows: await listStorageFiles(admin) };
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return fail("Không đọc được kho lưu trữ.", detail);
  }
}
