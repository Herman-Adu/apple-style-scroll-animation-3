import type { Review } from "@/lib/reviews/types"

/**
 * Seed reviews so product pages show social proof out of the box. User-submitted
 * reviews (from the contact "Leave a review" flow) are merged in on top of these
 * by the reviews provider.
 */
export const seedReviews: Review[] = [
  {
    id: "seed-momo-x-1",
    productSlug: "momo-x",
    author: "Daniel Okafor",
    rating: 5,
    headline: "Reference sound, genuinely",
    body: "I've owned three flagship headphones and the Momo X is the first that made me re-listen to my whole library. The planar drivers are effortless and the noise cancellation is uncanny on a plane.",
    createdAt: "2025-11-02T10:15:00.000Z",
    source: "seed",
    status: "published",
  },
  {
    id: "seed-momo-x-2",
    productSlug: "momo-x",
    author: "Sofia Lindqvist",
    rating: 4,
    headline: "Stunning build, slightly heavy",
    body: "The titanium frame feels like it will outlive me. Comfort is great for a couple of hours, though on very long sessions I notice the weight. Sound is worth it.",
    createdAt: "2025-10-21T16:40:00.000Z",
    source: "seed",
    status: "published",
  },
  {
    id: "seed-momo-air-1",
    productSlug: "momo-air",
    author: "Priya Nair",
    rating: 5,
    headline: "The everyday pair I reach for",
    body: "Feather-light and the battery genuinely lasts. Pairing is instant and the case is tiny. Perfect commute companion.",
    createdAt: "2025-11-10T08:05:00.000Z",
    source: "seed",
    status: "published",
  },
  {
    id: "seed-momo-studio-1",
    productSlug: "momo-studio",
    author: "Marcus Bell",
    rating: 5,
    headline: "Mixed my last EP on these",
    body: "Flat, honest response. What I hear here translates to every other system. That's the highest praise I can give a studio can.",
    createdAt: "2025-09-30T12:00:00.000Z",
    source: "seed",
    status: "published",
  },
  {
    id: "seed-momo-beat-1",
    productSlug: "momo-beat",
    author: "Aisha Rahman",
    rating: 4,
    headline: "Room-filling and gorgeous",
    body: "The 360° sound really does fill the space and the machined body looks incredible on a shelf. Bass is deep without being muddy.",
    createdAt: "2025-11-14T19:20:00.000Z",
    source: "seed",
    status: "published",
  },
]
