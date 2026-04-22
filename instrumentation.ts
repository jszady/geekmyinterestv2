/**
 * Runs once when the Node.js server starts — loads `.env.local` before other code.
 * Complements `lib/load-env-bootstrap.ts` (first import in `next.config.ts`).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/load-env-bootstrap");
  }
}
