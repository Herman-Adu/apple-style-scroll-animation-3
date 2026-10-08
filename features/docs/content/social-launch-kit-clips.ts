import type { DocBlock } from "../lib/domain/schema"

/** Clips published on their own for the social calendar, each in the 4:5 feed and 9:16 story formats. */
export const launchKitClipBlocks: DocBlock[] = [
  { type: "heading", text: "End-to-end journey clip" },
  {
    type: "paragraph",
    text: "One take from the scrolling story, through sign-in as the demo admin, into the admin. Use 4:5 in the LinkedIn and Facebook feed and 9:16 for stories and reels. Re-record with pnpm showcase:cuts --calendar-only after UI changes.",
  },
  {
    type: "video",
    src: "/showcase/video/journey/4x5.mp4",
    poster: "/showcase/video/journey/4x5.jpg",
    description:
      "Screen recording in 4:5: the home page scroll story plays, the visitor signs in as the demo admin, and the admin dashboard and its pages open in turn.",
    caption: "Journey clip, 4:5 feed format.",
  },
  {
    type: "video",
    src: "/showcase/video/journey/9x16.mp4",
    poster: "/showcase/video/journey/9x16.jpg",
    description:
      "The same journey recorded in 9:16 for stories and reels: scroll story, sign-in as the demo admin, then the admin dashboard and its pages.",
    caption: "Journey clip, 9:16 story format.",
  },
  { type: "heading", text: "Back-in-stock clip" },
  {
    type: "paragraph",
    text: "A sold-out product, a shopper joining the waiting list, the admin seeing the demand, a one-click restock, and the back-in-stock email. Recorded against demo shoppers only: the take refuses to run while any real person is waiting, and demo addresses never reach the email provider.",
  },
  {
    type: "video",
    src: "/showcase/video/restock/4x5.mp4",
    poster: "/showcase/video/restock/4x5.jpg",
    description:
      "Screen recording in 4:5: a sold-out product page, a shopper enters an email to be notified, the admin products table shows the waiting count, stock is raised by one, and the back-in-stock email template opens.",
    caption: "Restock clip, 4:5 feed format.",
  },
  {
    type: "video",
    src: "/showcase/video/restock/9x16.mp4",
    poster: "/showcase/video/restock/9x16.jpg",
    description:
      "The same back-in-stock flow in 9:16 for stories and reels: sold-out page, join the waiting list, admin restock, then the email.",
    caption: "Restock clip, 9:16 story format.",
  },
  { type: "heading", text: "Site tour clip" },
  {
    type: "paragraph",
    text: "The whole site in one take: the homepage scroll story, paced frame by frame through the canvas hero exactly as the storefront clip paces it, then About, Articles and Contact. The clip holds on the store map once it has loaded.",
  },
  {
    type: "video",
    src: "/showcase/video/sitetour/4x5.mp4",
    poster: "/showcase/video/sitetour/4x5.jpg",
    description:
      "Screen recording in 4:5: the homepage scroll story through the canvas hero, the About page and its animated timeline, the articles journal with its lead story, then the contact page with opening hours, the studio list and the store map.",
    caption: "Site tour clip, 4:5 feed format.",
  },
  {
    type: "video",
    src: "/showcase/video/sitetour/9x16.mp4",
    poster: "/showcase/video/sitetour/9x16.jpg",
    description:
      "The same tour in 9:16 for stories and reels: the homepage scroll story, About with its timeline, the articles journal, then contact with the store map.",
    caption: "Site tour clip, 9:16 story format.",
  },
  { type: "heading", text: "Enquiry form clip" },
  {
    type: "paragraph",
    text: "The multi-step contact form: the topic picker, a general enquiry, then the same form switched to wholesale so the fields visibly change. The take stops on the review step and never presses send, because sending would put a real email in the owner's inbox on every recording.",
  },
  {
    type: "video",
    src: "/showcase/video/enquiry/4x5.mp4",
    poster: "/showcase/video/enquiry/4x5.jpg",
    description:
      "Screen recording in 4:5: five enquiry topics, a general enquiry filled in with a subject and a message, then wholesale asking instead for a company, a country and a description of the business, ending on the review step.",
    caption: "Enquiry form clip, 4:5 feed format.",
  },
  {
    type: "video",
    src: "/showcase/video/enquiry/9x16.mp4",
    poster: "/showcase/video/enquiry/9x16.jpg",
    description:
      "The same enquiry form in 9:16 for stories and reels: the topic picker, a general enquiry, then the wholesale fields, stopping on the review step.",
    caption: "Enquiry form clip, 9:16 story format.",
  },
]
