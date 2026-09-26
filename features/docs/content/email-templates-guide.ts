import type { Doc } from "../schema"

export const emailTemplatesGuide: Doc = {
  slug: "email-templates-guide",
  title: "Building & Editing Templates",
  category: "Email & Campaigns",
  audience: "content",
  access: "admin",
  summary:
    "Templates are the branded, block-based emails your campaigns and customer messages are built from. This guide explains the four system templates, the difference between transactional and marketing, and how to duplicate one to make your own.",
  readingMinutes: 6,
  order: 2,
  updatedAt: "2026-09-26",
  tags: ["email", "templates", "blocks", "branding"],
  body: [
    {
      type: "paragraph",
      text: "A template is a reusable email design. Instead of formatting an email from scratch every time, you pick a template, and MOMO fills in the details — the customer's name, the order number, your brand colours. Campaigns send a template to many people; customer messages send one to a single person. Either way, the design lives here.",
    },
    {
      type: "heading",
      text: "The templates screen",
    },
    {
      type: "paragraph",
      text: "Email → Templates shows every template as a card. The tag in the corner tells you whether it is a Marketing or Transactional template, and the footer shows who created it and when. \"System\" templates ship with MOMO; you can edit them or duplicate them into your own.",
    },
    {
      type: "image",
      src: "/docs/email/templates.png",
      alt: "The Email Templates screen showing four template cards: Welcome / newsletter (Marketing), Shipping update (Transactional), Personal offer (Marketing), and Order confirmation (Transactional), each with a description and a duplicate button.",
      caption:
        "Figure 1 — Email → Templates. Four system templates ship out of the box. The corner tag marks each as Marketing or Transactional; the copy icon duplicates a template so you can customise it without touching the original.",
      width: 1275,
      height: 918,
    },
    {
      type: "heading",
      text: "Marketing vs. transactional — why it matters",
    },
    {
      type: "paragraph",
      text: "The tag is not just a label; it reflects a real legal and deliverability distinction. Transactional emails are a direct response to something the customer did (they bought, so they get a confirmation). Marketing emails are promotional and only go to people who opted in. Keeping them separate protects your sender reputation and keeps you compliant.",
    },
    {
      type: "table",
      title: "The two template kinds",
      headers: ["", "Transactional", "Marketing"],
      rows: [
        ["Trigger", "An event — order, shipment, signup", "You choose to send it"],
        ["Audience", "The specific customer involved", "Opted-in subscribers only"],
        ["Examples", "Order confirmation, Shipping update", "Welcome / newsletter, Personal offer"],
        ["Opt-out needed?", "No — it is service, not promotion", "Yes — always includes unsubscribe"],
      ],
    },
    {
      type: "callout",
      variant: "warning",
      title: "Never send a marketing template to someone who did not opt in",
      text: "It is the fastest way to get your domain flagged as spam. Campaigns to \"All subscribers\" already respect opt-in; the risk is pasting addresses into \"Specific emails\". Only send marketing to people who asked for it.",
    },
    {
      type: "heading",
      text: "The four system templates",
    },
    {
      type: "list",
      items: [
        "Welcome / newsletter (Marketing) — the starting point for newsletters and campaign broadcasts.",
        "Personal offer (Marketing) — a branded email sent when you grant a customer a specific offer.",
        "Order confirmation (Transactional) — sent automatically when a customer completes checkout.",
        "Shipping update (Transactional) — lets a customer know their order is on the way; sent from Messages.",
      ],
    },
    {
      type: "heading",
      text: "Making your own template",
    },
    {
      type: "steps",
      items: [
        {
          title: "Duplicate a system template",
          text: "Find the closest match and click the copy icon on its card. This creates an editable copy and leaves the original untouched — always start from a duplicate rather than editing a system template directly.",
        },
        {
          title: "Open it and edit the blocks",
          text: "A template is a stack of blocks — a hero image, headings, paragraphs, buttons. Edit the text and images in place; the brand colours and footer are inherited from Settings, so you do not set them here.",
        },
        {
          title: "Preview with sample data",
          text: "The preview pane renders the template with realistic placeholder data so you can see how a real send will look before you commit.",
        },
        {
          title: "Save, then use it in a campaign",
          text: "Once saved, your template appears in the template picker when you compose a campaign. Head to the campaign walkthrough next.",
        },
      ],
    },
    {
      type: "callout",
      variant: "tip",
      title: "Or start from New template",
      text: "The New template button in the top right gives you a blank branded shell if none of the system templates are close enough. It still inherits your brand, so you are never designing from a truly empty page.",
    },
  ],
}
