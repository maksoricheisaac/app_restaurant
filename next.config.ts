import type { NextConfig } from "next";
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";

const nextConfig: NextConfig = {
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

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins.push(new PrismaPlugin());
    }
    return config;
  },
};

export default nextConfig;
