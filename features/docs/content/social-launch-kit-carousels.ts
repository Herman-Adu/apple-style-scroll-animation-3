import type { DocBlock } from "../lib/domain/schema"

/** Ready-to-post carousel PDFs, one per pack, plus the checkout sequence told one step per swipe. */
export const launchKitCarouselBlocks: DocBlock[] = [
  { type: "heading", text: "Carousels ready to post" },
  {
    type: "paragraph",
    text: "Each pack below also ships as one swipeable PDF, so it can go straight up as a LinkedIn document post without stitching PNGs together. Pages follow the pack order and carry a page counter. Re-export with pnpm showcase:assets after copy or design changes.",
  },
  {
    type: "table",
    headers: ["Carousel", "File", "Who it is for"],
    rows: [
      ["Email case study", "/showcase/social/email-case-study/carousel.pdf", "Hiring managers and CTOs"],
      ["Recruiter pack", "/showcase/social/recruiter/carousel.pdf", "Recruiters and hiring managers"],
      ["Buyer pack", "/showcase/social/buyer/carousel.pdf", "Business owners and buyers"],
      ["Engineer pack", "/showcase/social/engineer/carousel.pdf", "Engineers and technical leads"],
      [
        "Checkout, step by step",
        "/showcase/social/checkout-sequence/carousel.pdf",
        "Everyone: one flow, one step per swipe",
      ],
      [
        "Security, layer by layer",
        "/showcase/social/security/carousel.pdf",
        "Engineers and buyers who ask who can touch the data",
      ],
      [
        "How it was built",
        "/showcase/social/how-it-was-built/carousel.pdf",
        "Recruiters and engineers: the delivery process",
      ],
      ["Site tour", "/showcase/social/site-tour/carousel.pdf", "Everyone: what the site looks like, stop by stop"],
    ],
  },
  { type: "heading", text: "Checkout, step by step" },
  {
    type: "paragraph",
    text: "The checkout sequence diagram told one step per swipe. Every slide shows the whole flow with the current step lit up, so a reader always knows where they are. Each claim matches the checkout action and the Stripe webhook route.",
  },
  {
    type: "table",
    headers: ["Order", "Slide", "Job"],
    rows: [
      ["1", "/showcase/social/checkout-sequence/cover.png", "What happens when you press Pay"],
      ["2", "/showcase/social/checkout-sequence/1.png", "The browser sends products, never prices"],
      ["3", "/showcase/social/checkout-sequence/2.png", "The server recomputes the total"],
      ["4", "/showcase/social/checkout-sequence/3.png", "An idempotency key stops double charges"],
      ["5", "/showcase/social/checkout-sequence/4.png", "A verified webhook marks the order paid"],
      ["6", "/showcase/social/checkout-sequence/5.png", "The confirmation email matches the order"],
      ["7", "/showcase/social/recruiter/cta.png", "QR code and contact"],
    ],
  },
  {
    type: "image",
    src: "/showcase/social/checkout-sequence/cover.png",
    alt: "Cover slide titled 'What happens when you press Pay' listing five checkout steps: customer pays, total re-checked, Stripe charges once, order saved, email sent.",
    caption: "Sequence 1. The whole flow up front.",
    width: 1080,
    height: 1350,
  },
  {
    type: "image",
    src: "/showcase/social/checkout-sequence/3.png",
    alt: "Step 3 of 5 slide titled 'Stripe charges exactly once' with the third step highlighted in the step list.",
    caption: "Sequence 4. One step per swipe, current step lit up.",
    width: 1080,
    height: 1350,
  },
  { type: "heading", text: "Security, layer by layer" },
  {
    type: "paragraph",
    text: "Three permission checks (proxy, server action, screen), then the merge gates and the locked brand blocks. Each claim matches proxy.ts, requireAdmin and the shared permission rules.",
  },
  {
    type: "table",
    headers: ["Order", "Slide", "Job"],
    rows: [
      ["1", "/showcase/social/security/cover.png", "Five things between a click and your data"],
      ["2", "/showcase/social/security/1.png", "The proxy checks the session first"],
      ["3", "/showcase/social/security/2.png", "Every admin action checks again"],
      ["4", "/showcase/social/security/3.png", "The screen only shows what you may use"],
      ["5", "/showcase/social/security/4.png", "No change merges until every check passes"],
      ["6", "/showcase/social/security/5.png", "Brand blocks stay locked, with history"],
      ["7", "/showcase/social/recruiter/cta.png", "QR code and contact"],
    ],
  },
  { type: "heading", text: "How it was built" },
  {
    type: "paragraph",
    text: "The delivery loop every sprint followed, closing on the test-growth chart as proof.",
  },
  {
    type: "table",
    headers: ["Order", "Slide", "Job"],
    rows: [
      ["1", "/showcase/social/how-it-was-built/cover.png", "Thirty-plus sprints, one loop"],
      ["2", "/showcase/social/how-it-was-built/1.png", "Every sprint starts from a written plan"],
      ["3", "/showcase/social/how-it-was-built/2.png", "The failing test comes first"],
      ["4", "/showcase/social/how-it-was-built/3.png", "One sprint, one branch, one pull request"],
      ["5", "/showcase/social/how-it-was-built/4.png", "Merges happen only on green"],
      ["6", "/showcase/social/how-it-was-built/5.png", "Quality can only go up"],
      ["7", "/showcase/social/engineer/tests.png", "Test growth over time"],
      ["8", "/showcase/social/recruiter/cta.png", "QR code and contact"],
    ],
  },
  { type: "heading", text: "Site tour" },
  {
    type: "paragraph",
    text: "Four structure slides derived from the app's own navigation, then one recorded still per stop from the buyer cut. The structure slides need no upkeep; re-take the stills after UI changes by re-recording the cuts.",
  },
  {
    type: "table",
    headers: ["Order", "Slide", "Job"],
    rows: [
      ["1", "/showcase/social/site-tour/structure-overview.png", "One repo, three front doors"],
      ["2", "/showcase/social/site-tour/structure-storefront.png", "What customers see"],
      ["3", "/showcase/social/site-tour/structure-admin.png", "What the owner sees"],
      ["4", "/showcase/social/site-tour/structure-docs.png", "What teams inherit"],
      ["5", "/showcase/social/site-tour/storefront.png", "Real product pages, ready to sell"],
      ["6", "/showcase/social/site-tour/checkout.png", "Discounts show instantly in the total"],
      ["7", "/showcase/social/site-tour/products.png", "Stock and waiting lists at a glance"],
      ["8", "/showcase/social/site-tour/campaigns.png", "Campaigns without a developer"],
      ["9", "/showcase/social/site-tour/analytics.png", "Revenue and orders in one view"],
      ["10", "/showcase/social/email-case-study/cta.png", "Link to the live site"],
    ],
  },
]
