import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  /* config options here */
  async rewrites() {
    const api_url = process.env.API_URL || "http://localhost:8089";
    return [
      {
        source: "/api/:path*",
        destination: `${api_url}/:path*`, // Proxy to Go-Zero
      },
    ];
  },
};

export default nextConfig;
