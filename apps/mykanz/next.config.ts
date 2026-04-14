import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Multi-Zones: MyKanz berjalan di basePath /finance saat di-proxy oleh Hub
  // Aktifkan hanya di production. Di development, biarkan tanpa basePath.
  // basePath: "/finance",
};

export default nextConfig;
