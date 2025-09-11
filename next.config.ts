import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  // Fix workspace root warning in production
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
