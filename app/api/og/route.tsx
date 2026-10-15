import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getSettings } from "@/lib/settings";
import { normalizeTheme, DEFAULT_THEME } from "@/lib/theme";
import { SITE_NAME } from "@/lib/env";

export const runtime = "nodejs";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Nạp font + logo một lần (không phụ thuộc request). */
const fontRegular = readFile(
  join(process.cwd(), "assets/fonts/BeVietnamPro-Regular.ttf"),
);
const fontBold = readFile(
  join(process.cwd(), "assets/fonts/BeVietnamPro-Bold.ttf"),
);
const logoData = readFile(
  join(process.cwd(), "public/images/brand/logo-vong-tron.png"),
).then((buf) => `data:image/png;base64,${buf.toString("base64")}`);

function clip(text: string, max: number) {
  const s = text.replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trimEnd()}…`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = clip(searchParams.get("title") || SITE_NAME, 140);
  const description = clip(searchParams.get("description") || "", 200);
  const category = clip(searchParams.get("category") || "", 40);
  const site = clip(searchParams.get("site") || SITE_NAME, 60);

  const settings = await getSettings().catch(() => null);
  const theme = settings
    ? normalizeTheme((settings as Record<string, unknown>).theme)
    : DEFAULT_THEME;

  const [regular, bold, logo] = await Promise.all([
    fontRegular,
    fontBold,
    logoData,
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          fontFamily: "Be Vietnam Pro",
        }}
      >
        {/* Dải màu thương hiệu trên cùng */}
        <div style={{ display: "flex", width: "100%", height: 14 }}>
          <div style={{ display: "flex", flex: 1, background: theme.primary }} />
          <div style={{ display: "flex", flex: 1, background: theme.dark }} />
          <div style={{ display: "flex", flex: 1, background: theme.accent }} />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "56px 72px",
          }}
        >
          {/* Logo + tên site */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} width={72} height={72} alt="" />
            <div
              style={{
                display: "flex",
                fontSize: 30,
                fontWeight: 700,
                color: theme.dark,
              }}
            >
              {site}
            </div>
          </div>

          <div style={{ display: "flex", flex: 1 }} />

          {/* Chip danh mục */}
          {category ? (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                padding: "8px 20px",
                borderRadius: 999,
                background: theme.primary,
                color: "#ffffff",
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 24,
              }}
            >
              {category}
            </div>
          ) : null}

          {/* Tiêu đề */}
          <div
            style={{
              display: "flex",
              fontSize: title.length > 70 ? 56 : 68,
              fontWeight: 700,
              lineHeight: 1.15,
              color: theme.ink,
            }}
          >
            {title}
          </div>

          {/* Mô tả */}
          {description ? (
            <div
              style={{
                display: "flex",
                marginTop: 24,
                fontSize: 30,
                lineHeight: 1.35,
                color: theme.ink,
                opacity: 0.72,
              }}
            >
              {description}
            </div>
          ) : null}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Be Vietnam Pro", data: regular, style: "normal", weight: 400 },
        { name: "Be Vietnam Pro", data: bold, style: "normal", weight: 700 },
      ],
      headers: {
        "Cache-Control":
          "public, immutable, no-transform, max-age=86400, s-maxage=604800",
      },
    },
  );
}
