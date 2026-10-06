/** People still waiting, keyed by product slug. Products nobody wants are simply absent. */
export type WaitingByProduct = Record<string, number>

export type ProductDemand = { slug: string; count: number }

export const TOP_WAITING_LIMIT = 3

export function waitingFor(counts: WaitingByProduct, slug: string): number {
  return counts[slug] ?? 0
}

export function totalWaiting(counts: WaitingByProduct): number {
  return Object.values(counts).reduce((sum, count) => sum + count, 0)
}

/** The most-wanted products, biggest first; ties fall back to slug order so the list never jumps. */
export function topWaiting(counts: WaitingByProduct, limit: number = TOP_WAITING_LIMIT): ProductDemand[] {
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug))
    .slice(0, limit)
}

/** A sorted copy. `Array.prototype.sort` is stable, so equal counts keep their original order. */
export function sortByWaiting<T extends { slug: string }>(
  items: readonly T[],
  counts: WaitingByProduct,
  direction: "asc" | "desc",
): T[] {
  const sign = direction === "desc" ? -1 : 1
  return [...items].sort((a, b) => sign * (waitingFor(counts, a.slug) - waitingFor(counts, b.slug)))
}
