import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    workerThreads: false,
    cpus: 4,
  },
  async headers() {
    const authNoStoreHeaders = [
      {
        key: "Cache-Control",
        value: "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
      { key: "Pragma", value: "no-cache" },
      { key: "Expires", value: "0" },
      {
        key: "Vary",
        value: "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Accept, Accept-Encoding",
      },
    ];

    return [
      {
        source: "/login",
        headers: authNoStoreHeaders,
      },
      {
        source: "/register",
        headers: authNoStoreHeaders,
      },
    ];
  },
};

export default nextConfig;