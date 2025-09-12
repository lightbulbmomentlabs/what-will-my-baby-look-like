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
  
  webpack: (config, { isServer }) => {
    // Handle missing Node.js modules in browser builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
        crypto: false,
        encoding: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
