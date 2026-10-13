import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { docs } from "@/features/docs/content";
import { socialLaunchPackClientBlocks } from "@/features/docs/content/social-launch-pack-client";
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
// LinkedIn's own field limits. A headline or About section over them is
// silently truncated in the middle of a sentence, which is worse than short.
const LINKEDIN_HEADLINE_LIMIT = 220;
const LINKEDIN_ABOUT_LIMIT = 2600;
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

/** The blocks under one heading, up to the next one. */
const section = (heading: RegExp) => {
  const body = pack?.body ?? [];
  const start = body.findIndex((block) => block.type === "heading" && heading.test(block.text));
  if (start === -1) return [];
  const rest = body.slice(start + 1);
  const end = rest.findIndex((block) => block.type === "heading");
  return end === -1 ? rest : rest.slice(0, end);
};

const PROFILE_SECTION = /profile and discoverability/i;

const profileBlocks = () => section(PROFILE_SECTION);

const profileText = () =>
  profileBlocks()
    .flatMap((block) => blockStrings(block))
    .join("\n");

/** Every string a block renders, so copy is scanned rather than structure. */
function blockStrings(block: DocBlock): string[] {
  switch (block.type) {
    case "paragraph":
    case "heading":
      return [block.text];
    case "callout":
      return [block.title ?? "", block.text];
    case "list":
      return block.items;
    case "code":
      return [block.title ?? "", block.code];
    case "table":
      return [block.title ?? "", ...block.headers, ...block.rows.flat()];
    default:
      return [];
  }
}

const profileCode = (title: RegExp) =>
  profileBlocks().filter(
    (block): block is CodeBlock => block.type === "code" && title.test(block.title ?? ""),
  );

/** One skill per line, in the order the owner should add them. */
const skillLines = () =>
  (profileCode(/skills/i)[0]?.code ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

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

  it("has a profile and discoverability section", () => {
    expect(headings()).toEqual(expect.arrayContaining([expect.stringMatching(PROFILE_SECTION)]));
  });

  it("offers a headline per angle, each inside LinkedIn's headline limit", () => {
    const headlines = profileCode(/^Profile headline/);
    expect(headlines.length, "a headline for recruiter search and one for client work").toBeGreaterThanOrEqual(2);
    for (const headline of headlines) {
      expect(headline.code.length, headline.title).toBeLessThanOrEqual(LINKEDIN_HEADLINE_LIMIT);
    }
  });

  it("carries About copy inside LinkedIn's About limit", () => {
    const about = profileCode(/About/i)[0];
    expect(about, "no About copy in the profile section").toBeDefined();
    // A floor as well as a ceiling: an empty stub would otherwise pass.
    expect(about!.code.length).toBeGreaterThan(600);
    expect(about!.code.length).toBeLessThanOrEqual(LINKEDIN_ABOUT_LIMIT);
  });

  it("orders the skills list for recruiter search, leading with the headline's own terms", () => {
    const skills = skillLines();
    // LinkedIn pins the first three skills to the profile and matches them in
    // recruiter search, so those three have to be the terms the headline leads
    // with rather than whatever was typed first.
    expect(skills.length, "a recruiter-ordered skills list").toBeGreaterThanOrEqual(15);
    const recommended = profileCode(/^Profile headline/)[0];
    expect(recommended).toBeDefined();
    expect(skills.slice(0, 3).filter((skill) => !recommended!.code.includes(skill))).toEqual([]);
  });

  it("recommends recruiter-only mode for Open to Work and records why", () => {
    const text = profileText();
    expect(text, "no Open to Work recommendation").toMatch(/open to work/i);
    expect(text).toMatch(/recruiters? only|recruiter-only/i);
    // The reason is the point: the public badge reads to a buyer as "this
    // person is leaving", which undercuts the handover promise.
    expect(text).toMatch(/leaving/i);
    expect(text).toMatch(/handover/i);
  });

  it("never points a client-facing block at the public Open to Work signal", () => {
    const client = socialLaunchPackClientBlocks.flatMap((block) => blockStrings(block)).join("\n");
    expect(client).not.toMatch(/#opentowork/i);
    expect(client).not.toMatch(/open to work/i);
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

describe("the #opentowork advice in the recruitment playbook", () => {
  const playbook = docs.find((doc) => doc.slug === "social-and-recruitment-marketing")!;

  /**
   * The hashtag is advice; a post that happens to carry it is a sample the
   * owner edits before publishing. So only the non-`code` blocks are swept:
   * those are the lines that tell the reader what to do.
   */
  const adviceLines = () =>
    playbook.body
      .filter((block) => block.type !== "code")
      .flatMap((block) => blockStrings(block))
      .filter((line) => /#opentowork/i.test(line));

  it("still gives the hashtag, so recruiter reach is not lost", () => {
    expect(adviceLines().length).toBeGreaterThan(0);
  });

  it("never recommends it without the recruiter-only caveat", () => {
    expect(
      adviceLines().filter((line) => !/recruiters? only|recruiter-only/i.test(line)),
    ).toEqual([]);
  });

  it("says the hashtag is as public as the badge, and points at the pack", () => {
    const caveat = adviceLines().join("\n");
    expect(caveat).toMatch(/public/i);
    expect(caveat).toMatch(/leaving/i);
    expect(caveat).toContain("/docs/social-launch-pack");
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
