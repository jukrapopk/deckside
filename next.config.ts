import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
