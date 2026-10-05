import "server-only";

/**
 * Anti-corruption layer: Strapi raw entry -> pre-validation milestone shape.
 * Output feeds directly into `milestoneSchema.parse(...)`.
 */
export function mapStrapiMilestone(entry: unknown): unknown {
  const source =
    typeof entry === "object" && entry !== null
      ? (entry as Record<string, unknown>)
      : {};
  const a =
    typeof source.attributes === "object" && source.attributes !== null
      ? (source.attributes as Record<string, unknown>)
      : source;

  return {
    year: String(a.year),
    title: a.title,
    description: a.description,
    icon: a.icon,
  };
}
