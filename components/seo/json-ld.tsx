/**
 * Renders one or more schema.org objects as a single JSON-LD script tag.
 * Server-safe and framework-agnostic — pass builders from lib/seo/structured-data.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const payload = Array.isArray(data) ? data : [data]
  return (
    <script
      type="application/ld+json"
      // Structured data is trusted, server-generated content.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  )
}
