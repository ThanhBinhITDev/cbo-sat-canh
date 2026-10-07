import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import { normalizeTheme, themeToStyle } from "@/lib/theme";
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

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const seo = (settings.seo ?? {}) as { title?: string; description?: string };
  const title = seo.title ?? `${SITE_NAME} — Y tế cộng đồng & thiện nguyện xã hội`;
  const description =
    seo.description ??
    "Xét nghiệm nhanh HIV/STIs, PrEP, PEP, chuyển gửi điều trị ARV. Đồng hành cùng cộng đồng khỏe mạnh, bình đẳng, nhân ái.";

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${SITE_NAME}` },
    description,
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
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
