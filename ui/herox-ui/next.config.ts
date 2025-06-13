import { NextConfig } from "next";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://herox-server:3000";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_API_BASE_URL: API_BASE,
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${API_BASE}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
