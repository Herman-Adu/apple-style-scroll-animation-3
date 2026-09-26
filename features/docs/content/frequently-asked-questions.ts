import type { Doc } from "../schema"

export const frequentlyAskedQuestions: Doc = {
  slug: "frequently-asked-questions",
  title: "Frequently Asked Questions",
  category: "FAQ",
  audience: "user",
  access: "public",
  summary:
    "Quick answers to the questions we hear most — ordering and delivery, the 30-day home trial, the 2-year warranty, pairing, and looking after your Momo Audio devices.",
  readingMinutes: 7,
  order: 1,
  updatedAt: "2026-09-26",
  tags: ["faq", "shipping", "returns", "warranty", "orders", "support"],
  body: [
    {
      type: "paragraph",
      text: "The questions below cover the things customers ask us most often. If your question isn't here, the User guides cover setup and care in more depth, and the Contact page reaches a person directly.",
    },
    {
      type: "heading",
      text: "Ordering & payment",
    },
    {
      type: "steps",
      items: [
        {
          title: "How do I place an order?",
          text: "Add items to your bag and check out. You'll get an order confirmation email the moment payment is authorised, with your order number for reference.",
        },
        {
          title: "Which payment methods do you accept?",
          text: "All major credit and debit cards, processed securely through Stripe. Your card details never touch our servers — Stripe handles them directly under PCI-DSS.",
        },
        {
          title: "Can I change or cancel an order?",
          text: "If your order hasn't been dispatched yet, contact us with your order number and we'll amend or cancel it. Once it's shipped, treat it as a return.",
        },
        {
          title: "Do prices include tax?",
          text: "Prices are shown inclusive of applicable taxes for your region. Any customs or import duties for orders outside the UK are the recipient's responsibility.",
        },
      ],
    },
    {
      type: "heading",
      text: "Shipping & delivery",
    },
    {
      type: "table",
      headers: ["Question", "Answer"],
      rows: [
        ["How much is shipping?", "Shipping is complimentary on every order, with tracking included."],
        ["When will my order ship?", "Orders placed before 2pm on a working day are dispatched the same day; otherwise the next working day."],
        ["How do I track my order?", "You'll receive a tracking link by email as soon as your order is dispatched. It updates as the carrier scans your parcel."],
        ["Do you ship internationally?", "Yes. Delivery estimates vary by destination and are shown at checkout. Customs and duties may apply outside the UK."],
        ["What if my parcel is lost or damaged?", "Contact us with your order number. We'll open a carrier claim and arrange a replacement — you won't be left out of pocket."],
      ],
    },
    {
      type: "callout",
      variant: "info",
      text: "Full details, including regional delivery timescales, live on the Shipping page linked in the footer.",
    },
    {
      type: "heading",
      text: "Returns & the 30-day home trial",
    },
    {
      type: "steps",
      items: [
        {
          title: "Can I try before I commit?",
          text: "Yes. Every order includes a 30-day home trial — listen in your own space, on your own music, and if it isn't right, send it back for a full refund.",
        },
        {
          title: "How do I start a return?",
          text: "Contact us with your order number within 30 days of delivery and we'll issue return instructions. Pack the item with its accessories in the original box where possible.",
        },
        {
          title: "When do I get my refund?",
          text: "Once we receive and inspect the return, we refund to your original payment method within five working days. Your bank may take a little longer to show it.",
        },
        {
          title: "What if the item is faulty?",
          text: "A faulty item is covered by the warranty, not the trial window — see below. We cover return shipping for anything that arrives faulty or develops a fault.",
        },
      ],
    },
    {
      type: "heading",
      text: "Warranty",
    },
    {
      type: "paragraph",
      text: "Every Momo Audio device carries a 2-year limited warranty against manufacturing defects, starting from the delivery date. It covers faults in materials and workmanship under normal use.",
    },
    {
      type: "list",
      items: [
        "Covered: component failure, audio faults, and connectivity defects that appear under normal use.",
        "Not covered: accidental damage, water damage beyond the rated protection, wear-and-tear items like ear-tips, and unauthorised repairs.",
        "To claim: contact us with your order number and a short description of the fault. We'll arrange repair or replacement.",
        "Your statutory consumer rights are in addition to — and unaffected by — this warranty.",
      ],
    },
    {
      type: "callout",
      variant: "note",
      text: "The Warranty and Returns pages in the footer carry the full terms; this is the short version.",
    },
    {
      type: "heading",
      text: "Product & pairing",
    },
    {
      type: "steps",
      items: [
        {
          title: "How do I pair my device?",
          text: "Open the case (earbuds) or power on (headphones), then select the Momo device in your phone's Bluetooth menu. The Getting Started guide walks through it step by step.",
        },
        {
          title: "Can I connect to more than one device?",
          text: "Yes — Momo devices support multipoint, so you can stay connected to your phone and laptop at once and switch automatically when audio plays.",
        },
        {
          title: "What's the battery life?",
          text: "Battery life varies by model and volume; the product page for each device lists its rated playtime and the case's total capacity.",
        },
        {
          title: "How do I look after them?",
          text: "The Product Care guide covers cleaning, storage, and keeping the battery healthy over the long term.",
        },
      ],
    },
    {
      type: "heading",
      text: "Account & privacy",
    },
    {
      type: "steps",
      items: [
        {
          title: "Do I need an account to order?",
          text: "You can check out as a guest. An account simply keeps your order history and details in one place for next time.",
        },
        {
          title: "How is my data handled?",
          text: "We collect only what we need to fulfil your order and improve the store. The Privacy page details what we hold, who processes it, and your rights.",
        },
        {
          title: "How do I stop marketing emails?",
          text: "Every marketing email has an unsubscribe link, and one click stops them. Transactional emails about your orders will still be sent.",
        },
      ],
    },
    {
      type: "heading",
      text: "Still need a hand?",
    },
    {
      type: "paragraph",
      text: "If your question isn't answered here, reach out through the Contact page with your order number and a short description. A real person will get back to you.",
    },
  ],
}
