export type Role = "admin" | "editor" | "collaborator";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PostStatus = "draft" | "published";
export type PostCategory = "tin-tuc" | "hoat-dong";

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_md: string | null;
  cover_url: string | null;
  category: PostCategory;
  status: PostStatus;
  author_id: string | null;
  is_featured: boolean;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author?: Pick<Profile, "full_name"> | null;
};

export type Service = {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
};

export type PartnerGroup = {
  key: string;
  label: string;
  title: string;
  subtitle: string | null;
  sort_order: number;
  is_active: boolean;
};

export type Partner = {
  id: string;
  name: string;
  group: string;
  logo_url: string | null;
  website_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export type TeamMember = {
  id: string;
  full_name: string;
  position: string | null;
  avatar_url: string | null;
  bio: string | null;
  sort_order: number;
  is_active: boolean;
};

export type MediaKind =
  | "hero"
  | "banner"
  | "decoration"
  | "logo"
  | "avatar"
  | "other";

export type Media = {
  id: string;
  kind: MediaKind;
  storage_path: string | null;
  public_url: string;
  alt: string | null;
  uploaded_by: string | null;
  created_at: string;
};

export type ContactStatus = "new" | "replied" | "archived";

export type ContactMessage = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  service_interest: string | null;
  message: string;
  status: ContactStatus;
  source: string;
  handled_by: string | null;
  created_at: string;
};

export type Newsletter = {
  id: string;
  email: string;
  name: string | null;
  source: string;
  is_active: boolean;
  created_at: string;
};

export type ContactInfo = {
  hotline: string[];
  email: string;
  fanpage: string;
  fanpage_url: string;
  zalo: string;
  address: string;
  working_hours: string;
};

export type HeroContent = {
  title: string;
  subtitle: string;
  image: string | null;
  cta_label: string;
  cta_href: string;
  badge?: string;
};

export type AboutContent = {
  paragraphs: string[];
  stats: { value: string; label: string }[];
};

export type TextBlock = { heading: string; body: string };

export type ValueItem = { title: string; description: string };

export type MapContent = { embed: string; address: string };

export const SERVICE_OPTIONS = [
  { value: "test", label: "Xét nghiệm nhanh HIV/STIs" },
  { value: "prep", label: "Dự phòng trước phơi nhiễm HIV (PrEP)" },
  { value: "pep", label: "Dự phòng sau phơi nhiễm HIV (PEP)" },
  { value: "arv", label: "Chuyển gửi điều trị HIV (ARV)" },
  { value: "other", label: "Hợp tác / Đề xuất khác" },
] as const;

export const CATEGORY_LABELS: Record<PostCategory, string> = {
  "tin-tuc": "Tin tức",
  "hoat-dong": "Hoạt động",
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Quản trị viên",
  editor: "Biên tập viên",
  collaborator: "Cộng tác viên",
};
