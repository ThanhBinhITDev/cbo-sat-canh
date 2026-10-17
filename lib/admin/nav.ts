import type { Role } from "@/lib/types";

/** Cấu hình menu quản trị: nhóm, mục và vai trò được phép thấy. */
export type NavLeaf = {
  href: string;
  label: string;
  roles: Role[];
  exact?: boolean;
};

export type NavGroup = {
  key: string;
  label: string;
  items: NavLeaf[];
};

export const ADMIN_NAV: NavGroup[] = [
  {
    key: "overview",
    label: "Tổng quan",
    items: [
      { href: "/admin", label: "Dashboard", roles: ["admin", "editor", "collaborator"], exact: true },
    ],
  },
  {
    key: "content",
    label: "Nội dung",
    items: [
      { href: "/admin/bai-viet", label: "Bài viết & Tin tức", roles: ["admin", "editor"] },
      { href: "/admin/noi-dung", label: "Nội dung tĩnh", roles: ["admin"] },
      { href: "/admin/anh", label: "Quản lý ảnh", roles: ["admin", "editor"] },
    ],
  },
  {
    key: "homepage",
    label: "Trang chủ & hiển thị",
    items: [
      { href: "/admin/slider", label: "Slider trang chủ", roles: ["admin"] },
      { href: "/admin/giao-dien", label: "Giao diện", roles: ["admin"] },
    ],
  },
  {
    key: "about",
    label: "Dịch vụ & đối tác",
    items: [
      { href: "/admin/dich-vu", label: "Dịch vụ", roles: ["admin"] },
      { href: "/admin/doi-ngu", label: "Đội ngũ", roles: ["admin"] },
      { href: "/admin/doi-tac", label: "Đối tác", roles: ["admin"] },
    ],
  },
  {
    key: "contact",
    label: "Liên hệ",
    items: [
      { href: "/admin/cau-hoi", label: "Câu hỏi liên hệ", roles: ["admin", "editor", "collaborator"] },
      { href: "/admin/newsletter", label: "Đăng ký nhận tin", roles: ["admin", "collaborator"] },
    ],
  },
  {
    key: "system",
    label: "Hệ thống",
    items: [
      { href: "/admin/tai-khoan", label: "Tài khoản", roles: ["admin"] },
      { href: "/admin/luu-tru", label: "Lưu trữ", roles: ["admin"] },
    ],
  },
];

/** Các trang ngoài menu, dùng cho breadcrumb. */
const EXTRA_LABELS: Record<string, string> = {
  "/admin/ho-so": "Hồ sơ của tôi",
};

export function visibleNav(role: Role): NavGroup[] {
  return ADMIN_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0);
}

export function isNavActive(pathname: string, item: NavLeaf) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export type Crumb = { label: string; href?: string };

/**
 * Breadcrumb từ đường dẫn. Trang con (chi tiết, sửa) hiện theo mục cha.
 * Segment động (ID) hiển thị là "Chi tiết".
 */
export function buildBreadcrumbs(pathname: string): Crumb[] {
  if (pathname === "/admin") return [{ label: "Dashboard" }];

  const crumbs: Crumb[] = [{ label: "Quản trị", href: "/admin" }];

  // Trang ngoài menu (ví dụ hồ sơ cá nhân, bài viết mới).
  if (EXTRA_LABELS[pathname]) {
    crumbs.push({ label: EXTRA_LABELS[pathname] });
    return crumbs;
  }

  const allItems = ADMIN_NAV.flatMap((group) =>
    group.items.map((item) => ({ item, group })),
  );
  const match = allItems
    .filter(({ item }) => pathname === item.href || pathname.startsWith(item.href + "/"))
    .sort((a, b) => b.item.href.length - a.item.href.length)[0];

  if (!match) return crumbs;

  if (match.group.key !== "overview") crumbs.push({ label: match.group.label });
  crumbs.push({ label: match.item.label, href: match.item.href });

  const rest = pathname.slice(match.item.href.length).split("/").filter(Boolean);
  if (rest.length) {
    crumbs.push({ label: rest[0] === "moi" ? "Thêm mới" : "Chi tiết" });
  }
  return crumbs;
}
