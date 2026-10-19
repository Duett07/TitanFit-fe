import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enforce React StrictMode to catch side-effects, incomplete effect cleanups, and ensure React 19 safety
  reactStrictMode: true,

  // Remote image optimization domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },

  // Next.js 16 Cache Components & Partial Prerendering (PPR)
  // Allows static shell pre-rendering with dynamic streaming slots
  cacheComponents: true,
  partialPrefetching: true,

  // Tailwind CSS v4 integration with Turbopack bundler using official @tailwindcss/turbopack loader
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
