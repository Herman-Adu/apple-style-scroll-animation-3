import type { Doc } from "../schema"

export const emailTemplatesGuide: Doc = {
  slug: "email-templates-guide",
  title: "Building & Editing Templates",
  category: "Email & Campaigns",
  audience: "content",
  access: "public",
  summary:
    "Templates are the branded, block-based emails your campaigns and customer messages are built from. This guide covers the system templates, the starter gallery, the editor (undo, placeholders, saved sections, locked blocks) and how version history keeps every change recoverable.",
  readingMinutes: 9,
  order: 2,
  updatedAt: "2026-10-02",
  tags: ["email", "templates", "blocks", "branding", "theme", "starters", "versions", "sections", "locks"],
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
      text: "Email → Templates shows every template as a card. The tag in the corner tells you whether it is a Marketing, Transactional or System (internal) template. \"System\" templates ship with MOMO and are wired to real events; you can edit them, duplicate them, and always reset them to the original.",
    },
    {
      type: "image",
      src: "/docs/email/templates.png",
      alt: "The Email Templates screen showing template cards, each with a category tag, a description and a duplicate button.",
      caption:
        "Figure 1 — Email → Templates. The corner tag marks each card as Marketing, Transactional or System; the copy icon duplicates a template so you can customise it without touching the original.",
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
      title: "The template kinds",
      headers: ["", "Transactional", "Marketing", "System (internal)"],
      rows: [
        ["Trigger", "An event — order, shipment, refund", "You choose to send it", "An event in your shop"],
        ["Audience", "The specific customer involved", "Opted-in subscribers only", "Your own support inbox"],
        ["Examples", "Order confirmation, Refund confirmation", "Welcome / newsletter, Personal offer", "New order notification"],
        ["Opt-out needed?", "No — it is service, not promotion", "Yes — always includes unsubscribe", "No — it never reaches customers"],
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
      text: "The system templates",
    },
    {
      type: "list",
      items: [
        "Order confirmation (Transactional) — sent automatically when a customer completes checkout.",
        "Shipping update (Transactional) — lets a customer know their order is on the way; sent from Messages.",
        "Refund confirmation (Transactional) — sent when a full or partial refund is processed.",
        "Low stock alert (Transactional) — sent to your support inbox when a product's stock crosses its threshold, listing the affected items.",
        "New order notification (System) — sent to your support inbox whenever a customer completes checkout.",
        "Personal offer (Marketing) — a branded email sent when you grant a customer a specific offer.",
        "Welcome / newsletter (Marketing) — the starting point for newsletters and campaign broadcasts.",
      ],
    },
    {
      type: "heading",
      text: "Starting a new template: the starter gallery",
    },
    {
      type: "paragraph",
      text: "New template opens a gallery instead of an empty page. Pick a starter and you get a fully laid-out, on-brand email with a hero image, copy and a call to action that you then edit. Starters are grouped so the right one is quick to find.",
    },
    {
      type: "table",
      title: "Starters",
      headers: ["Group", "Starter", "Good for"],
      rows: [
        ["Essentials", "Blank", "A branded shell when you want to build from scratch"],
        ["Essentials", "Newsletter", "Monthly round-ups and stories"],
        ["Essentials", "Product launch", "Announcing a new product"],
        ["Essentials", "Sale", "General promotions"],
        ["Essentials", "Announcement", "Store news, opening hours, policy changes"],
        ["Seasonal campaigns", "Black Friday", "Black Friday / Cyber Weekend offers"],
        ["Seasonal campaigns", "Bank Holiday sale", "Long-weekend promotions"],
        ["Seasonal campaigns", "Christmas", "Gift guides and last order dates"],
      ],
    },
    {
      type: "callout",
      variant: "tip",
      title: "Or start from one of your own",
      text: "The gallery can also copy any existing template, so a campaign that worked last year can become this year's starting point in one click. Duplicating from a card's copy icon does the same thing.",
    },
    {
      type: "heading",
      text: "Editing a template",
    },
    {
      type: "steps",
      items: [
        {
          title: "Add and arrange blocks",
          text: "A template is a stack of blocks — hero, heading, text, button, image, list, callout, divider, spacer, plus the data blocks (order summary, product picks, low-stock items). Add them from the palette, drag to reorder, and select one to edit its fields.",
        },
        {
          title: "Insert placeholders",
          text: "Use the placeholder picker to drop in tokens like {{customer_name}}, {{order_number}} or {{shop_url}}. They are filled with real values when the email sends. If you type a token MOMO does not recognise, the editor flags it and suggests the closest match.",
        },
        {
          title: "Watch the copy hints",
          text: "Subject and preview text show a live character count, and the subject is checked for words that commonly trigger spam filters. They are hints, not blockers.",
        },
        {
          title: "Preview, then save",
          text: "The preview pane renders the template with realistic sample data and refreshes as you type; Product picks pull live products from the catalogue. Undo and redo (Ctrl/Cmd+Z, Shift+Ctrl/Cmd+Z) cover every change until you save. Discard throws away unsaved edits, and if you try to leave with unsaved changes the editor asks first.",
        },
      ],
    },
    {
      type: "heading",
      text: "Saved sections",
    },
    {
      type: "paragraph",
      text: "If you build the same group of blocks again and again — a brand header, a social footer, a returns reminder — tick those blocks and choose Save as section. The section appears under Saved sections in every template. Insert adds a fresh, independent copy: editing it later does not change the saved section, and deleting a saved section never touches templates that already use it.",
    },
    {
      type: "heading",
      text: "Locked blocks",
    },
    {
      type: "paragraph",
      text: "Click the lock icon on a block to protect it. A locked block cannot be edited, moved or deleted, and nothing can be dragged past it. New blocks and inserted sections land above any locked blocks at the bottom of the template, so a locked footer always stays last.",
    },
    {
      type: "callout",
      variant: "note",
      title: "Who can lock and unlock",
      text: "Only the store owner and admins named on the block-locker list can lock or unlock blocks. Every other admin sees a Locked badge instead of the toggle and cannot change, move or delete locked blocks. Reset to original and Restore are refused for them too if they would change a locked block. Ask the owner to add you to the list if you need to manage brand blocks.",
    },
    {
      type: "heading",
      text: "Version history and Reset to original",
    },
    {
      type: "paragraph",
      text: "Every save takes a snapshot. Open History to see past versions with when and why they were taken, preview any of them, and restore one — restoring is itself saved as a new version, so nothing is ever lost. MOMO keeps the original plus the 50 most recent versions of each template.",
    },
    {
      type: "paragraph",
      text: "Reset to original puts a template back to how it started: system templates return to the shipped design, and your own templates return to their first saved version. Reset is recorded in history too, so you can undo it by restoring the previous version.",
    },
    {
      type: "heading",
      text: "Email accent follows your theme",
    },
    {
      type: "paragraph",
      text: "The accent colour on buttons, links, and dividers is not fixed per template — it defaults from whichever theme is active under Theme → Active & presets. Switch your brand from teal to amber there and every email that uses the theme accent updates to match, with no template editing. The Email accent card in the Theme live preview shows exactly how a send will look.",
    },
    {
      type: "callout",
      variant: "note",
      title: "You can still override per template",
      text: "Inheriting from the active theme is the default, not a cage. A template that needs an off-brand accent — a one-off seasonal blast, say — can still set its own; it simply opts out of the shared default. See Managing Your Theme for how the accent is chosen.",
    },
  ],
}
