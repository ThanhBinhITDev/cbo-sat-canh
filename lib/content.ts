import { createClient } from "@/lib/supabase/server";
import type { Partner, PartnerGroup, Post, Service, TeamMember } from "@/lib/types";

/* ------------------------------------------------------------------ *
 * Dữ liệu mặc định khi chưa kết nối Supabase.
 * ------------------------------------------------------------------ */

export const DEFAULT_SERVICES: Service[] = [
  {
    id: "svc-test",
    title: "Xét nghiệm nhanh HIV/STIs",
    slug: "xet-nghiem-nhanh-hiv-stis",
    description:
      "Xét nghiệm nhanh, bảo mật và miễn phí tại cộng đồng — cho kết quả trong vài phút với sự tư vấn tận tâm.",
    icon: "test-tube",
    color: "#279CD7",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "svc-prep",
    title: "Dự phòng trước phơi nhiễm HIV (PrEP)",
    slug: "prep",
    description:
      "Tư vấn và cấp thuốc PrEP giúp giảm nguy cơ lây nhiễm HIV, bảo vệ bạn và người thân.",
    icon: "shield-check",
    color: "#1C4592",
    sort_order: 2,
    is_active: true,
  },
  {
    id: "svc-pep",
    title: "Dự phòng sau phơi nhiễm HIV (PEP)",
    slug: "pep",
    description:
      "Can thiệp khẩn cấp trong vòng 72 giờ sau phơi nhiễm — hãy gọi ngay cho chúng tôi.",
    icon: "clock-alert",
    color: "#EF4444",
    sort_order: 3,
    is_active: true,
  },
  {
    id: "svc-arv",
    title: "Chuyển gửi điều trị HIV (ARV)",
    slug: "chuyen-gui-dieu-tri-arv",
    description:
      "Kết nối bạn đến cơ sở điều trị ARV uy tín, đồng hành cùng bạn trong suốt lộ trình điều trị.",
    icon: "heart-pulse",
    color: "#10B981",
    sort_order: 4,
    is_active: true,
  },
];

export const DEFAULT_PARTNERS: Partner[] = [
  { id: "p1", name: "Đối tác chiến lược 1", group: "strategic", logo_url: null, website_url: null, sort_order: 1, is_active: true },
  { id: "p2", name: "Đối tác chiến lược 2", group: "strategic", logo_url: null, website_url: null, sort_order: 2, is_active: true },
  { id: "p3", name: "Đối tác chiến lược 3", group: "strategic", logo_url: null, website_url: null, sort_order: 3, is_active: true },
  { id: "p4", name: "Đối tác chiến lược 4", group: "strategic", logo_url: null, website_url: null, sort_order: 4, is_active: true },
  { id: "p5", name: "Đối tác chiến lược 5", group: "strategic", logo_url: null, website_url: null, sort_order: 5, is_active: true },
  { id: "p6", name: "Đối tác chiến lược 6", group: "strategic", logo_url: null, website_url: null, sort_order: 6, is_active: true },
  { id: "p7", name: "Phòng khám Nhà Mình 1", group: "clinic", logo_url: null, website_url: null, sort_order: 1, is_active: true },
  { id: "p8", name: "Phòng khám Nhà Mình 2", group: "clinic", logo_url: null, website_url: null, sort_order: 2, is_active: true },
  { id: "p9", name: "Phòng khám Nhà Mình 3", group: "clinic", logo_url: null, website_url: null, sort_order: 3, is_active: true },
  {
    id: "p10",
    name: "Mạng lưới CBO Đồng bằng Sông Cửu Long",
    group: "network",
    logo_url: null,
    website_url: null,
    sort_order: 1,
    is_active: true,
  },
];

export const DEFAULT_PARTNER_GROUPS: PartnerGroup[] = [
  {
    key: "strategic",
    label: "Đối tác chiến lược",
    title: "Đối tác chiến lược chính",
    subtitle: "Nền tảng thành công của CBO SÁT CÁNH",
    sort_order: 1,
    is_active: true,
  },
  {
    key: "clinic",
    label: "Phòng khám",
    title: "Phòng khám Nhà Mình",
    subtitle: null,
    sort_order: 2,
    is_active: true,
  },
  {
    key: "network",
    label: "Mạng lưới CBO",
    title: "Mạng lưới CBO Đồng bằng Sông Cửu Long",
    subtitle: null,
    sort_order: 3,
    is_active: true,
  },
];

/* ------------------------------------------------------------------ */

export async function getServices(): Promise<Service[]> {
  const supabase = await createClient();
  if (!supabase) return DEFAULT_SERVICES;

  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return (data as Service[])?.length ? (data as Service[]) : DEFAULT_SERVICES;
}

export async function getPartners(): Promise<Partner[]> {
  const supabase = await createClient();
  if (!supabase) return DEFAULT_PARTNERS;

  const { data } = await supabase
    .from("partners")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return (data as Partner[])?.length ? (data as Partner[]) : DEFAULT_PARTNERS;
}

export async function getPartnerGroups(): Promise<PartnerGroup[]> {
  const supabase = await createClient();
  // Lỗi (chưa migration / chưa cấu hình) → dùng nhóm mặc định;
  // mảng rỗng (admin ẩn hết nhóm) → trả về rỗng, không dùng fallback.
  if (!supabase) return DEFAULT_PARTNER_GROUPS;

  const { data, error } = await supabase
    .from("partner_groups")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) return DEFAULT_PARTNER_GROUPS;
  return (data ?? []) as PartnerGroup[];
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("team_members")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return (data as TeamMember[]) ?? [];
}

export type PostListItem = Pick<
  Post,
  | "id"
  | "slug"
  | "title"
  | "excerpt"
  | "cover_url"
  | "category"
  | "published_at"
  | "is_featured"
> & { author_name?: string | null };

const POST_SELECT =
  "id, slug, title, excerpt, cover_url, category, published_at, is_featured, profiles(full_name)";

export async function getPosts(options?: {
  category?: string;
  limit?: number;
  featured?: boolean;
}): Promise<PostListItem[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  let query = supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("status", "published");

  if (options?.category) query = query.eq("category", options.category);
  if (options?.featured) query = query.eq("is_featured", true);

  query = query
    .order("published_at", { ascending: false })
    .limit(options?.limit ?? 12);

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as unknown as (PostListItem & { profiles: { full_name: string } | null })[]).map(
    (row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      cover_url: row.cover_url,
      category: row.category,
      published_at: row.published_at,
      is_featured: row.is_featured,
      author_name: row.profiles?.full_name ?? null,
    }),
  );
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("posts")
    .select("*, profiles(full_name)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!data) return null;
  const row = data as Post & { profiles: { full_name: string } | null };
  return { ...row, author: row.profiles };
}
