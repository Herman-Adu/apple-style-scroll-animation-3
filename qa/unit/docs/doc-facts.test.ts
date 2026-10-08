import { describe, expect, it } from "vitest";
import { docs } from "@/features/docs/content";
import { facts } from "@/lib/facts";

const bodyText = (slug: string): string =>
  JSON.stringify(docs.find((doc) => doc.slug === slug)?.body ?? []);

/**
 * The gated docs an owner pastes into a feed, where a stale number is public.
 * The recruiter and client posts are blocks composed into social-launch-pack,
 * not docs of their own, so they are checked through it.
 */
const POST_DOCS = ["social-launch-pack", "social-launch-kit"];

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
