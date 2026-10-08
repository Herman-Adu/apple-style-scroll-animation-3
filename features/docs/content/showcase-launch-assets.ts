import type { Doc } from "../lib/domain/schema"
import { launchKitCarouselBlocks } from "./social-launch-kit-carousels"
import { launchKitCutBlocks } from "./social-launch-kit-cuts"
import { launchKitPackBlocks } from "./social-launch-kit-packs"

/**
 * The public half of the launch material: what the template can generate and
 * how to regenerate it. The copy an owner publishes under their own name stays
 * in the owner-gated Positioning docs, which a fork must never inherit.
 */
export const showcaseLaunchAssets: Doc = {
  slug: "showcase-launch-assets",
  title: "Launch Assets This Template Generates",
  category: "DevOps",
  audience: "developer",
  access: "public",
  summary:
    "The repository renders its own launch material: audience carousels as swipeable PDFs, screen-recorded cuts in feed and story formats, and infographic slides whose numbers are read from the latest test run rather than typed in. This page lists what exists, which command rebuilds it, and where each file lands.",
  readingMinutes: 7,
  order: 3,
  updatedAt: "2026-10-08",
  tags: ["showcase", "assets", "carousels", "video", "pipeline", "launch"],
  body: [
    {
      type: "paragraph",
      text: "Most projects write their marketing material by hand and let it drift from the code. This one generates it. Slides are React components rendered by a headless browser, the numbers on them are read from the latest test and coverage run, and the whole set rebuilds with one command.",
    },
    {
      type: "callout",
      variant: "info",
      text: "Every number on a generated slide comes from a fact reference, never from typed-in copy. A slide that names a figure the pipeline cannot supply fails its unit test rather than shipping a stale one.",
    },
    { type: "heading", text: "Rebuilding the set" },
    {
      type: "paragraph",
      text: "One command runs the measurement step and then the render, so the figures on the slides always match the run that produced them. It writes PNGs for every slide and a PDF for every carousel.",
    },
    {
      type: "code",
      language: "bash",
      title: "Render every slide and carousel",
      code: `pnpm showcase:assets`,
    },
    {
      type: "paragraph",
      text: "The render is deterministic: the same commit on the same machine produces byte-identical files, because the fonts are self-hosted rather than resolved from whatever the renderer happens to have installed. The full pipeline, including the demo seed and the clip recordings, is documented in docs/showcase-pipeline.md.",
    },
    {
      type: "steps",
      items: [
        {
          title: "Seed the demo store",
          text: "Writes a tagged demo set — customers, orders, offers and waiting lists — so the recordings and charts have something real to show. The seed prints its target database and writes nothing until confirmed.",
        },
        {
          title: "Record the clips",
          text: "Playwright drives the running app and records each clip, then stitches them into one cut per audience in both feed and story formats.",
        },
        {
          title: "Measure and render",
          text: "pnpm showcase:assets runs the test and coverage pass first, writes the figures it measured, then renders every slide and carousel from them.",
        },
        {
          title: "Remove the demo rows",
          text: "Deletes only the rows tagged as demo, so a store's real data is never touched.",
        },
      ],
    },
    ...launchKitCarouselBlocks,
    ...launchKitPackBlocks,
    ...launchKitCutBlocks,
  ],
}
