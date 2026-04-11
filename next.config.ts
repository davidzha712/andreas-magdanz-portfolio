import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "three",
      "@mediapipe/tasks-vision",
      "framer-motion",
      "gsap",
      "lucide-react",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      // Cloudflare Worker that proxies cdn.sanity.io with 1-year edge cache.
      // Wildcard matches any *.workers.dev subdomain so renames don't break
      // existing deployments. Configure NEXT_PUBLIC_SANITY_CDN_PROXY to use.
      {
        protocol: "https",
        hostname: "*.workers.dev",
      },
    ],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default withNextIntl(nextConfig);
