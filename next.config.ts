import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Opsi ini boleh ada, tapi biasanya tidak perlu untuk produksi di Hostinger
  // allowedDevOrigins: ["192.168.1.13"], 
  
  reactStrictMode: true,
};

export default nextConfig;