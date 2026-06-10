import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import withPWA from "next-pwa";

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(appRoot, "../..");
const appDir = path.resolve(appRoot, "..");

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: repoRoot,
  turbopack: {
    // must match outputFileTracingRoot per Next/Turbopack requirements
    root: repoRoot,
  },
  images: {
    remotePatterns: process.env.NEXT_PUBLIC_IMAGE_DOMAINS
      ? process.env.NEXT_PUBLIC_IMAGE_DOMAINS.split(",").map((domain) => ({
          protocol: "https",
          hostname: domain.trim(),
        }))
      : [],
  },
};

const pwaConfig = withPWA({
  dest: "public",
  register: false,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https?:\/\/.*\/api\/.*$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 5,
        },
      },
    },
    {
      urlPattern: /^https?:\/\/.*\/dashboard\/.*$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "dashboard-pages",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60,
        },
      },
    },
    {
      urlPattern: /^https?:\/\/.*\/portal\/.*$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "portal-pages",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60,
        },
      },
    },
  ],
})(nextConfig);

export default pwaConfig;
