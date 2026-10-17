export type Role = "admin" | "editor" | "collaborator";

export type Profile = {
  id: string;
  full_name: string;
  /** Tên đăng nhập tùy chọn (đăng nhập thay cho email), có thể null. */
  username: string | null;
  email: string;
  role: Role;
  avatar_url: string | null;
  is_active: boolean;
  /** Được phép quản lý nhiệm vụ (giao việc, duyệt kết quả) do admin cấp. */
  can_manage_tasks: boolean;
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
  content_html: string | null;
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
  author?: Pick<Profile, "full_name" | "avatar_url"> | null;
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

export type HeroSlide = {
  id: string;
  image_url: string;
  alt: string | null;
  sort_order: number;
  is_active: boolean;
};

/** Một mục menu trên thanh điều hướng. */
export type HeaderNavItem = { label: string; href: string };

/** Nội dung thanh điều hướng: tầng trên (địa chỉ/hotline/khẩu hiệu) và tầng dưới (menu). */
export type HeaderContent = {
  address: string;
  phone: string;
  slogan: string;
  show_language: boolean;
  nav: HeaderNavItem[];
  cta_label: string;
  cta_href: string;
  /** Màu nền tầng trên; rỗng = dùng màu chính của bộ nhận diện. */
  top_color: string;
  /** Màu chữ tầng trên. */
  top_text_color: string;
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

/* ------------------------------------------------------------------ *
 * Cộng tác — nhiệm vụ (Giai đoạn 1)
 * ------------------------------------------------------------------ */

export type TaskStatus =
  | "assigned"
  | "accepted"
  | "in_progress"
  | "submitted"
  | "needs_revision"
  | "completed"
  | "cancelled";

export type TaskPriority = "low" | "normal" | "high" | "urgent";

export type TaskAssigneeRole = "lead" | "member" | "support";

export type TaskUpdateKind =
  | "comment"
  | "progress"
  | "result"
  | "revision_request"
  | "approval"
  | "accept"
  | "cancel"
  | "status_change";

export type TaskCategory = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  project_id: string | null;
  created_by: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  start_date: string | null;
  due_date: string | null;
  acceptance_criteria: string | null;
  points_estimated: number;
  internal_note: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskAssignee = {
  id: string;
  task_id: string;
  profile_id: string;
  role_in_task: TaskAssigneeRole;
  status: TaskStatus;
  accepted_at: string | null;
  completed_at: string | null;
  points_awarded: number;
  created_at: string;
};

export type TaskUpdate = {
  id: string;
  task_id: string;
  author_id: string | null;
  kind: TaskUpdateKind;
  body: string | null;
  status_from: TaskStatus | null;
  status_to: TaskStatus | null;
  created_at: string;
};

export type TaskAttachment = {
  id: string;
  task_id: string;
  name: string | null;
  url: string;
  kind: "reference" | "result";
  uploaded_by: string | null;
  created_at: string;
};

/** Thành viên nội bộ (từ RPC collab_members — chỉ staff đọc được). */
export type CollabMember = {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  avatar_url: string | null;
  can_manage_tasks: boolean;
  is_active: boolean;
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  assigned: "Chờ nhận",
  accepted: "Đã nhận",
  in_progress: "Đang thực hiện",
  submitted: "Chờ duyệt",
  needs_revision: "Cần chỉnh sửa",
  completed: "Hoàn thành",
  cancelled: "Đã huỷ",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Thấp",
  normal: "Bình thường",
  high: "Cao",
  urgent: "Khẩn cấp",
};

export const TASK_UPDATE_LABELS: Record<TaskUpdateKind, string> = {
  comment: "Bình luận",
  progress: "Cập nhật tiến độ",
  result: "Gửi kết quả",
  revision_request: "Yêu cầu chỉnh sửa",
  approval: "Duyệt hoàn thành",
  accept: "Nhận nhiệm vụ",
  cancel: "Huỷ nhiệm vụ",
  status_change: "Đổi trạng thái",
};

/** Thứ tự nhóm trạng thái hiển thị trong danh sách/bộ lọc. */
export const TASK_STATUS_ORDER: TaskStatus[] = [
  "assigned",
  "accepted",
  "in_progress",
  "submitted",
  "needs_revision",
  "completed",
  "cancelled",
];

export const TASK_PRIORITY_ORDER: TaskPriority[] = ["urgent", "high", "normal", "low"];

/* ------------------------------------------------------------------ *
 * Giai đoạn 2 — Điểm đóng góp, huy chương, xếp hạng
 * ------------------------------------------------------------------ */

export type MedalTier = "bronze" | "silver" | "gold" | "platinum";
export type ContributionSource = "task" | "manual" | "event" | "other";

export type Medal = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  tier: MedalTier;
  threshold_points: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type ProfileMedal = {
  id: string;
  profile_id: string;
  medal_id: string;
  awarded_by: string | null;
  note: string | null;
  awarded_at: string;
};

/** Huy chương đã trao, kèm thông tin huy chương (join). */
export type ProfileMedalWithMedal = ProfileMedal & { medals: Medal | null };

export type ContributionEntry = {
  id: string;
  profile_id: string;
  points: number;
  source: ContributionSource;
  task_id: string | null;
  note: string | null;
  awarded_by: string | null;
  created_at: string;
};

/** Dòng bảng xếp hạng (từ RPC collab_leaderboard — staff). */
export type LeaderboardRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  total_points: number;
  total_medals: number;
};

export const TIER_LABELS: Record<MedalTier, string> = {
  bronze: "Đồng",
  silver: "Bạc",
  gold: "Vàng",
  platinum: "Bạch kim",
};

export const TIER_BADGE: Record<MedalTier, string> = {
  bronze: "badge-yellow",
  silver: "badge-gray",
  gold: "badge-blue",
  platinum: "badge-red",
};

export const SOURCE_LABELS: Record<ContributionSource, string> = {
  task: "Từ nhiệm vụ",
  manual: "Ghi tay",
  event: "Sự kiện",
  other: "Khác",
};

export const MEDAL_TIER_ORDER: MedalTier[] = ["platinum", "gold", "silver", "bronze"];

/* ------------------------------------------------------------------ *
 * Giai đoạn 3 — Dự án & Hoạt động
 * ------------------------------------------------------------------ */

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "cancelled";
export type ProjectMemberRole = "lead" | "member" | "support";
export type ProjectMemberStatus = "active" | "inactive";

export type EventStatus = "draft" | "published" | "cancelled" | "completed";
export type EventType = "meeting" | "workshop" | "outreach" | "training" | "other";
export type EventAttendeeStatus = "invited" | "confirmed" | "declined" | "attended" | "no_show";

export type Project = {
  id: string;
  name: string;
  code: string | null;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  leader_id: string | null;
  cover_url: string | null;
  description: string | null;
  internal_note: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectMember = {
  id: string;
  project_id: string;
  profile_id: string;
  role: ProjectMemberRole;
  status: ProjectMemberStatus;
  joined_at: string;
};

export type ProjectWithLeader = Project & {
  leader?: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
};

export type ProjectMemberWithProfile = ProjectMember & {
  profile: Pick<Profile, "id" | "full_name" | "email" | "avatar_url" | "role">;
};

export type Event = {
  id: string;
  name: string;
  code: string | null;
  project_id: string | null;
  status: EventStatus;
  type: EventType;
  start_at: string | null;
  end_at: string | null;
  location: string | null;
  capacity: number | null;
  cover_url: string | null;
  description: string | null;
  internal_note: string | null;
  organizer_id: string | null;
  created_at: string;
  updated_at: string;
};

export type EventWithProject = Event & {
  project?: Pick<Project, "id" | "name"> | null;
};

export type EventAttendee = {
  id: string;
  event_id: string;
  profile_id: string;
  status: EventAttendeeStatus;
  checked_in_at: string | null;
  note: string | null;
};

export type EventAttendeeWithProfile = EventAttendee & {
  profile: Pick<Profile, "id" | "full_name" | "email" | "avatar_url">;
};

export type EventRegistration = {
  id: string;
  event_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  status: "registered" | "confirmed" | "attended" | "declined" | "cancelled";
  note: string | null;
  registered_at: string;
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Lên kế hoạch",
  active: "Đang thực hiện",
  on_hold: "Tạm dừng",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};
export const PROJECT_MEMBER_ROLE_LABELS: Record<ProjectMemberRole, string> = {
  lead: "Trưởng dự án",
  member: "Thành viên",
  support: "Hỗ trợ",
};
export const PROJECT_MEMBER_STATUS_LABELS: Record<ProjectMemberStatus, string> = {
  active: "Hoạt động",
  inactive: "Ngừng",
};
export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: "Nháp",
  published: "Công khai",
  cancelled: "Đã hủy",
  completed: "Đã kết thúc",
};
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  meeting: "Họp",
  workshop: "Tập huấn",
  outreach: "Tiếp cận cộng đồng",
  training: "Đào tạo",
  other: "Khác",
};
export const EVENT_ATT_STATUS_LABELS: Record<EventAttendeeStatus, string> = {
  invited: "Đã mời",
  confirmed: "Xác nhận",
  declined: "Từ chối",
  attended: "Đã tham dự",
  no_show: "Không tham dự",
};
export const EVENT_REG_STATUS_LABELS: Record<"registered" | "confirmed" | "attended" | "declined" | "cancelled", string> = {
  registered: "Đã đăng ký",
  confirmed: "Đã xác nhận",
  attended: "Đã tham dự",
  declined: "Từ chối",
  cancelled: "Đã hủy",
};
