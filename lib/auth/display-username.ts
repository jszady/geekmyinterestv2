import { escapeIlikePattern } from "@/lib/text/ilike-escape";

/** Public display name stored in `profiles.username` (letters, digits, single spaces). */
export const DISPLAY_USERNAME_MIN_LENGTH = 3;
export const DISPLAY_USERNAME_MAX_LENGTH = 30;

const DISPLAY_USERNAME_PATTERN = /^[A-Za-z0-9 ]+$/;

/** Trim and collapse internal whitespace to a single space. */
export function normalizeDisplayUsername(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

export type DisplayUsernameValidation =
  | { ok: true; username: string }
  | { ok: false; error: string };

export function validateDisplayUsername(normalized: string): DisplayUsernameValidation {
  if (!normalized) {
    return { ok: false, error: "Username is required." };
  }
  if (normalized.length < DISPLAY_USERNAME_MIN_LENGTH) {
    return {
      ok: false,
      error: `Username must be at least ${DISPLAY_USERNAME_MIN_LENGTH} characters.`,
    };
  }
  if (normalized.length > DISPLAY_USERNAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `Username must be at most ${DISPLAY_USERNAME_MAX_LENGTH} characters.`,
    };
  }
  if (!DISPLAY_USERNAME_PATTERN.test(normalized)) {
    return {
      ok: false,
      error: "Username can only use letters, numbers, and spaces.",
    };
  }
  return { ok: true, username: normalized };
}

/** Exact, case-insensitive match for duplicate checks (`WHERE username ILIKE pattern`). */
export function displayUsernameIlikePattern(normalized: string): string {
  return escapeIlikePattern(normalized);
}
