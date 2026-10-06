import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { docs } from "@/features/docs/content";
import { docText } from "@/features/docs/lib/domain/freshness";
import type { DocBlock } from "@/features/docs/lib/domain/schema";
import { REPO_ROOT } from "@/qa/config/repo-root";

/**
 * The launch pack is copy the owner pastes straight into LinkedIn, Telegram and X,
 * so its limits and honesty rules are enforced here instead of by eye on posting day.
 */
const pack = docs.find((doc) => doc.slug === "social-launch-pack");

const LINKEDIN_POST_LIMIT = 3000;
const X_POST_LIMIT = 280;
const TELEGRAM_POST_LIMIT = 4096;
const ALLOWED_PLACEHOLDERS = new Set(["[live URL]", "[your name]"]);
const OVERCLAIMS = [
  /production[- ]ready/i,
  /battle[- ]tested/i,
  /live in production/i,
  /scheduled sends? (?:are|is) live/i,
  /over 18 prs/i,
];

type CodeBlock = Extract<DocBlock, { type: "code" }>;

const postsTitled = (prefix: string) =>
  (pack?.body ?? []).filter(
    (block): block is CodeBlock =>
      block.type === "code" && (block.title ?? "").startsWith(prefix),
  );

const allPosts = () => (pack?.body ?? []).filter((b): b is CodeBlock => b.type === "code");

const headings = () =>
  (pack?.body ?? []).flatMap((block) => (block.type === "heading" ? [block.text] : []));

describe("social launch pack", () => {
  it("is registered as an owner-only positioning doc", () => {
    expect(pack).toBeDefined();
    expect(pack?.audience).toBe("owner");
    expect(pack?.access).toBe("owner");
    expect(pack?.category).toBe("Positioning");
  });

  it("has a recruiter section and a client section", () => {
    expect(headings()).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/recruit/i),
        expect.stringMatching(/client/i),
      ]),
    );
  });

  it("covers LinkedIn, Telegram and X for both audiences", () => {
    expect(postsTitled("LinkedIn").length).toBeGreaterThanOrEqual(3);
    expect(postsTitled("Telegram").length).toBeGreaterThanOrEqual(2);
    expect(postsTitled("X").length).toBeGreaterThanOrEqual(4);
  });

  it("keeps every post inside its channel limit", () => {
    for (const post of postsTitled("LinkedIn")) {
      expect(post.code.length, post.title).toBeLessThanOrEqual(LINKEDIN_POST_LIMIT);
    }
    for (const post of postsTitled("Telegram")) {
      expect(post.code.length, post.title).toBeLessThanOrEqual(TELEGRAM_POST_LIMIT);
    }
    for (const post of postsTitled("X")) {
      expect(post.code.length, post.title).toBeLessThanOrEqual(X_POST_LIMIT);
    }
  });

  it("uses only the agreed placeholders", () => {
    const used = allPosts().flatMap((post) => post.code.match(/\[[^\]\n]+\]/g) ?? []);
    expect(used.filter((token) => !ALLOWED_PLACEHOLDERS.has(token))).toEqual([]);
  });

  it("makes no claim the template cannot back up", () => {
    const text = docText(pack!);
    const hits = OVERCLAIMS.filter((pattern) => pattern.test(text));
    expect(hits).toEqual([]);
  });

  it("only points at media that exists in public/", () => {
    const mediaPaths = [
      ...new Set(docText(pack!).match(/\/showcase\/[A-Za-z0-9_\-./]+\.(?:png|pdf|mp4|jpg)/g) ?? []),
    ];
    expect(mediaPaths.length).toBeGreaterThan(0);
    expect(mediaPaths.filter((path) => !existsSync(join(REPO_ROOT, "public", path)))).toEqual([]);
  });

  it("is listed in the template handover so a fork finds it", () => {
    const handover = readFileSync(join(REPO_ROOT, "docs/template-handover.md"), "utf8");
    expect(handover).toContain("social-launch-pack");
  });
});

describe("docs caught up with the architecture work", () => {
  const whatsNew = docText(docs.find((doc) => doc.slug === "whats-new")!);
  const architecture = readFileSync(join(REPO_ROOT, "docs/architecture.md"), "utf8");
  const conventions = readFileSync(join(REPO_ROOT, "docs/conventions.md"), "utf8");

  it.each(["#101", "#103", "#106", "#114", "#121", "#122", "#124", "#146"])(
    "the changelog records PR %s",
    (pr) => {
      expect(whatsNew).toContain(pr);
    },
  );

  it("architecture.md describes the four-folder lib split", () => {
    expect(architecture).toMatch(/actions\s*\/\s*data\s*\/\s*domain\s*\/\s*adapters/);
  });

  it("conventions.md no longer points at the removed features/*/api folder", () => {
    expect(conventions).not.toMatch(/features\/\*\/api/);
    expect(conventions).not.toMatch(/admin-actions\.ts/);
  });

  it("the social launch kit no longer quotes a stale PR count", () => {
    const kit = docText(docs.find((doc) => doc.slug === "social-launch-kit")!);
    expect(kit).not.toMatch(/over 18 prs/i);
  });
});

describe("ledger continuity through S20", () => {
  const ledger = readFileSync(join(REPO_ROOT, "docs/next-steps.md"), "utf8");

  it.each([
    ["S17", "#144", "d30bc71"],
    ["S18", "#145", "c362c21"],
    ["S19", "#146", "a120fc0"],
  ])("records %s with PR %s and merge %s", (sprint, pr, sha) => {
    const row = ledger.split("\n").find((line) => line.startsWith(`| ${sprint} `));
    expect(row, `${sprint} ledger row`).toBeDefined();
    expect(row).toContain(pr);
    expect(row).toContain(sha);
  });

  it("has an S20 row for this docs catch-up", () => {
    expect(ledger.split("\n").some((line) => line.startsWith("| S20 "))).toBe(true);
  });
});
