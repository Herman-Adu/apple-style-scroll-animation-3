import type { Infographic } from "./infographics"

/**
 * Slides for the reader who has to justify the decision to someone else.
 *
 * Only two: the catalogue already had a slide for every other argument in the
 * business case, and these are the two it had none for. Both summarise a public
 * doc, and `qa/unit/showcase/business-case-pack.test.ts` binds each row label to
 * the page it came from - so the brief cannot drift into a different argument
 * than the one a reader is sent to.
 *
 * Row labels are the docs' own wording. The cells are condensed to fit a slide;
 * the full three-way comparison, with its qualifications, stays in the doc.
 */
export const ctoInfographics: Infographic[] = [
  {
    id: "infographic-cto-build-vs-buy",
    kind: "table",
    format: "carousel",
    pack: "cto",
    eyebrow: "The decision",
    title: "Three honest options, not one sales pitch.",
    summary: "Each is right for someone. The skill is matching it to the business.",
    columns: ["Option", "Best when", "The catch"],
    rows: [
      {
        label: "All-in-one platform",
        cells: ["Standard needs, no infrastructure", "Per-page tax and real lock-in"],
      },
      {
        label: "Cheap template",
        cells: ["Live this week, cheaply", "Brittle, and rebuilt sooner than planned"],
      },
      {
        label: "Purpose-built stack",
        cells: ["Content and speed are levers", "Higher up-front build"],
      },
    ],
  },
  {
    id: "infographic-cto-replatform-risk",
    kind: "table",
    format: "carousel",
    pack: "cto",
    eyebrow: "Cost of ownership",
    title: "The bill arrives after launch, not at it.",
    summary: "Where three years of cost actually goes, and what a rebuild costs.",
    columns: ["Cost centre", "Cheap template", "This platform"],
    rows: [
      { label: "Initial build", cells: ["Low", "Medium"] },
      { label: "Editor / content time", cells: ["High, engineer in the loop", "Low, editors self-serve"] },
      { label: "Platform / license fees", cells: ["Low", "Low"] },
      { label: "Replatform risk", cells: ["High, a rebuild is likely", "Low, the CMS is swappable"] },
    ],
  },
]
