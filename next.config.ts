import type { NextConfig } from "next";
import dotenv from "dotenv";

dotenv.config();

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  /* config options here */
  async rewrites() {

    const api_url = process.env.API_URL || "http://rust_chat:8089";
    if (!api_url) {
      throw new Error("API_URL is not set");
    }
    return [
      {
        source: "/api/:path*",
        destination: `${api_url}/:path*`, // Proxy to Go-Zero
      },
    ];
  },
};

export default nextConfig;
