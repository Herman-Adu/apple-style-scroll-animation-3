// Name of the httpOnly session cookie shared by the server action that mints it
// (actions.ts) and the server resolver that reads it (server.ts). Kept in its own
// tiny module so both server-side callers can import it without pulling in the
// signing code. The cookie value is an HMAC-signed token (see session-token.ts);
// it is httpOnly, so client JavaScript can neither read nor overwrite it.

export const SESSION_COOKIE = "momo.session"

/** Session lifetime in seconds (30 days), shared by the cookie maxAge and token exp. */
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60
