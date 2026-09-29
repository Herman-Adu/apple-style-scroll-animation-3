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
  updatedAt: "2026-09-29",
  tags: ["offers", "discounts", "account", "checkout", "expiry", "redemption"],
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
        "An offer becomes visible the moment we grant it and stays Active while it's unused and within its window. Using it at checkout moves it to Used — it stays visible as a record until its original expiry date, then clears itself. An offer that's never used simply moves to Expired, with a short grace window to see it before it clears. Either way, you can also close a Used or Expired card yourself with the × on the card at any time — nothing you need to do otherwise.",
      diagram: [
        "stateDiagram-v2",
        "  [*] --> Granted: we send you an offer",
        "  Granted --> Active: appears in banner and Offers tab",
        "  Active --> Used: applied once at checkout",
        "  Active --> Expired: expiry date passes, never used",
        "  Used --> Hidden: you close it, or its expiry date passes",
        "  Expired --> Hidden: you close it, or a few days pass",
        "  Hidden --> [*]",
      ].join("\n"),
    },
    {
      type: "heading",
      text: "One-time by default",
    },
    {
      type: "paragraph",
      text: "Unless we tell you otherwise, a personal offer is good for one order. The moment its saving is applied at checkout, that offer can't be applied again — even if there's still time left before its expiry date. The card doesn't disappear, though: it switches to a muted \"Used\" state showing exactly when it was redeemed, so you have a record of it rather than being left wondering where your discount went.",
    },
    {
      type: "heading",
      text: "Why an offer disappears",
    },
    {
      type: "list",
      items: [
        "You used it, and its window has now closed. A used offer stays visible — marked Used, with the date you redeemed it — until its original expiry date, then it clears itself automatically.",
        "You used it, and you closed the card yourself. Once an offer shows as Used or Expired, a × appears on the card so you can dismiss it whenever you're ready, rather than waiting for it to expire.",
        "It reached its expiry date without ever being used. It switches to an Expired state for a few days as a reminder you missed it, then clears itself — or you can close it sooner with the ×.",
        "It was a limited-time promotion that has now ended for everyone.",
        "It was replaced by a newer, better offer we sent you.",
      ],
    },
    {
      type: "callout",
      variant: "note",
      title: "\"No offers at the moment\" is normal",
      text: "If your Offers tab says there's nothing live right now, you haven't lost anything — it simply means no personal offer is currently active, used, or recently expired on your account. As soon as we send a new one, it appears here and in the banner.",
    },
    {
      type: "heading",
      text: "Common questions",
    },
    {
      type: "list",
      items: [
        "Can I use an offer more than once? Not by default — most personal offers are one-time, and applying one at checkout uses it up for good even if time is still left on the clock. If we ever send a multi-use offer, the card will make that clear.",
        "I used an offer but it's still showing — is that a bug? No. A used offer intentionally stays on your Offers tab, now marked Used, so you have a record of it. It clears itself once its original expiry date passes, or you can close it early with the × on the card.",
        "I dismissed the banner — is my offer gone? No. Dismissing the banner only hides the strip; the offer stays in your Offers tab until it's used and its window ends, it expires, or you close it with the ×.",
        "The offer isn't applying at checkout. Make sure you're signed in with the account the offer was sent to, that it hasn't already been used (check the Offers tab for a Used badge), and that it hasn't expired. If it's still Active and not applying, contact support and we'll sort it.",
      ],
    },
  ],
}
