import type { NextConfig } from "next";

// Dev-only: extra hosts for LAN or Tailscale access. Next already allows
// localhost and whatever host it started with, so this stays empty by default.
const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  allowedDevOrigins,
  async rewrites() {
    // The demo is always available at /demo. A Vercel demo deployment sets
    // this at build time so the root URL is the demo instead of the SQLite app.
    return process.env.DEMO_MODE === "1"
      ? [{ source: "/", destination: "/demo" }]
      : [];
  },
  cacheComponents: true,
  partialPrefetching: true,
  // Keep the native SQLite binding out of the bundle; it is required at runtime.
  serverExternalPackages: ["better-sqlite3"],
  images: {
    // Cover art chosen in the edit dialog. SteamGridDB serves grids and thumbs
    // from its CDN, whose subdomain is not fixed.
    remotePatterns: [{ protocol: "https", hostname: "**.steamgriddb.com" }],
  },
  // Standalone output breaks `next start`, so only opt in for container builds.
  output: process.env.BUILD_STANDALONE ? "standalone" : undefined,
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
