import type { Metadata } from "next";
import { Suspense } from "react";
import { Be_Vietnam_Pro } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import { normalizeTheme, themeToStyle } from "@/lib/theme";
import { normalizeBrand } from "@/lib/brand";
import { normalizeLoader } from "@/lib/loader";
import GlobalLoader from "@/components/site/GlobalLoader";
import LoaderTriggers from "@/components/site/LoaderTriggers";
import { Toaster } from "react-hot-toast";
import FlashToast from "@/components/shared/FlashToast";
import { SITE_NAME, SITE_URL } from "@/lib/env";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam",
  display: "swap",
});

/** Đọc localStorage trước khi React render → khách tự chỉnh màu không bị nhấp nháy. */
const themeBootScript = `(function(){try{
var o=localStorage.getItem('cbosc.theme.override');
if(!o)return;
var t=JSON.parse(o),r=document.documentElement.style,m={
primary:'--brand-primary',dark:'--brand-dark',ink:'--brand-ink',
surface:'--brand-surface',muted:'--brand-muted',accent:'--brand-accent',
line:'--brand-line'};
Object.keys(m).forEach(function(k){if(typeof t[k]==='string')r.setProperty(m[k],t[k]);});
if(typeof t.radius==='number')r.setProperty('--brand-radius',t.radius+'px');
if(typeof t.fontScale==='number')r.setProperty('--brand-font-scale',String(t.fontScale));
}catch(e){}})();`;

/** Đánh dấu để ẩn splash ngay từ đầu khi loader đã hiện trong phiên này. */
const loaderBootScript = `(function(){try{
if(sessionStorage.getItem('cbosc.loader.shown')==='1'){
document.documentElement.setAttribute('data-loader-skip','');
}}catch(e){}})();`;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const seo = (settings.seo ?? {}) as { title?: string; description?: string };
  const brand = normalizeBrand(settings.brand);
  const title = seo.title ?? `${SITE_NAME} — Y tế cộng đồng & thiện nguyện xã hội`;
  const description =
    seo.description ??
    "Xét nghiệm nhanh HIV/STIs, PrEP, PEP, chuyển gửi điều trị ARV. Đồng hành cùng cộng đồng khỏe mạnh, bình đẳng, nhân ái.";

  // Favicon theo chế độ trình duyệt: cả 2 ô → 2 link media; 1 ô → 1 link chung; không có → /favicon.ico.
  const { faviconLight: favLight, faviconDark: favDark } = brand;
  const icons: Metadata["icons"] =
    favLight && favDark
      ? {
          icon: [
            { url: favLight, media: "(prefers-color-scheme: light)" },
            { url: favDark, media: "(prefers-color-scheme: dark)" },
          ],
        }
      : { icon: favLight || favDark || "/favicon.ico" };

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${SITE_NAME}` },
    description,
    icons,
    openGraph: {
      type: "website",
      locale: "vi_VN",
      siteName: SITE_NAME,
      title,
      description,
      url: SITE_URL,
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSettings();
  const theme = normalizeTheme(settings.theme);
  const style = themeToStyle(theme);
  const loader = normalizeLoader(settings.loader);
  const loaderActive = loader.enabled;

  return (
    <html
      lang="vi"
      className={`${beVietnam.variable} h-full antialiased`}
      style={style}
      data-scroll-behavior="smooth"
    >
      <head>
        <Script
          id="theme-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeBootScript }}
        />
        {loaderActive && loader.oncePerSession && (
          <Script
            id="loader-boot"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: loaderBootScript }}
          />
        )}
        {loaderActive && loader.imageUrl && (
          <link rel="preload" as="image" href={loader.imageUrl} />
        )}
      </head>
      <body className="min-h-full flex flex-col">
        <GlobalLoader config={loader} />
        <Toaster containerClassName="z-[110]" position="top-right" />
        <Suspense fallback={null}>
          <FlashToast />
        </Suspense>
        <Suspense fallback={null}>
          <LoaderTriggers enabled={loaderActive} />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
