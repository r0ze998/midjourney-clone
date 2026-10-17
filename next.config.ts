import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // ルートレイアウトが言語ごとに分かれているため、404 は app/global-not-found.tsx で描画する
    globalNotFound: true,
  },
};

export default nextConfig;
