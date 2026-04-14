import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default nextConfig;
