import "./lib/load-env-bootstrap";
import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveSupabaseUrlForServer } from "./lib/supabase/public-env";

/** This app lives inside a parent folder that also has a lockfile; pin the root so dev/build use this project. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

function supabaseStorageRemotePattern():
  | { protocol: "https"; hostname: string; pathname: string }
  | null {
  const raw = resolveSupabaseUrlForServer();
  if (!raw) return null;
  try {
    const hostname = new URL(raw).hostname;
    return {
      protocol: "https",
      hostname,
      pathname: "/storage/v1/object/public/**",
    };
  } catch {
    return null;
  }
}

const supabasePattern = supabaseStorageRemotePattern();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      ...(supabasePattern ? [supabasePattern] : []),
    ],
  },
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
