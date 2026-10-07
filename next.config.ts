import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    // Link ảnh ngoài (bài viết dán từ Google Drive / dịch vụ lấy link)
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "drive.google.com" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      // Avatar / logo dán từ Facebook
      { protocol: "https", hostname: "**.fbcdn.net" },
      { protocol: "https", hostname: "lookaside.fbsbx.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
