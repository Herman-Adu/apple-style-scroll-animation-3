import type { Doc } from "../schema"

export const yourOffersAndDiscounts: Doc = {
  slug: "your-offers-and-discounts",
  title: "Your Offers & Discounts",
  category: "FAQ",
  audience: "user",
  access: "public",
  summary:
    "Where to find the personal offers we send you, how to read the expiry date and time remaining, how an offer is applied at checkout, and why an offer disappears once it expires. Everything about the Offers tab in your account, in one place.",
  readingMinutes: 5,
  order: 6,
  updatedAt: "2026-09-28",
  tags: ["offers", "discounts", "account", "checkout", "expiry"],
  body: [
    {
      type: "paragraph",
      text: "From time to time we send you a personal offer — a welcome discount, an early-access window, or a thank-you for a recent order. When an offer is live you'll see a slim banner across the top of the store, and the same offer now also lives in your account so you can come back to it any time. This guide explains exactly where it is and how it behaves.",
    },
    {
      type: "heading",
      text: "Where to find your offers",
    },
    {
      type: "steps",
      items: [
        { title: "Open your account", text: "Sign in, then open the account menu (top right) and choose Offers — or open any tab and switch to Offers. On a phone the same link sits in the slide-out menu." },
        { title: "Review the details", text: "Each live offer shows its headline, the discount, the code (if any), the expiry date, and how long you have left before it ends." },
        { title: "Use it at checkout", text: "Eligible offers apply automatically at checkout; if a code is shown, it's already tied to your account. The saving appears in the order summary before you pay." },
      ],
    },
    {
      type: "callout",
      variant: "tip",
      title: "The banner and the tab are the same offer",
      text: "The store-wide banner is the nudge; the Offers tab is the record. They always show the same live offer, so if you dismiss the banner you can still find every detail in your account.",
    },
    {
      type: "heading",
      text: "Reading the expiry and time remaining",
    },
    {
      type: "paragraph",
      text: "Every offer shows two things about timing: the exact expiry date, and a friendlier countdown — for example \"3 days left\" or \"ends today\". The countdown is there so you can tell at a glance how urgent it is; the date is there so you know precisely when it lapses. When an offer is close to ending we highlight it so it's easy to spot.",
    },
    {
      type: "heading",
      text: "The life of an offer",
    },
    {
      type: "mermaid",
      kind: "state",
      title: "Figure 1 — What happens to an offer over time",
      caption:
        "An offer becomes visible the moment we grant it, stays available while it's within its window, and quietly disappears the moment it expires. Nothing you need to do — the account keeps itself tidy.",
      diagram: [
        "stateDiagram-v2",
        "  [*] --> Granted: we send you an offer",
        "  Granted --> Active: appears in banner and Offers tab",
        "  Active --> Applied: saving added at checkout",
        "  Applied --> Active: still valid for its window",
        "  Active --> Expired: expiry date passes",
        "  Expired --> Hidden: removed from your account",
        "  Hidden --> [*]",
      ].join("\n"),
    },
    {
      type: "heading",
      text: "Why an offer disappears",
    },
    {
      type: "list",
      items: [
        "It reached its expiry date — once the date passes, the offer drops out of both the banner and your Offers tab automatically.",
        "It was a limited-time promotion that has now ended for everyone.",
        "It was replaced by a newer, better offer we sent you.",
      ],
    },
    {
      type: "callout",
      variant: "note",
      title: "\"No offers at the moment\" is normal",
      text: "If your Offers tab says there's nothing live right now, you haven't lost anything — it simply means no personal offer is currently active on your account. As soon as we send a new one, it appears here and in the banner.",
    },
    {
      type: "heading",
      text: "Common questions",
    },
    {
      type: "list",
      items: [
        "Can I use an offer more than once? Most offers can be used while they're still within their window; some are one-time. The offer card tells you which, and the order summary always shows the saving actually applied.",
        "I dismissed the banner — is my offer gone? No. Dismissing the banner only hides the strip; the offer stays in your Offers tab until it expires.",
        "The offer isn't applying at checkout. Make sure you're signed in with the account the offer was sent to, and that it hasn't expired. If it's still live and not applying, contact support and we'll sort it.",
      ],
    },
  ],
}
