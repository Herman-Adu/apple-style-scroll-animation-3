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
    hero: mapProductHero(a.hero),
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
 * The hero is a polymorphic component in Strapi. Normalize media paths inside
 * each variant; the discriminated-union schema validates `kind` downstream.
 */
function mapProductHero(hero: unknown): unknown {
  const heroRecord = asRecord(hero);
  if (!hero) return hero;
  switch (heroRecord.kind) {
    case "parallax":
      return { ...heroRecord, image: strapiMedia(heroRecord.image) };
    case "exploded":
      return {
        ...heroRecord,
        layers: Array.isArray(heroRecord.layers)
          ? heroRecord.layers.map((l) => {
              const layer = asRecord(l);
              return { ...layer, image: strapiMedia(layer.image) };
            })
          : [],
      };
    case "frames":
    default:
      return heroRecord;
  }
}
