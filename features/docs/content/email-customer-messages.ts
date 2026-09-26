import type { Doc } from "../schema"

export const emailCustomerMessages: Doc = {
  slug: "email-customer-messages",
  title: "Messaging Customers One-to-One",
  category: "Email & Campaigns",
  audience: "content",
  access: "admin",
  summary:
    "Send a single, branded email to one customer — a reply, a heads-up, a back-in-stock nudge — starting from a saved preset so you are not writing from scratch. Covers presets, the message composer, and the variables that personalise each send.",
  readingMinutes: 6,
  order: 4,
  updatedAt: "2026-09-26",
  tags: ["email", "messages", "presets", "customer support"],
  body: [
    {
      type: "paragraph",
      text: "Campaigns go to many people; a message goes to one. Use Email → Messages when a single customer needs a personal, branded email — answering a question, confirming a detail, or letting them know an item is back in stock. Presets mean you rarely start from a blank page.",
    },
    {
      type: "heading",
      text: "The messages screen",
    },
    {
      type: "paragraph",
      text: "The left side is the composer for a new message; the right side is your library of presets. Sent messages collect in Recent messages at the bottom so you have a record of what went out.",
    },
    {
      type: "image",
      src: "/docs/email/messages.png",
      alt: "The Customer messages screen. On the left, a New message form with fields for customer email, customer name, a preset picker, subject, hero heading and message body. On the right, a Presets panel listing Back in stock, Thank you, Order update, and Delivery instructions, each with an edit and delete button.",
      caption:
        "Figure 1 — Email → Messages. Compose on the left, presets on the right. Replies come back to the support address set in Settings.",
      width: 1275,
      height: 918,
    },
    {
      type: "heading",
      text: "Start from a preset",
    },
    {
      type: "paragraph",
      text: "A preset is a saved starting point for a common message. Choosing one fills the subject and body for you; you then personalise and send. The four that ship cover the most common situations.",
    },
    {
      type: "list",
      items: [
        "Back in stock — tell a customer the item they wanted is available again.",
        "Thank you — a simple branded thank-you from MOMO.",
        "Order update — a general update on an existing order.",
        "Delivery instructions — clarify or confirm how an order will arrive.",
      ],
    },
    {
      type: "callout",
      variant: "tip",
      title: "Make your own presets",
      text: "If you find yourself typing the same message twice, save it. Use New in the Presets panel, and it joins the list for next time. The edit and delete icons on each card let you refine or retire presets as your support patterns change.",
    },
    {
      type: "heading",
      text: "Personalising with variables",
    },
    {
      type: "paragraph",
      text: "The body supports variables — placeholders that get replaced with real values when the email sends. The one you will use most is the customer's name.",
    },
    {
      type: "code",
      language: "text",
      title: "Using a variable in the body",
      code: "Hi {{customer_name}},\n\nGood news — the MOMO ANC Pro you asked about is back in stock.\n\nWe held one aside; it is yours if you still want it.",
    },
    {
      type: "callout",
      variant: "note",
      title: "Each paragraph becomes its own branded block",
      text: "You write plain text and separate paragraphs with a blank line. MOMO turns each paragraph into a branded block automatically, so a message looks as polished as a campaign without any formatting work. Wrap a word in *asterisks* in the hero heading to accent it.",
    },
    {
      type: "heading",
      text: "Sending a message, start to finish",
    },
    {
      type: "steps",
      items: [
        {
          title: "Enter the customer",
          text: "Type their email address; the name is optional but recommended, because it feeds the {{customer_name}} variable.",
        },
        {
          title: "Pick a preset (optional)",
          text: "Choose a preset reply to pre-fill the subject and body, or skip it and write from scratch.",
        },
        {
          title: "Personalise",
          text: "Adjust the subject, hero heading, and body. Leave the hero heading blank to default it to the subject.",
        },
        {
          title: "Send",
          text: "Click Send message. It sends immediately as a real branded email and appears in Recent messages below, and in Overview → Recent activity.",
        },
      ],
    },
    {
      type: "callout",
      variant: "info",
      title: "Replies go to your support address",
      text: "When the customer hits reply, it goes to the support / reply-to address configured in Email → Settings — not to a no-reply void. Make sure that address is one someone actually monitors.",
    },
    {
      type: "heading",
      text: "Message, campaign, or transactional?",
    },
    {
      type: "table",
      title: "Choosing the right tool",
      headers: ["Situation", "Use"],
      rows: [
        ["One customer needs a personal reply", "Messages"],
        ["Announce something to your whole audience", "Campaigns"],
        ["Order was placed or shipped", "Transactional (automatic — nothing to do)"],
        ["Same message to a handful of named people", "Campaign with Specific emails"],
      ],
    },
  ],
}
