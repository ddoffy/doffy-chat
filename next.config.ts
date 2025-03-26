import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8089/:path*", // Proxy to Go-Zero
      },
    ];
  },
};

export default nextConfig;
