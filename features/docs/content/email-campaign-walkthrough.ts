import type { Doc } from "../schema"

export const emailCampaignWalkthrough: Doc = {
  slug: "email-campaign-walkthrough",
  title: "Create a Campaign: Step-by-Step",
  category: "Email & Campaigns",
  audience: "content",
  access: "admin",
  summary:
    "A complete, screenshot-by-screenshot walkthrough of composing and sending an email campaign — from the empty draft to a live preview to hitting send. Uses a real example launch so you can follow along without guessing.",
  readingMinutes: 9,
  order: 3,
  updatedAt: "2026-09-26",
  tags: ["email", "campaigns", "walkthrough", "broadcast", "subscribers"],
  body: [
    {
      type: "paragraph",
      text: "A campaign takes one template and broadcasts it to your audience. This guide walks the whole flow with a worked example — announcing a new product, the \"MOMO ANC Pro\" — so every field has real content instead of lorem ipsum. Follow along in a draft of your own; nothing sends until the final step.",
    },
    {
      type: "callout",
      variant: "note",
      title: "Before you start",
      text: "You need at least one template (see Building & Editing Templates) and a healthy green delivery banner on the Overview screen. If delivery is in test mode, fix that first — a campaign in test mode reaches no one.",
    },
    {
      type: "heading",
      text: "Step 1 — Open the campaigns screen",
    },
    {
      type: "paragraph",
      text: "Go to Email → Campaigns. Existing campaigns are listed on the left with a Draft or Sent status; the panel on the right shows your subscriber count. New newsletter signups from the storefront land in this subscriber list automatically — you do not import them by hand.",
    },
    {
      type: "image",
      src: "/docs/email/campaigns-list.png",
      alt: "The Campaigns screen showing two draft campaigns labelled 'Untitled campaign', a New campaign button, and a Subscribers panel on the right reading '0 opted in, 0 total' with a note that newsletter signups land there automatically.",
      caption:
        "Figure 1 — Email → Campaigns. Drafts live on the left; the Subscribers panel on the right is your audience. Click New campaign to begin.",
      width: 1275,
      height: 918,
    },
    {
      type: "callout",
      variant: "info",
      title: "Where do subscribers come from?",
      text: "Anyone who signs up through the newsletter form on the storefront is added here as an opted-in subscriber. That opt-in is what makes it safe to send them marketing. You can also add addresses manually with the Add button, but only add people who agreed to hear from you.",
    },
    {
      type: "heading",
      text: "Step 2 — Fill in the campaign details",
    },
    {
      type: "paragraph",
      text: "Clicking New campaign (or an existing draft) opens the composer. It has three parts: Details on the top left, Audience below it, and a live Preview on the right. Start with Details.",
    },
    {
      type: "steps",
      items: [
        {
          title: "Campaign name",
          text: "An internal label only — customers never see it. Use something you will recognise later, like \"October Launch — MOMO ANC Pro\".",
        },
        {
          title: "Template",
          text: "Pick the design to send. As soon as you choose one, the Preview on the right fills in so you can see the real email.",
        },
        {
          title: "Subject line",
          text: "This is what lands in the inbox. Keep it short and specific — \"Meet the new MOMO ANC Pro\" beats \"October Newsletter\".",
        },
        {
          title: "Preview text",
          text: "The grey line most inboxes show after the subject. Use it to extend the hook: \"Reference-grade sound, now with adaptive noise cancelling.\"",
        },
      ],
    },
    {
      type: "image",
      src: "/docs/email/campaign-compose.png",
      alt: "The campaign composer with the Welcome / newsletter template selected. The Details form on the left is filled in with a campaign name, subject line and preview text; the right pane shows a live branded email preview with a headphones hero image and the headline 'Every product is a reference instrument'.",
      caption:
        "Figure 2 — The composer with everything filled in. The moment a template is chosen, the right-hand Preview renders the real branded email. The header still reads Draft with an \"Unsaved changes\" hint until you save.",
      width: 1275,
      height: 918,
    },
    {
      type: "callout",
      variant: "tip",
      title: "The preview is the real email",
      text: "What you see on the right is exactly what subscribers receive, rendered with your brand from Settings. If something looks off — wrong colour, wrong logo — fix it in Email → Settings, not in the campaign.",
    },
    {
      type: "heading",
      text: "Step 3 — Choose your audience",
    },
    {
      type: "paragraph",
      text: "The Audience section has two modes. \"All subscribers\" sends to everyone who opted in — this is the normal choice for a newsletter or launch. \"Specific emails\" lets you type a small list of addresses, useful for a VIP preview or a re-send to a handful of people.",
    },
    {
      type: "table",
      title: "Which audience mode to use",
      headers: ["Mode", "Sends to", "Use it for"],
      rows: [
        ["All subscribers", "Everyone opted in", "Newsletters, launches, general announcements"],
        ["Specific emails", "Addresses you type in", "VIP previews, small re-sends, internal review"],
      ],
    },
    {
      type: "callout",
      variant: "warning",
      title: "The count under Audience is real",
      text: "\"0 will receive this campaign\" means exactly that — nobody. If your subscriber list is empty, send yourself a test with Specific emails first, and grow the list through the storefront newsletter signup before your real launch.",
    },
    {
      type: "heading",
      text: "Step 4 — Save, test, then send",
    },
    {
      type: "steps",
      items: [
        {
          title: "Save the draft",
          text: "Save keeps your work and clears the \"Unsaved changes\" hint. A saved draft can be picked up later; nothing is sent by saving.",
        },
        {
          title: "Send a test to yourself",
          text: "Use Specific emails with your own address for a real end-to-end test. Check it on your phone too — most people read email on mobile.",
        },
        {
          title: "Switch to your real audience and send",
          text: "Set Audience back to All subscribers, confirm the count looks right, and click Send campaign. Sending is not reversible, so treat that confirmation as the point of no return.",
        },
      ],
    },
    {
      type: "callout",
      variant: "success",
      title: "After you send",
      text: "The campaign flips to Sent on the list, and each individual send shows up in Overview → Recent activity with its delivery status. Watch for Failed rows and follow up on those addresses.",
    },
    {
      type: "heading",
      text: "The whole flow at a glance",
    },
    {
      type: "mermaid",
      kind: "flow",
      title: "Figure 3 — From draft to delivered",
      caption:
        "Every campaign follows the same path. The test-send loop before the real send is the step people skip — and regret.",
      diagram: [
        "flowchart TD",
        "  A[New campaign] --> B[Fill in details]",
        "  B --> C[Pick template]",
        "  C --> D[Live preview renders]",
        "  D --> E{Looks right?}",
        "  E -- No --> F[Fix brand in Settings]",
        "  F --> D",
        "  E -- Yes --> G[Save draft]",
        "  G --> H[Send test to yourself]",
        "  H --> I{Test looks good?}",
        "  I -- No --> B",
        "  I -- Yes --> J[Audience: All subscribers]",
        "  J --> K[Send campaign]",
        "  K --> L[Track in Recent activity]",
      ].join("\n"),
    },
  ],
}
