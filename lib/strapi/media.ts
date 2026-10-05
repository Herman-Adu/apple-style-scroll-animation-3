import "server-only";

import { env } from "@/lib/env";

/**
 * Normalize a Strapi media reference into an absolute URL.
 *
 * Strapi stores uploads as relative paths (`/uploads/foo.png`) unless a remote
 * provider (S3/Cloudinary) is configured, in which case the URL is already
 * absolute. This resolves relative paths against `STRAPI_API_URL` and passes
 * absolute ones through untouched.
 *
 * Accepts either a raw string, a Strapi v5 media object (`{ url }`), or a v4
 * relation envelope (`{ data: { attributes: { url } } }`) so the mappers stay
 * tolerant of either Strapi major version.
 */
export function strapiMedia(input: unknown): string {
  const path = extractUrl(input);
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  if (!env.STRAPI_API_URL) return path;
  return new URL(path, env.STRAPI_API_URL).toString();
}

function extractUrl(input: unknown): string | null {
  if (!input) return null;
  if (typeof input === "string") return input;
  if (typeof input === "object") {
    const obj = input as Record<string, unknown>;
    // Strapi v5 flat media object
    if (typeof obj.url === "string") return obj.url;
    // Strapi v4 relation envelope
    const data =
      typeof obj.data === "object" && obj.data !== null
        ? (obj.data as Record<string, unknown>)
        : null;
    const attrs =
      data && typeof data.attributes === "object" && data.attributes !== null
        ? (data.attributes as Record<string, unknown>)
        : null;
    const nested = attrs?.url ?? data?.url;
    if (typeof nested === "string") return nested;
  }
  return null;
}
