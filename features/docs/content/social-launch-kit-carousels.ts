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
      ["Email case study", "/showcase/social/linkedin-carousel.pdf", "Hiring managers and CTOs"],
      ["Recruiter pack", "/showcase/social/linkedin-recruiter-carousel.pdf", "Recruiters and hiring managers"],
      ["Buyer pack", "/showcase/social/linkedin-buyer-carousel.pdf", "Business owners and buyers"],
      ["Engineer pack", "/showcase/social/linkedin-engineer-carousel.pdf", "Engineers and technical leads"],
      [
        "Checkout, step by step",
        "/showcase/social/linkedin-checkout-sequence-carousel.pdf",
        "Everyone: one flow, one step per swipe",
      ],
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
      ["1", "/showcase/social/sequence-checkout-cover.png", "What happens when you press Pay"],
      ["2", "/showcase/social/sequence-checkout-1.png", "The browser sends products, never prices"],
      ["3", "/showcase/social/sequence-checkout-2.png", "The server recomputes the total"],
      ["4", "/showcase/social/sequence-checkout-3.png", "An idempotency key stops double charges"],
      ["5", "/showcase/social/sequence-checkout-4.png", "A verified webhook marks the order paid"],
      ["6", "/showcase/social/sequence-checkout-5.png", "The confirmation email matches the order"],
      ["7", "/showcase/social/recruiter-cta.png", "QR code and contact"],
    ],
  },
  {
    type: "image",
    src: "/showcase/social/sequence-checkout-cover.png",
    alt: "Cover slide titled 'What happens when you press Pay' listing five checkout steps: customer pays, total re-checked, Stripe charges once, order saved, email sent.",
    caption: "Sequence 1. The whole flow up front.",
    width: 1080,
    height: 1350,
  },
  {
    type: "image",
    src: "/showcase/social/sequence-checkout-3.png",
    alt: "Step 3 of 5 slide titled 'Stripe charges exactly once' with the third step highlighted in the step list.",
    caption: "Sequence 4. One step per swipe, current step lit up.",
    width: 1080,
    height: 1350,
  },
]
