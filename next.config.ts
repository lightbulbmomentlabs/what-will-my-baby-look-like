import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {}
  },
  images: {
    domains: [
      'igzgqopnmmlnttcggccr.supabase.co',
      'replicate.delivery',
      'pbxt.replicate.delivery'
    ],
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
