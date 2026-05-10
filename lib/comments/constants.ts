/** Max length for `comments.body` (server + DB constraint). */
export const COMMENT_BODY_MAX_CHARS = 250;

/** Sliding window for per-user comment rate limit (ms). */
export const COMMENT_RATE_LIMIT_WINDOW_MS = 60_000;

/** Max comments a user may create within `COMMENT_RATE_LIMIT_WINDOW_MS`. */
export const COMMENT_RATE_LIMIT_MAX = 5;
