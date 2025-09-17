import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: '3iyaq4eawanziz7j.public.blob.vercel-storage.com',
      },
    ],
  }
  
};

export default nextConfig;
