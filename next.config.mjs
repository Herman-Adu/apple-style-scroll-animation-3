/** @type {import('next').NextConfig} */

/**
 * Baseline security response headers (defense-in-depth).
 *
 * Notes:
 * - The v0 chat preview strips framing/CSP headers so the app still renders in
 *   its iframe; these fully apply on the deployed site.
 * - CSP ships as report-only for now so a too-tight rule can't break the live
 *   site. `connect-src` lists the origins the app actually calls today; add the
 *   Strapi origin here (and to any enforcing CSP) when the CMS is connected,
 *   then switch to the enforcing `Content-Security-Policy` header.
 */
const cspReportOnly = [
  "default-src 'self'",
  "img-src 'self' data: https: blob:",
  "style-src 'self' 'unsafe-inline'",
  // Next.js emits inline hydration scripts in dev/prod; a nonce is the real fix.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "font-src 'self' data:",
  // Same-origin APIs, Supabase auth/data, and Vercel analytics beacons.
  "connect-src 'self' https://*.supabase.co https://*.vercel-insights.com https://vitals.vercel-insights.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ")

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
]

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig
