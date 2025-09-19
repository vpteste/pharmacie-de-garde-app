import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
  },
  devIndicators: {
    allowedDevOrigins: [
      "https://3001-cs-64463205942-default.cs-europe-west1-iuzs.cloudshell.dev",
    ],
  },
};

export default nextConfig;