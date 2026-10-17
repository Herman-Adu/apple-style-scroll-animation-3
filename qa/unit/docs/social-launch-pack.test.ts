import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { docs } from "@/features/docs/content";
import { facts } from "@/lib/facts";
import { socialLaunchPackClientBlocks } from "@/features/docs/content/social-launch-pack-client";
import { docText } from "@/features/docs/lib/domain/freshness";
import type { DocBlock } from "@/features/docs/lib/domain/schema";
import { absoluteUrl } from "@/lib/seo/site";
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
// The Adu Dev company page's own fields, which are shorter than the personal
// profile's and are not interchangeable with them.
const LINKEDIN_TAGLINE_LIMIT = 120;
const LINKEDIN_COMPANY_OVERVIEW_LIMIT = 2000;
const FACEBOOK_SHORT_DESCRIPTION_LIMIT = 255;
/**
 * `[your name]` is filled in by the reader as they send the DM, so it stays.
 * `[live URL]` was on this list until S63 and that is why twenty of them
 * survived into copy meant to be pasted straight into LinkedIn: the host is
 * resolvable from `absoluteUrl("")`, so a placeholder for it is a bug, not an
 * instruction. Allowing it here is what kept the guard quiet.
 */
const ALLOWED_PLACEHOLDERS = new Set(["[your name]"]);
const OVERCLAIMS = [
  /production[- ]ready/i,
  /battle[- ]tested/i,
  /live in production/i,
  /scheduled sends? (?:are|is) live/i,
  /over 18 prs/i,
];

type CodeBlock = Extract<DocBlock, { type: "code" }>;

const docSlugs = new Set(docs.map((doc) => doc.slug));

/** Every absolute URL the doc renders. Sentence punctuation is not part of the link. */
const urlsIn = (text: string) =>
  (text.match(/https?:\/\/[^\s)\]]+/g) ?? []).map((url) => new URL(url.replace(/[.,;:!?]+$/, "")));

/**
 * How long a block is once it is pasted into the field, not how long it is in
 * this run. `absoluteUrl("")` is `http://localhost:3000` under CI's env and
 * `https://momo-audio.adudev.co.uk` on the deployed site - ten characters
 * longer per link - so a guard that measured the rendered string would pass an
 * About that LinkedIn truncates for the owner and for nobody else. The only
 * part of the copy that varies by environment is the origin, so growing each
 * link by the difference measures what the owner actually pastes.
 */
const DEPLOYED_ORIGIN = "https://momo-audio.adudev.co.uk";
const pastedLength = (code: string) => {
  const grow = Math.max(0, DEPLOYED_ORIGIN.length - new URL(absoluteUrl("")).origin.length);
  return code.length + urlsIn(code).length * grow;
};

/**
 * Does a path in the posting copy lead anywhere? The freshness guard checks
 * that a `/docs/<slug>` link names a doc that exists, which is most of the
 * pack but not all of it: a post is free to link the storefront or a PDF, and
 * nothing checked those. A link in published copy that 404s costs more than a
 * stale one, because the reader is a recruiter or a buyer who clicked it.
 */
const resolves = (pathname: string) => {
  const path = pathname.replace(/\/$/, "");
  if (path === "") return true;
  const doc = /^\/docs\/([a-z0-9-]+)$/.exec(path);
  if (doc) return docSlugs.has(doc[1]);
  if (existsSync(join(REPO_ROOT, "public", path))) return true;
  return ["page.tsx", "page.ts", "route.ts"].some((file) =>
    existsSync(join(REPO_ROOT, "app", path, file)),
  );
};

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
    expect(pastedLength(about!.code), about!.title).toBeLessThanOrEqual(LINKEDIN_ABOUT_LIMIT);
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
    // Anchored on the claim the badge undercuts, not on the word "handover".
    // That word was never in this callout: it came from the old recruiter
    // headline ("handover-ready commerce builds"), which the agreed profile
    // copy replaces, and the offer it described is built-and-run rather than a
    // handover. A guard that reads it from a block three fields away reports
    // nothing about whether the reason is still recorded here.
    expect(text).toMatch(/client work/i);
    expect(text).toMatch(/run it without you/i);
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

  // The posts are not the only copy the owner reads. The "Before you post"
  // callout told the reader to replace a placeholder, so the instruction and
  // the placeholder had to be removed together; sweeping only the code blocks
  // would have left the instruction behind, pointing at nothing.
  it("uses only the agreed placeholders anywhere in the doc, not only in the posts", () => {
    const used = docText(pack!).match(/\[[^\]\n]+\]/g) ?? [];
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

  it("points every link at this site's own origin", () => {
    const hosts = [...new Set(urlsIn(docText(pack!)).map((url) => url.origin))];
    // A hardcoded host drifts the moment a fork re-points the site, and a
    // `*.vercel.app` one is worse than drift: sign-in there fails with an
    // invalid-origin error and the session is lost after checkout.
    expect(hosts).toEqual([new URL(absoluteUrl("")).origin]);
  });

  it("links only to pages that exist", () => {
    const paths = [...new Set(urlsIn(docText(pack!)).map((url) => url.pathname))];
    expect(paths.length, "no links in the pack to check").toBeGreaterThan(0);
    expect(paths.filter((path) => !resolves(path))).toEqual([]);
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
  const ledger = readFileSync(join(REPO_ROOT, "docs/sprint-ledger.md"), "utf8");

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

/**
 * The profile copy agreed on 2026-10-16 (`docs/hand-off/profile-copy-s68.md`).
 * It is three channels, not one: LinkedIn allows a single personal profile, so
 * Herman's is recruiter-first and the client offer lives on the Adu Dev
 * company page. Each field here is pasted into a different box with a
 * different ceiling, which is why the limits are not shared.
 */
describe("the agreed profile copy", () => {
  const SOURCES = [
    "features/docs/content/social-launch-pack-recruiter.ts",
    "features/docs/content/social-launch-pack-client.ts",
  ];

  const headline = () => profileCode(/^Profile headline - Herman Adu/)[0];
  const about = () => profileCode(/^Profile About/)[0];
  const tagline = () => profileCode(/^Profile headline - Adu Dev/)[0];
  const overview = () => profileCode(/^Profile overview - Adu Dev/)[0];
  const facebook = () => profileCode(/^Profile description - Adu Dev/)[0];

  /** The rendered counts, as the reader sees them in the copy. */
  const renderedCounts = () => [
    String(facts.repo.mergedPrs),
    facts.tests.total.toLocaleString("en-GB"),
  ];

  it("carries a field for each of the three channels", () => {
    for (const [name, block] of [
      ["personal headline", headline()],
      ["About", about()],
      ["Adu Dev tagline", tagline()],
      ["Adu Dev overview", overview()],
      ["Facebook short description", facebook()],
    ] as const) {
      expect(block, `no ${name} in the profile section`).toBeDefined();
    }
  });

  it("keeps each field inside the limit of the box it is pasted into", () => {
    expect(pastedLength(headline()!.code), "personal headline").toBeLessThanOrEqual(
      LINKEDIN_HEADLINE_LIMIT,
    );
    expect(pastedLength(about()!.code), "About").toBeLessThanOrEqual(LINKEDIN_ABOUT_LIMIT);
    // The tagline shares the headline's title prefix but not its ceiling: a
    // company tagline is cut at 120, so the looser headline guard above would
    // pass copy the page truncates.
    expect(pastedLength(tagline()!.code), "Adu Dev tagline").toBeLessThanOrEqual(
      LINKEDIN_TAGLINE_LIMIT,
    );
    expect(pastedLength(overview()!.code), "Adu Dev overview").toBeLessThanOrEqual(
      LINKEDIN_COMPANY_OVERVIEW_LIMIT,
    );
    expect(pastedLength(facebook()!.code), "Facebook short description").toBeLessThanOrEqual(
      FACEBOOK_SHORT_DESCRIPTION_LIMIT,
    );
  });

  it("labels every headline with the channel it belongs to", () => {
    // Before the channel split the personal profile carried a client-angle
    // headline as well, which is now the Adu Dev tagline's job. An unlabelled
    // headline is the old shape coming back.
    const titles = profileCode(/^Profile headline/).map((block) => block.title ?? "");
    expect(titles.length).toBeGreaterThanOrEqual(2);
    expect(titles.filter((title) => !/Herman Adu|Adu Dev/.test(title))).toEqual([]);
  });

  it("reads the PR and test counts from facts instead of typing them in", () => {
    for (const count of renderedCounts()) {
      expect(about()!.code, `About does not render ${count}`).toContain(count);
    }
    // The handoff's numbers rule. A typed literal is correct on the day it is
    // written and wrong at the next merge, and this doc is pasted in public.
    for (const file of SOURCES) {
      const source = readFileSync(join(REPO_ROOT, file), "utf8");
      for (const count of renderedCounts()) {
        expect(source.includes(count), `${file} types ${count} in as a literal`).toBe(false);
      }
    }
  });

  it("scopes the counts to Momo Audio rather than to the owner's work generally", () => {
    const paragraphs = about()!
      .code.split("\n\n")
      .filter((paragraph) => renderedCounts().some((count) => paragraph.includes(count)));
    expect(paragraphs.length, "no About paragraph renders the counts").toBeGreaterThan(0);
    // 2,002 tests is what one repo has, not what the owner has written. A
    // recruiter reading the count as career-wide is a claim he cannot back up.
    expect(paragraphs.filter((paragraph) => !paragraph.includes("Momo Audio"))).toEqual([]);
  });

  it("closes the recruiter-first About with exactly one line naming Adu Dev", () => {
    const paragraphs = about()!.code.split("\n\n");
    const clientDoor = paragraphs.filter((paragraph) => paragraph.includes("Adu Dev"));
    expect(clientDoor, "the client door is one closing line, not a second pitch").toHaveLength(1);
    expect(paragraphs.at(-1)).toBe(clientDoor[0]);
  });

  it("keeps the Adu Dev copy off the recruiter angle and the counts off the client page", () => {
    // The company page sells a built-and-run platform, so a hiring signal
    // there reads as the agency being one person looking for a job.
    const client = overview()!.code + "\n" + facebook()!.code + "\n" + tagline()!.code;
    expect(client).not.toMatch(/open to work|permanent or contract|hiring/i);
    for (const count of renderedCounts()) {
      expect(client, `the client page quotes ${count}, a Momo Audio number`).not.toContain(count);
    }
  });
});
