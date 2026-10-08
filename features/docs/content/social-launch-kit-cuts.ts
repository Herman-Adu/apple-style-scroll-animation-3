import type { DocBlock } from "../lib/domain/schema"

/** Audience cuts for the launch kit: one joined video per audience, in feed and story formats. */
export const launchKitCutBlocks: DocBlock[] = [
  { type: "heading", text: "Audience cuts" },
  {
    type: "paragraph",
    text: "Each cut joins a few clips into one video for a single audience. The recruiter cut shows the storefront and the engineering proof. The buyer cut shows the store end to end: storefront, checkout, back in stock, campaigns, discounts and orders. The site tour and the enquiry form are published on their own rather than lengthening it. The engineer cut shows the engineering proof and checkout. Every real customer in these recordings is shown as a stand-in on the demo domain.",
  },
  {
    type: "video",
    src: "/showcase/video/cut-recruiter-4x5.mp4",
    poster: "/showcase/video/cut-recruiter-4x5.jpg",
    description:
      "Screen recording in 4:5: the scrolling storefront and product pages, followed by the engineering proof with test counts, coverage and the architecture checks.",
    caption: "Recruiter cut, 4:5 feed format.",
  },
  {
    type: "video",
    src: "/showcase/video/cut-recruiter-9x16.mp4",
    poster: "/showcase/video/cut-recruiter-9x16.jpg",
    description: "The recruiter cut in 9:16 for stories and reels: storefront, then engineering proof.",
    caption: "Recruiter cut, 9:16 story format.",
  },
  {
    type: "video",
    src: "/showcase/video/cut-buyer-4x5.mp4",
    poster: "/showcase/video/cut-buyer-4x5.jpg",
    description:
      "Screen recording in 4:5: storefront, checkout with a discount code, a back-in-stock restock, email campaigns, discounts and message templates, then orders, customers and analytics in the admin.",
    caption: "Buyer cut, 4:5 feed format.",
  },
  {
    type: "video",
    src: "/showcase/video/cut-buyer-9x16.mp4",
    poster: "/showcase/video/cut-buyer-9x16.jpg",
    description:
      "The buyer cut in 9:16 for stories and reels: storefront, checkout, restock, campaigns, discounts, then orders and analytics.",
    caption: "Buyer cut, 9:16 story format.",
  },
  {
    type: "video",
    src: "/showcase/video/cut-engineer-4x5.mp4",
    poster: "/showcase/video/cut-engineer-4x5.jpg",
    description:
      "Screen recording in 4:5: the engineering proof with test counts, coverage and architecture checks, then a checkout with a discount code.",
    caption: "Engineer cut, 4:5 feed format.",
  },
  {
    type: "video",
    src: "/showcase/video/cut-engineer-9x16.mp4",
    poster: "/showcase/video/cut-engineer-9x16.jpg",
    description: "The engineer cut in 9:16 for stories and reels: engineering proof, then checkout.",
    caption: "Engineer cut, 9:16 story format.",
  },
]
