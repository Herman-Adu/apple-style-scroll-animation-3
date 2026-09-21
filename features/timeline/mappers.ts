import "server-only"

/**
 * Anti-corruption layer: Strapi raw entry -> pre-validation milestone shape.
 * Output feeds directly into `milestoneSchema.parse(...)`.
 */
export function mapStrapiMilestone(entry: any): unknown {
  const a = entry?.attributes ?? entry ?? {}

  return {
    year: String(a.year),
    title: a.title,
    description: a.description,
    icon: a.icon,
  }
}
