import { getSettings } from "@/lib/settings";
import { normalizeBrand } from "@/lib/brand";
import LoginPanel from "@/components/admin/LoginPanel";

export default async function AdminLoginPage() {
  const brand = normalizeBrand((await getSettings()).brand);
  return <LoginPanel logoSquareUrl={brand.logoSquare} />;
}
