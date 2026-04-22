/**
 * Loads `.env*` from the project root into `process.env` before other modules
 * read Supabase settings. Import this as the **first** import in `next.config.ts`
 * so image `remotePatterns` and any config-time env access see the same values
 * as `next dev` / `next start`.
 *
 * Next.js also loads env files automatically; this makes root resolution explicit
 * when the config or tooling evaluates before the usual pipeline.
 */
import { loadEnvConfig } from "@next/env";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");

loadEnvConfig(projectRoot);
