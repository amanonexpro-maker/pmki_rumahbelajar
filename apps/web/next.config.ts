import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return [
      {
        source: "/gallery",
        destination: "/kabar?tab=galeri",
        permanent: true,
      },
      {
        source: "/news",
        destination: "/kabar?tab=berita",
        permanent: true,
      },
      {
        source: "/news/:slug+",
        destination: "/kabar/:slug+",
        permanent: true,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "55421",
        pathname: "/storage/v1/object/sign/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "55421",
        pathname: "/storage/v1/object/sign/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
    ],
  },
  turbopack: {
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
