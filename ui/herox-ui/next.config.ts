import { NextConfig } from "next";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://herox-server:3000";

const nextConfig: NextConfig = {
  output: "standalone",

  // Thêm 2 block này:
  eslint: {
    // Cảnh báo: Lệnh này cho phép build production hoàn thành ngay cả khi dự án có lỗi ESLint.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! Cảnh báo: Lệnh này cho phép build production hoàn thành ngay cả khi dự án có lỗi TypeScript.
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: API_BASE,
  },
  staticPageGenerationTimeout: 120,
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
