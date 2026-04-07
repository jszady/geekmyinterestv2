import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** This app lives inside a parent folder that also has a lockfile; pin the root so dev/build use this project. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
