import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    domains: [
      'igzgqopnmmlnttcggccr.supabase.co',
      'replicate.delivery',
      'pbxt.replicate.delivery'
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
