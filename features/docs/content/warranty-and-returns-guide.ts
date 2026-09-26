import type { Doc } from "../schema"

export const warrantyAndReturnsGuide: Doc = {
  slug: "warranty-and-returns-guide",
  title: "Warranty & Returns Guide",
  category: "Warranty & Returns",
  audience: "user",
  access: "public",
  summary:
    "A plain-English walkthrough of the 30-day home trial, how returns and refunds work, and what the 2-year warranty covers — with the formal pages linked for the fine print.",
  readingMinutes: 6,
  order: 1,
  updatedAt: "2026-09-26",
  tags: ["warranty", "returns", "refunds", "home-trial", "support"],
  body: [
    {
      type: "paragraph",
      text: "We want you to buy with confidence. That means a genuine try-at-home window, a straightforward returns process, and a warranty that stands behind the build. This guide explains how each works in plain terms — the Warranty and Returns pages in the footer hold the formal terms.",
    },
    {
      type: "heading",
      text: "The 30-day home trial",
    },
    {
      type: "paragraph",
      text: "Speakers and headphones sound different in your own room, with your own music, than they do in a shop. So every order comes with a 30-day home trial: live with your device, and if it isn't right for you, send it back for a full refund.",
    },
    {
      type: "list",
      items: [
        "The 30 days start from the day your order is delivered.",
        "Use the device normally — the trial isn't limited to keeping it boxed.",
        "Keep the original packaging and accessories where you can; it makes the return smoother.",
        "Change-of-mind returns are refunded in full; we simply ask that the item is in resaleable condition.",
      ],
    },
    {
      type: "callout",
      variant: "tip",
      text: "Give a new device a few days of real listening. Ear-tips, placement, and settling-in time all make a noticeable difference before you decide.",
    },
    {
      type: "heading",
      text: "How to return something",
    },
    {
      type: "steps",
      items: [
        {
          title: "Get in touch",
          text: "Contact us through the Contact page with your order number within 30 days of delivery. Let us know whether it's a change-of-mind return or a fault.",
        },
        {
          title: "Pack it up",
          text: "Place the device and its accessories back in the original box where possible. We'll send clear return instructions and a label.",
        },
        {
          title: "Send it back",
          text: "Drop the parcel off using the label provided. For change-of-mind returns you cover return postage; for faulty items we cover it.",
        },
        {
          title: "Get your refund",
          text: "Once we receive and inspect the item, we refund your original payment method within five working days. Your bank may take a little longer to display it.",
        },
      ],
    },
    {
      type: "heading",
      text: "What the 2-year warranty covers",
    },
    {
      type: "paragraph",
      text: "Every Momo Audio device carries a 2-year limited warranty from the delivery date, covering defects in materials and workmanship under normal use. If something fails that shouldn't, we'll repair or replace it.",
    },
    {
      type: "table",
      headers: ["Covered", "Not covered"],
      rows: [
        ["Component or electronics failure under normal use", "Accidental damage, drops, and crushing"],
        ["Audio faults — distortion, dropouts, dead drivers", "Water damage beyond the device's rated protection"],
        ["Connectivity defects present from the start", "Normal wear items such as ear-tips and cables"],
        ["Battery that degrades far faster than expected", "Damage from unauthorised repairs or modifications"],
      ],
    },
    {
      type: "callout",
      variant: "info",
      text: "A fault is handled under the warranty rather than the 30-day trial — so you're covered well beyond the trial window, for the full two years.",
    },
    {
      type: "heading",
      text: "Making a warranty claim",
    },
    {
      type: "steps",
      items: [
        {
          title: "Describe the fault",
          text: "Contact us with your order number and a short description of what's happening. A photo or short video of the issue helps us diagnose it faster.",
        },
        {
          title: "We assess it",
          text: "We'll confirm the fault is covered and, if so, arrange the next step — usually a prepaid return for repair or replacement.",
        },
        {
          title: "Repair or replace",
          text: "We repair the device or replace it with an equivalent unit. If a model is discontinued, we'll offer the closest current equivalent.",
        },
      ],
    },
    {
      type: "callout",
      variant: "note",
      text: "This warranty is in addition to your statutory consumer rights, which are not affected. Nothing here limits the rights you have by law.",
    },
    {
      type: "heading",
      text: "Where to find the full terms",
    },
    {
      type: "paragraph",
      text: "This guide is the friendly overview. For the complete, formal terms — including regional specifics — see the Warranty and Returns pages linked in the site footer. If anything is unclear, the Contact page reaches a person who can help.",
    },
  ],
}
