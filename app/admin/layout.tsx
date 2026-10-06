// Toàn bộ khu vực quản trị phải chạy động (đọc phiên đăng nhập từ cookie).
export const dynamic = "force-dynamic";

export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
