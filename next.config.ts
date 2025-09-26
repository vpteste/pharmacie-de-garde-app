import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Configuration essentielle pour l'environnement Cloud Shell de l'utilisateur
  allowedDevOrigins: [
    "https://3001-cs-64463205942-default.cs-europe-west1-iuzs.cloudshell.dev",
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc', // Placeholder pour d'éventuelles images distantes
      },
    ],
  },
};

export default nextConfig;
