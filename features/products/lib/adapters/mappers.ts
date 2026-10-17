import "server-only";

import { strapiMedia } from "@/lib/strapi/media";

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
function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

export function mapStrapiProduct(entry: unknown): unknown {
  // Tolerate both Strapi v5 (flat) and v4 (`{ id, attributes }`) shapes.
  const source = asRecord(entry);
  const a = asRecord(source.attributes ?? source);
  const price = asRecord(a.price);

  return {
    slug: a.slug,
    name: a.name,
    tagline: a.tagline,
    category: a.category,
    price: {
      amount: price.amount ?? a.priceAmount,
      currency: price.currency ?? a.priceCurrency,
    },
    summary: a.summary,
    description: a.description,
    image: strapiMedia(a.image),
    accent: a.accent,
    featured: Boolean(a.featured),
    releaseStatus: a.releaseStatus,
    cinematicHero: a.cinematicHero,
    productHero: mapProductHero(a.productHero),
    features: Array.isArray(a.features)
      ? a.features.map((f) => {
          const feature = asRecord(f);
          return {
            title: feature.title,
            description: feature.description,
            stat: feature.stat,
            statUnit: feature.statUnit,
          };
        })
      : [],
    specs: Array.isArray(a.specs)
      ? a.specs.map((s) => {
          const spec = asRecord(s);
          return {
            label: spec.label,
            value: spec.value,
            unit: spec.unit ?? undefined,
          };
        })
      : [],
    colors: a.colors ?? [],
  };
}

/**
 * S69 made the product hero a single flat shape, so this is now one media path
 * to normalize rather than a switch over `kind`. The flagship's `cinematicHero`
 * needs none: its `framePath` is a directory of static frames, not an upload.
 */
function mapProductHero(hero: unknown): unknown {
  if (!hero) return hero;
  const heroRecord = asRecord(hero);
  return { ...heroRecord, image: strapiMedia(heroRecord.image) };
}

