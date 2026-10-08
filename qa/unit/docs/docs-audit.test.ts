import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { docs } from "@/features/docs/content";
import { docText, missingMentions } from "@/features/docs/lib/domain/freshness";
import { REPO_ROOT } from "@/qa/config/repo-root";

const read = (path: string) => readFileSync(join(REPO_ROOT, path), "utf8");
const docBySlug = (slug: string) => {
  const doc = docs.find((d) => d.slug === slug);
  if (!doc) throw new Error(`missing doc ${slug}`);
  return doc;
};

const showcaseScripts = Object.keys(
  (JSON.parse(read("package.json")) as { scripts: Record<string, string> }).scripts,
).filter((name) => name.startsWith("showcase:"));

describe("S37 back-in-stock alerts guide", () => {
  const guide = docBySlug("back-in-stock-alerts");
  const text = docText(guide);

  it("is an admin guide in the catalog section", () => {
    expect(guide.audience).toBe("content");
    expect(guide.category).toBe("Catalog");
  });

  it("covers the whole lifecycle in plain words", () => {
    expect(
      missingMentions(text, [
        "Notify me",
        "pre-order",
        "once",
        "unsubscribe",
        "Waiting",
        "Most wanted",
        "rate limit",
      ]),
    ).toEqual([]);
  });

  it("is linked from the product catalog guide", () => {
    expect(docText(docBySlug("managing-the-product-catalog"))).toContain(
      "/docs/back-in-stock-alerts",
    );
  });
});

describe("S37 showcase pipeline runbook", () => {
  it("exists and is listed in the README", () => {
    expect(existsSync(join(REPO_ROOT, "docs/showcase-pipeline.md"))).toBe(true);
    expect(read("README.md")).toContain("docs/showcase-pipeline.md");
  });

  it("documents every showcase script in package.json", () => {
    expect(showcaseScripts.length).toBeGreaterThan(0);
    expect(missingMentions(read("docs/showcase-pipeline.md"), showcaseScripts)).toEqual([]);
  });

  it("names every carousel's folder and the clean-up step", () => {
    const runbook = read("docs/showcase-pipeline.md");
    // Each carousel is `carousel.pdf` inside its own folder, so the runbook names
    // the folder a reader has to open rather than eight near-identical filenames.
    expect(
      missingMentions(runbook, [
        "email-case-study/",
        "recruiter/",
        "buyer/",
        "engineer/",
        "checkout-sequence/",
        "security/",
        "how-it-was-built/",
        "site-tour/",
        "showcase:unseed",
      ]),
    ).toEqual([]);
  });
});

describe("S37 docs catch up with shipped features", () => {
  it("what's new covers stock alerts, sign-in checkout and the carousels", () => {
    expect(
      missingMentions(docText(docBySlug("whats-new")), [
        "back-in-stock",
        "sign in",
        "carousel",
      ]),
    ).toEqual([]);
  });

  it("the checkout architecture guide says checkout needs an account", () => {
    expect(docText(docBySlug("commerce-cart-checkout-architecture"))).toMatch(
      /sign(ed)? in/i,
    );
  });

  it("the FAQ answers why checkout asks you to sign in", () => {
    expect(docText(docBySlug("frequently-asked-questions"))).toMatch(
      /sign in to (check out|checkout)/i,
    );
  });

  it("the template handover lists stock alerts and demo-data clean-up", () => {
    const handover = read("docs/template-handover.md");
    expect(missingMentions(handover, ["StockAlert", "showcase:unseed", "docs/showcase-pipeline.md"])).toEqual([]);
  });

  it("the architecture doc lists the stock-alerts and showcase slices", () => {
    expect(missingMentions(read("docs/architecture.md"), ["features/stock-alerts", "features/showcase"])).toEqual([]);
  });
});
