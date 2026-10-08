import { factsSchema, type Facts } from "./schema"
import snapshot from "./snapshot.json"

/**
 * Measured numbers, committed so anything rendered live still has them after a
 * deploy. `.generated/facts.json` is the render pipeline's copy and is
 * git-ignored; this snapshot is written by the same `pnpm facts` run and
 * checked in, because a docs page resolves its numbers when it renders rather
 * than baking them into a committed image the way a showcase slide does.
 *
 * Parsed rather than cast: a snapshot that drifts from the schema should fail
 * the build, not quietly render a missing number into a post somebody then
 * publishes under their own name.
 */
export const facts: Facts = factsSchema.parse(snapshot)

export * from "./schema"
