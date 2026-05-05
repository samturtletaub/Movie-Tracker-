import type { NextConfig } from "next";

const config: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org" },
    ],
  },
  serverExternalPackages: ["better-sqlite3"],
};

export default config;
