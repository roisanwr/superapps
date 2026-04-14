import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Multi-Zones: BitMove berjalan di basePath /quests saat di-proxy oleh Hub
  // Aktifkan hanya di production. Di development, biarkan tanpa basePath.
  // basePath: "/quests",
};

export default nextConfig;
