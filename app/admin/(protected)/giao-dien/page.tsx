import { Palette, MonitorSmartphone } from "lucide-react";
import { Flash, PageHeader } from "@/components/admin/ui";
import ThemeEditor from "@/components/admin/ThemeEditor";
import { getSettings } from "@/lib/settings";
import { normalizeTheme } from "@/lib/theme";

export default async function ThemeAdminPage({
  searchParams,
}: PageProps<"/admin/giao-dien">) {
  const sp = await searchParams;
  const settings = await getSettings();
  const theme = normalizeTheme(settings.theme);

  return (
    <>
      <PageHeader
        title="Giao diện"
        description="Đổi màu nhận diện áp dụng cho toàn bộ trang khách. Khách vẫn có thể tự chọn giao diện yêu thích ở nút bên phải màn hình."
        action={
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-xs font-bold text-ink/60">
            <MonitorSmartphone size={15} /> 3 lớp giao diện
          </span>
        }
      />

      <Flash
        flash={typeof sp.flash === "string" ? sp.flash : undefined}
        error={typeof sp.err === "string" ? sp.err : undefined}
      />

      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <Palette size={18} className="mt-0.5 shrink-0 text-blue-600" />
        <p>
          <b>Thứ tự ưu tiên:</b> màu mặc định (mã nguồn) → màu admin lưu tại đây →
          giao diện khách tự chọn (localStorage). Khi admin lưu màu mới, mọi khách
          chưa tự chọn giao diện sẽ thấy màu mới ngay.
        </p>
      </div>

      <ThemeEditor initial={theme} />
    </>
  );
}
