import { describe, expect, it } from "vitest";
import { docs } from "@/features/docs/content";
import { docText } from "@/features/docs/lib/domain/freshness";
import {
  DELIVERABLES,
  missingTierValues,
  TIERS,
  tierNames,
} from "@/features/docs/lib/domain/tiers";

/**
 * The tier ladder is a promise to a paying client, so the failure modes are
 * commercial rather than technical: a blank cell is a promise nobody made, and
 * a tier named one thing in the pricing doc and another in the deliverables doc
 * is two offers the owner has to reconcile live, in front of a buyer.
 *
 * The matrix is typed data that the doc renders, so prose and data cannot drift
 * (the same shape as `showroom.ts` and the infographic registry). What is left
 * for a guard is completeness, cross-doc agreement, and the one glossary rule
 * that cost this repo real drift: "handover" is never used bare.
 */

const deliverablesDoc = docs.find((doc) => doc.slug === "tier-deliverables");
const pricingDoc = docs.find(
  (doc) => doc.slug === "pricing-and-packaging-the-build",
);

describe("the tier deliverables matrix", () => {
  it("publishes the three tiers in ladder order", () => {
    expect(tierNames()).toEqual(["Launch", "Growth", "Scale"]);
  });

  it("gives every deliverable a value at every tier", () => {
    expect(missingTierValues(DELIVERABLES)).toEqual([]);
  });

  it("covers the ten deliverables a client asks about", () => {
    expect(DELIVERABLES.map((row) => row.id)).toEqual([
      "code-access",
      "vendor-accounts",
      "hosting",
      "domain",
      "documentation",
      "training",
      "support",
      "exit",
      "content-types",
      "retainer",
    ]);
  });

  it("counts a Scale client as two of the eight capacity slots", () => {
    const slots = Object.fromEntries(
      TIERS.map((tier) => [tier.id, tier.slots]),
    );

    expect(slots).toEqual({ launch: 1, growth: 1, scale: 2 });
  });
});

describe("the gated doc that carries it", () => {
  it("is owner-gated in the Positioning ladder", () => {
    expect(deliverablesDoc).toBeDefined();
    expect(deliverablesDoc?.category).toBe("Positioning");
    expect(deliverablesDoc?.audience).toBe("owner");
    expect(deliverablesDoc?.access).toBe("owner");
  });

  it("renders every deliverable label and every tier name", () => {
    const text = docText(deliverablesDoc!);

    for (const row of DELIVERABLES) expect(text).toContain(row.label);
    for (const name of tierNames()) expect(text).toContain(name);
  });

  it("never uses the bare term the glossary forbids", () => {
    // GLOSSARY.md: "handover" alone has meant three different things in this
    // repo. Qualified uses ("template handover", "operational handover") are
    // fine; the bare noun is what caused the drift. Reported with its
    // surrounding words, because "expected true to be false" does not tell the
    // next reader which sentence to fix.
    const allowed = ["template", "operational"];
    const text = docText(deliverablesDoc!);
    const offenders: string[] = [];

    for (const match of text.matchAll(/handover/gi)) {
      const before = text.slice(Math.max(0, match.index - 14), match.index);
      if (allowed.some((word) => new RegExp(`${word}\\s+$`, "i").test(before))) {
        continue;
      }
      offenders.push(
        text.slice(Math.max(0, match.index - 40), match.index + 20).trim(),
      );
    }

    expect(offenders).toEqual([]);
  });
});

describe("agreement with the pricing ladder", () => {
  it("names the same three tiers as the pricing doc's packaging table", () => {
    const packaging = pricingDoc?.body.find(
      (block) => block.type === "table" && /packaging/i.test(block.title ?? ""),
    );

    expect(packaging).toBeDefined();
    if (packaging?.type !== "table") throw new Error("not a table");

    expect(packaging.rows.map((row) => row[0])).toEqual(tierNames());
  });

  it("leaves deliverables out of the pricing doc, which owns scope only", () => {
    const packaging = pricingDoc?.body.find(
      (block) => block.type === "table" && /packaging/i.test(block.title ?? ""),
    );

    if (packaging?.type !== "table") throw new Error("not a table");

    expect(packaging.headers).toEqual(["Tier", "Who it's for", "Scope built"]);
  });
});
