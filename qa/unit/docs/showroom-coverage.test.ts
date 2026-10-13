import { describe, expect, it } from "vitest";
import { docs } from "@/features/docs/content";
import { docText } from "@/features/docs/lib/domain/freshness";
import type { Doc } from "@/features/docs/lib/domain/schema";
import {
  driftedAnswers,
  mentionsAnchor,
  OBJECTION_FLOOR,
  OBJECTION_SOURCES,
  objectionKey,
  parseObjections,
  PUBLIC_ANSWERS,
  type PublicAnswer,
  type ShowroomDoc,
  staleAnswers,
  unansweredObjections,
} from "@/features/docs/lib/domain/showroom";

/**
 * The gated pitch is the source of truth for what a buyer will ask; the public
 * CTO docs are where they read the answer with nobody in the room. This guard
 * fails when the two halves come apart — a new objection with no public home,
 * or a public page edited until the answer it was pinned on has gone.
 */

const doc = (body: Doc["body"]): Doc => ({
  slug: "fixture",
  title: "Fixture",
  category: "Positioning",
  audience: "owner",
  access: "owner",
  summary: "A stand-in for a gated pitch doc.",
  readingMinutes: 1,
  order: 1,
  updatedAt: "2026-10-13",
  tags: [],
  body,
});

describe("parsing the gated pitch", () => {
  it("reads the title of each step in an objection-handling section", () => {
    const parsed = parseObjections(
      doc([
        { type: "heading", text: "Objection handling" },
        {
          type: "steps",
          items: [
            { title: '"It costs more than a template."', text: "The editor time saved pays it back." },
            { title: '"We already have a CMS."', text: "Good — the seam is CMS-agnostic." },
          ],
        },
      ]),
    );

    expect(parsed.map((objection) => objection.question)).toEqual([
      '"It costs more than a template."',
      '"We already have a CMS."',
    ]);
  });

  it("reads the first column of a table whose first header is the objection", () => {
    const parsed = parseObjections(
      doc([
        { type: "heading", text: "Objection handling" },
        {
          type: "table",
          title: "What you will hear, and how to answer",
          headers: ["Objection", "Response"],
          rows: [["Why not just use Shopify?", "Shopify is excellent for a standard store."]],
        },
      ]),
    );

    expect(parsed.map((objection) => objection.question)).toEqual(["Why not just use Shopify?"]);
  });

  it("ignores a table in the section that is not a list of objections", () => {
    const parsed = parseObjections(
      doc([
        { type: "heading", text: "Objection handling" },
        {
          type: "table",
          title: "Illustrative three-year total cost of ownership",
          headers: ["Cost center", "Cheap template"],
          rows: [["Initial build", "Low"]],
        },
      ]),
    );

    expect(parsed).toEqual([]);
  });

  it("ignores everything outside the objection-handling section", () => {
    const parsed = parseObjections(
      doc([
        { type: "heading", text: "The ten-minute demo flow" },
        {
          type: "steps",
          items: [{ title: "Start on the storefront", text: "Scroll the product story." }],
        },
        { type: "heading", text: "Close on a concrete next step" },
        { type: "paragraph", text: "Agree the next action before the call ends." },
      ]),
    );

    expect(parsed).toEqual([]);
  });

  it("names the doc each objection came from", () => {
    const parsed = parseObjections(
      doc([
        { type: "heading", text: "Objection handling" },
        { type: "steps", items: [{ title: '"What if we outgrow it?"', text: "The data is in standard Postgres." }] },
      ]),
    );

    expect(parsed[0]?.source).toBe("fixture");
  });
});

describe("objection keys", () => {
  it("survives the quotes, apostrophes and stops the pitch writes them with", () => {
    expect(objectionKey('"It costs more than a template."')).toBe("it costs more than a template");
    expect(objectionKey("Isn't a custom build risky?")).toBe("isnt a custom build risky");
    expect(objectionKey("Why not Klaviyo / Mailchimp for email?")).toBe(
      "why not klaviyo mailchimp for email",
    );
  });

  it("gives the same key to the same question worded in the gated doc's own style", () => {
    expect(objectionKey("What about email deliverability?")).toBe(
      objectionKey('"What about email deliverability"'),
    );
  });
});

/**
 * Both halves of the anchor check, each case a line lifted from the corpus. An
 * invented line would agree with a guard that is too greedy: a plain substring
 * search finds "ESP" inside "responses" and reports a deliverability answer on
 * a page about edge caching (S52).
 */
describe("anchor matching", () => {
  it.each([
    ["ESP", "Static and cached responses are served from the edge, close to the visitor"],
    ["page", "Per-page tax, hard ceilings, real lock-in"],
    ["rent", "Kept portable: the CMS is a seam, not a dependency"],
  ])("does not read %s out of a line that merely contains the letters", (anchor, line) => {
    expect(mentionsAnchor(line, anchor)).toBe(false);
  });

  it.each([
    ["lock-in", "Per-page tax, hard ceilings, real lock-in"],
    ["All-in-one platform", "All-in-one platform | You want zero infra and standard needs"],
    [
      "CMS is a seam",
      "Kept portable: the CMS is a seam, not a dependency, so switching authoring tools is a mapper change",
    ],
    ["build premium", "The editor-time saving alone typically covers the build premium over a template"],
  ])("finds %s where the answer really is", (anchor, line) => {
    expect(mentionsAnchor(line, anchor)).toBe(true);
  });
});

describe("coverage of the manifest", () => {
  const objections = [
    { key: "what about email deliverability", question: "What about email deliverability?", source: "demo" },
    { key: "what if we outgrow it", question: '"What if we outgrow it?"', source: "selling-points" },
  ];
  const answers: Record<string, PublicAnswer> = {
    "what about email deliverability": {
      doc: "security-and-compliance-posture",
      anchors: ["deliverability"],
    },
  };

  it("reports an objection the public layer was never given an answer for", () => {
    expect(unansweredObjections(objections, answers)).toEqual([
      'selling-points: ""What if we outgrow it?""',
    ]);
  });

  it("reports an answer left behind after its objection was dropped from the pitch", () => {
    expect(staleAnswers([objections[0]!], { ...answers, "why not just use shopify": answers["what about email deliverability"]! })).toEqual([
      "why not just use shopify",
    ]);
  });
});

describe("drift in the public answer", () => {
  const answers: Record<string, PublicAnswer> = {
    "what about email deliverability": {
      doc: "security-and-compliance-posture",
      anchors: ["authenticated sending domain", "opt-in"],
    },
  };
  const showroom = (overrides: Partial<ShowroomDoc>): ShowroomDoc[] => [
    {
      slug: "security-and-compliance-posture",
      text: "Sends leave on an authenticated sending domain, opt-in is respected.",
      access: "public",
      audience: "cto",
      ...overrides,
    },
  ];

  it("passes while the answer is still on the page", () => {
    expect(driftedAnswers(answers, showroom({}))).toEqual([]);
  });

  it("reports the words an edit removed, not just that something changed", () => {
    expect(
      driftedAnswers(answers, showroom({ text: "Sends leave on our own domain." })),
    ).toEqual([
      'what about email deliverability → security-and-compliance-posture: lost the words "authenticated sending domain"',
      'what about email deliverability → security-and-compliance-posture: lost the words "opt-in"',
    ]);
  });

  it("reports an answer that moved behind the owner gate", () => {
    expect(driftedAnswers(answers, showroom({ access: "owner" }))).toEqual([
      "what about email deliverability → security-and-compliance-posture: gated, so the buyer never reads it",
    ]);
  });

  it("reports an answer whose doc is gone", () => {
    expect(driftedAnswers(answers, [])).toEqual([
      "what about email deliverability → security-and-compliance-posture: no such doc",
    ]);
  });
});

describe("the showroom answers the engine room", () => {
  const gated = docs.filter((candidate) => candidate.access === "owner");
  const objections = gated.flatMap(parseObjections);
  const showroom: ShowroomDoc[] = docs.map((candidate) => ({
    slug: candidate.slug,
    text: docText(candidate),
    access: candidate.access ?? "public",
    audience: candidate.audience,
  }));

  it("finds the objection-handling sections, so the guard cannot pass on an empty list", () => {
    expect([...new Set(objections.map((objection) => objection.source))].sort()).toEqual(
      [...OBJECTION_SOURCES].sort(),
    );
    expect(objections.length).toBeGreaterThanOrEqual(OBJECTION_FLOOR);
  });

  it("pins how many objections the pitch carried when this guard was written", () => {
    expect(OBJECTION_FLOOR).toBe(15);
  });

  it("answers every objection the gated pitch commits to, somewhere public", () => {
    expect(unansweredObjections(objections), "an objection with no public answer").toEqual([]);
  });

  it("keeps no answer for an objection the pitch has dropped", () => {
    expect(staleAnswers(objections), "a manifest entry with no objection").toEqual([]);
  });

  it("still has every answer on the public page that claims it", () => {
    expect(driftedAnswers(PUBLIC_ANSWERS, showroom), "a public answer that drifted away").toEqual([]);
  });
});
