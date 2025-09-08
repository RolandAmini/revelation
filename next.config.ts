import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
  serverExternalPackages: ["mongoose"],
  },
};

export default nextConfig;
