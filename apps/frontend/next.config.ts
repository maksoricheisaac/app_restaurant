import type { NextConfig } from "next";

const productionOrigins = process.env.NEXT_PUBLIC_APP_URL
  ? [process.env.NEXT_PUBLIC_APP_URL.replace(/^https?:\/\//, '')]
  : [];

const devOrigins = process.env.NODE_ENV !== 'production'
  ? ["localhost:3000", "localhost:3001"]
  : [];

const nextConfig: NextConfig = {
  // Required for minimal Docker image (copies only the files needed to run)
  output: 'standalone',
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "3iyaq4eawanziz7j.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "krtpu6f8pdiezfyz.public.blob.vercel-storage.com"
      }
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [...productionOrigins, ...devOrigins],
    },
  },
};

export default nextConfig;
