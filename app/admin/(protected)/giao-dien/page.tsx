import { Palette, MonitorSmartphone } from "lucide-react";
import { Flash, PageHeader } from "@/components/admin/ui";
import ThemeEditor from "@/components/admin/ThemeEditor";
import BrandSettings from "@/components/admin/BrandSettings";
import LoaderSettings from "@/components/admin/LoaderSettings";
import { getSettings } from "@/lib/settings";
import { normalizeTheme } from "@/lib/theme";
import { normalizeBrand } from "@/lib/brand";
import { normalizeLoader } from "@/lib/loader";

export default async function ThemeAdminPage({
  searchParams,
}: PageProps<"/admin/giao-dien">) {
  const sp = await searchParams;
  const settings = await getSettings();
  const theme = normalizeTheme(settings.theme);
  const brand = normalizeBrand(settings.brand);
  const loader = normalizeLoader(settings.loader);

  return (
    <>
      <PageHeader
        title="Giao diện"
        description="Đổi màu nhận diện, cài đặt màn hình chờ và thông báo toast áp dụng cho toàn bộ website."
        action={
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-xs font-bold text-ink/60">
            <MonitorSmartphone size={15} /> Cài đặt giao diện
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
          giao diện khách tự chọn (localStorage).
        </p>
      </div>

      <BrandSettings key={JSON.stringify(brand)} initial={brand} />
      <div className="mt-5" />
      <LoaderSettings key={JSON.stringify(loader)} initial={loader} />
      <div className="mt-5" />
      <ThemeEditor initial={theme} />
    </>
  );
}
