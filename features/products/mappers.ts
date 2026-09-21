import "server-only"

import { strapiMedia } from "@/lib/strapi/media"

/**
 * Anti-corruption layer: Strapi raw entry -> pre-validation product shape.
 *
 * This is the ONLY place that knows Strapi's field names and media envelope.
 * The output is handed straight to `productSchema.parse(...)`, so if the CMS
 * content-type drifts from the contract, it fails loudly here at the boundary
 * rather than rendering as `undefined` deep in a component.
 *
 * Field names below assume a `product` content-type whose attributes mirror the
 * domain. Adjust the right-hand side (never the keys) if the Strapi schema uses
 * different names — every caller downstream stays untouched.
 *
 * `entry` is typed `any` deliberately: it is untrusted external input whose
 * real guarantees come from the zod parse that runs immediately after.
 */
export function mapStrapiProduct(entry: any): unknown {
  // Tolerate both Strapi v5 (flat) and v4 (`{ id, attributes }`) shapes.
  const a = entry?.attributes ?? entry ?? {}

  return {
    slug: a.slug,
    name: a.name,
    tagline: a.tagline,
    category: a.category,
    price: {
      amount: a.price?.amount ?? a.priceAmount,
      currency: a.price?.currency ?? a.priceCurrency,
    },
    summary: a.summary,
    description: a.description,
    image: strapiMedia(a.image),
    accent: a.accent,
    featured: Boolean(a.featured),
    releaseStatus: a.releaseStatus,
    hero: mapProductHero(a.hero),
    features: (a.features ?? []).map((f: any) => ({
      title: f.title,
      description: f.description,
      stat: f.stat,
      statUnit: f.statUnit,
    })),
    specs: (a.specs ?? []).map((s: any) => ({
      label: s.label,
      value: s.value,
      unit: s.unit ?? undefined,
    })),
    colors: a.colors ?? [],
  }
}

/**
 * The hero is a polymorphic component in Strapi. Normalize media paths inside
 * each variant; the discriminated-union schema validates `kind` downstream.
 */
function mapProductHero(hero: any): unknown {
  if (!hero) return hero
  switch (hero.kind) {
    case "parallax":
      return { ...hero, image: strapiMedia(hero.image) }
    case "exploded":
      return {
        ...hero,
        layers: (hero.layers ?? []).map((l: any) => ({ ...l, image: strapiMedia(l.image) })),
      }
    case "frames":
    default:
      return hero
  }
}
