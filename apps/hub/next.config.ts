import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  turbopack: {},
  async rewrites() {
    return [
      {
        source: "/finance/:path*",
        destination: `${process.env.MYKANZ_URL || "http://localhost:3001"}/finance/:path*`,
      },
      {
        source: "/quests/:path*",
        destination: `${process.env.BITMOVE_URL || "http://localhost:3002"}/quests/:path*`,
      },
    ];
  },
};

export default withPWA(nextConfig);
