import { describe, expect, it } from "vitest";
import { docs } from "@/features/docs/content";
import { docText } from "@/features/docs/lib/domain/freshness";
import { facts } from "@/lib/facts";

const bodyText = (slug: string): string =>
  JSON.stringify(docs.find((doc) => doc.slug === slug)?.body ?? []);

/**
 * The gated docs an owner pastes into a feed, where a stale number is public.
 * The recruiter and client posts are blocks composed into social-launch-pack,
 * not docs of their own, so they are checked through it.
 */
const POST_DOCS = ["social-launch-pack", "social-launch-kit"];

/** The public page every recruiter and buyer post links to for proof. */
const PUBLIC_PROOF_DOC = "engineering-quality";

describe("the committed facts snapshot", () => {
  it("carries the measured counts the posts quote", () => {
    expect(facts.tests.total).toBeGreaterThan(0);
    expect(facts.tests.smoke).toBeGreaterThan(0);
    expect(facts.tests.axe).toBeGreaterThan(0);
    expect(facts.repo.mergedPrs).toBeGreaterThan(0);
  });

  it("stays internally consistent, so a post cannot quote a total its parts contradict", () => {
    const { unit, integration, smoke, axe, seo, total } = facts.tests;
    expect(unit + integration + smoke + axe + seo).toBe(total);
  });

  it("is committed, unlike the generated pipeline copy, so a deploy still has it", async () => {
    // `.generated/` is git-ignored on purpose. Anything rendered live — rather
    // than baked into a committed PNG — needs a source that survives a deploy.
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { REPO_ROOT } = await import("@/qa/config/repo-root");
    expect(readFileSync(join(REPO_ROOT, ".gitignore"), "utf8")).not.toMatch(/^\/?lib\/facts\//m);
  });
});

describe("posts quote measured numbers, not typed ones", () => {
  it.each(POST_DOCS)("%s quotes no stale test or pull-request count", (slug) => {
    const text = bodyText(slug);
    // These were typed in once and then drifted: 758 tests when the suite had
    // grown past 1,300, and "more than 140" PRs at 165 merged.
    for (const stale of [/\b758\b/, /\bmore than 140\b/i, /\b140\+/, /#1 to #146\b/]) {
      expect(text, `${slug} still quotes ${stale}`).not.toMatch(stale);
    }
  });

  it("quotes the current totals instead", () => {
    const text = bodyText("social-launch-pack");
    expect(text).toContain(facts.tests.total.toLocaleString("en-GB"));
    expect(text).toContain(String(facts.repo.mergedPrs));
  });

  it("keeps the documented before-baselines, which are history and must not move", () => {
    // 116 deep imports, 28 `any` types and so on describe the codebase before
    // the refactor. They are not measurements of today and never change.
    const text = bodyText("social-launch-pack");
    expect(text).toMatch(/\b116\b/);
    expect(text).toMatch(/\b28\b/);
  });
});

/**
 * Until S57 every number a reader could check was behind the owner gate. The
 * posts quote the whole platform — merged PRs and the full suite — and linked to
 * a public page whose only counts were the email builder's delivery log, scoped
 * to PRs #63 to #84. Both were true; side by side they read as an inflated
 * claim, because nothing public stated the current scale at all.
 *
 * So the proof page carries a current-state section rendered from the committed
 * snapshot, and the historical log stays exactly as it was: S56's lesson is that
 * a true sentence gets pinned, not rewritten.
 */
describe("the public proof page states the current scale", () => {
  const proof = docs.find((doc) => doc.slug === PUBLIC_PROOF_DOC);

  /**
   * The current-state section's own blocks, not the whole page. `docText`
   * includes the summary, so asserting against it would let the numbers be
   * moved into the summary and the section deleted - which is how S51's
   * changelog guard passed with its entry removed.
   */
  const currentSection = () => {
    const body = proof?.body ?? [];
    const start = body.findIndex(
      (block) => block.type === "heading" && /\btoday\b/i.test(block.text),
    );
    if (start === -1) return "";
    const rest = body.slice(start + 1);
    const end = rest.findIndex((block) => block.type === "heading");
    return JSON.stringify(end === -1 ? rest : rest.slice(0, end));
  };

  it("is public, so a reader who clicks a post can check the claim", () => {
    expect(proof, `${PUBLIC_PROOF_DOC} should exist`).toBeDefined();
    expect(proof!.access ?? "public").toBe("public");
    expect(proof!.audience).toBe("cto");
  });

  it("has a current-state section", () => {
    const headings = (proof?.body ?? []).flatMap((block) =>
      block.type === "heading" ? [block.text] : [],
    );
    expect(headings).toEqual(
      expect.arrayContaining([expect.stringMatching(/\btoday\b/i)]),
    );
  });

  it("quotes the merged-PR and test counts from the snapshot, not typed in", () => {
    const section = currentSection();
    expect(section, "merged pull requests").toContain(String(facts.repo.mergedPrs));
    expect(section, "latest PR").toContain(String(facts.repo.latestPr));
    expect(section, "total tests").toContain(facts.tests.total.toLocaleString("en-GB"));
    expect(section, "unit tests").toContain(facts.tests.unit.toLocaleString("en-GB"));
  });

  it("quotes the measured coverage, so the ratchet is visible to a buyer", () => {
    const section = currentSection();
    expect(section).toContain(String(facts.coverage.lines));
    expect(section).toContain(String(facts.coverage.branches));
  });

  it("keeps the email builder's delivery log, which is history and must not move", () => {
    const text = docText(proof!);
    // Scoped to PRs #63-#84 on purpose. A current-state section sitting above it
    // is what makes the smaller figures legible as a subset.
    expect(text).toContain("22 merged PRs");
    expect(text).toContain("165 at PR #83");
  });
});

/**
 * Every count phrase in a public doc, checked against the snapshot. The
 * allow-list holds the lines that are history rather than a measurement of
 * today, each lifted from the file with its reason - an invented allow case
 * cannot catch a guard that is too greedy (S52).
 *
 * It sweeps `docText`, which is the prose a reader reads. Chart series are not
 * in it: those are a plotted history or an explicitly illustrative model, and
 * the charts' own captions say so.
 */
const COUNT_PHRASES = [
  /(\d[\d,]*)\s+(?:automated\s+|new\s+)?tests?\b/gi,
  /(\d[\d,]*)\s+merged\s+(?:PRs|pull requests)\b/gi,
  /(\d[\d,]*)\s+unit\b/gi,
];

const HISTORY_NOT_A_MEASUREMENT = [
  // The email builder's own delivery log, scoped by the PR range beside it.
  "22 merged PRs",
  // One feature's red-first count, not the suite's size.
  "new tests confirmed failing before any code was written",
  // The runtime count at one merge commit, PR #83.
  "The runtime count is higher",
  // What's New recording how far the snapshot had drifted before S54 caught it.
  "behind the real work",
];

const MEASURED = new Set(
  [
    facts.tests.total,
    facts.tests.unit,
    facts.tests.integration,
    facts.tests.smoke,
    facts.tests.axe,
    facts.tests.seo,
    facts.repo.mergedPrs,
  ].map(String),
);

describe("no public doc states a count it cannot back", () => {
  const publicDocs = docs.filter((doc) => (doc.access ?? "public") === "public");

  it("has public docs to check, so the sweep cannot pass vacuously", () => {
    expect(publicDocs.length).toBeGreaterThan(20);
  });

  it("states only counts that are measured or recorded history", () => {
    const unbacked: string[] = [];
    for (const doc of publicDocs) {
      for (const line of docText(doc).split("\n")) {
        if (HISTORY_NOT_A_MEASUREMENT.some((allowed) => line.includes(allowed))) continue;
        for (const pattern of COUNT_PHRASES) {
          for (const match of line.matchAll(new RegExp(pattern.source, pattern.flags))) {
            if (MEASURED.has(match[1].replace(/,/g, ""))) continue;
            if (MEASURED.has(match[1])) continue;
            unbacked.push(`${doc.slug}: "${match[0]}"`);
          }
        }
      }
    }
    expect(unbacked, "a public count that is neither measured nor allow-listed history").toEqual([]);
  });
});
