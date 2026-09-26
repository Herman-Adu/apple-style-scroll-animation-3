import type { Doc } from "../schema"

export const salesDemoAndObjections: Doc = {
  slug: "sales-demo-and-objection-handling",
  title: "Sales Demo Script & Objection Handling",
  category: "Positioning",
  audience: "developer",
  access: "admin",
  summary:
    "A repeatable way to sell the build in a live conversation: discovery questions to open with, a ten-minute guided demo flow with what to say at each screen, straight answers to the objections you will actually hear (why not Shopify, why not Klaviyo, who maintains it), and a clean close.",
  readingMinutes: 10,
  order: 6,
  updatedAt: "2026-09-26",
  tags: ["sales", "demo", "objections", "positioning", "pitch", "closing"],
  body: [
    {
      type: "paragraph",
      text: "A great build does not sell itself — a clear demo does. This guide gives you a repeatable structure: open with discovery so you know which value to emphasise, walk a tight ten-minute path through the product, handle the predictable objections without getting defensive, and close on a concrete next step.",
    },
    {
      type: "callout",
      variant: "tip",
      title: "Discovery before demo",
      text: "Ask two or three questions before you share your screen. If they are drowning in ESP fees, lead with owned email. If they fear being locked to a freelancer, lead with the documentation and the swappable CMS seam. Tailor the demo to the pain you just heard.",
    },
    {
      type: "heading",
      text: "Open with discovery",
    },
    {
      type: "list",
      items: [
        "What are you using for your store and your email today, and what does it cost per month?",
        "Who on your team sends campaigns or replies to customers — a marketer, or the founder?",
        "When you want to change an email or add a section, what does that take right now?",
        "What happens to your customer data and your audience if you switch tools?",
      ],
    },
    {
      type: "heading",
      text: "The ten-minute demo flow",
    },
    {
      type: "paragraph",
      text: "Move briskly and narrate the value, not the mechanics. The order below builds from the familiar (a storefront) to the differentiator (owned, operable email) to the proof (documentation).",
    },
    {
      type: "steps",
      items: [
        {
          title: "Storefront (1 min)",
          text: "Load a product page. 'This is server-first — the page arrives fast and fully rendered, which customers and Google both reward.' Keep it short; this is table stakes.",
        },
        {
          title: "Cart & checkout (1 min)",
          text: "Add to cart, reach Stripe checkout. 'Payments go through Stripe; totals are recomputed server-side so they cannot be tampered with in the browser.'",
        },
        {
          title: "Admin overview (1 min)",
          text: "Switch to the admin dashboard. 'One place to run the store — catalog, orders, and email, with no separate subscriptions to log into.'",
        },
        {
          title: "Email overview (1 min)",
          text: "Open Email → Overview. 'Every send — transactional, campaign, and 1:1 — is logged here. This is your deliverability and audit trail.'",
        },
        {
          title: "Template block editor (2 min)",
          text: "Open a template and add or reorder a section. 'Non-technical staff change emails by editing blocks — no code, no developer ticket. This is the part cheaper tools cannot replicate.'",
        },
        {
          title: "Campaign composer with live preview (2 min)",
          text: "Create a campaign, pick a template, watch the live preview render. 'You compose against your real branding and see exactly what lands in the inbox before you send.'",
        },
        {
          title: "Docs hub (2 min)",
          text: "Finish on the public documentation library. 'Everything is documented for your team and your future developers — you are not dependent on me to operate or extend this.' This turns the fear of lock-in into a selling point.",
        },
      ],
    },
    {
      type: "heading",
      text: "Objection handling",
    },
    {
      type: "paragraph",
      text: "These come up almost every time. Answer plainly, acknowledge the trade-off, and redirect to the value. Never rubbish the alternative — position against it.",
    },
    {
      type: "table",
      title: "What you will hear, and how to answer",
      headers: ["Objection", "Response"],
      rows: [
        [
          "Why not just use Shopify?",
          "Shopify is excellent for a standard store. This is for teams who want to own their stack and their data, avoid stacked app subscriptions, and have email built in beside their orders rather than bolted on.",
        ],
        [
          "Why not Klaviyo / Mailchimp for email?",
          "Those rent you access to your own audience and charge more as you grow. Here email runs on your domain and database at flat cost, and it can use real order data directly — no paid integration required.",
        ],
        [
          "Isn't a custom build risky?",
          "The risk with custom is usually undocumented code only one person understands. This is documented for four audiences with diagrams, and the content layer sits behind a swappable seam — so another developer can pick it up.",
        ],
        [
          "Who maintains it if you disappear?",
          "That is exactly why the developer and CTO docs exist. Architecture, auth, data layer, and DevOps are all written down. Any competent Next.js developer can run and extend it.",
        ],
        [
          "What about email deliverability?",
          "Sends go through Resend on your authenticated domain, opt-in is respected, and every send is logged. That is a cleaner deliverability and compliance posture than a shared marketing tool.",
        ],
        [
          "Can non-technical staff actually use it?",
          "Yes — that is the point of the block editor and presets. The training walkthroughs in these docs show a campaign built step by step with screenshots.",
        ],
        [
          "What's the real cost saving?",
          "See the cost comparison in the Email Selling Points doc: flat infrastructure instead of per-contact fees. The saving grows as the audience grows, which is when ESPs get most expensive.",
        ],
      ],
    },
    {
      type: "callout",
      variant: "note",
      title: "Anchor the price to value",
      text: "Before you name a number, tie it back to the Pricing & Packaging doc and the monthly ESP fees they told you in discovery. A one-time build plus flat infrastructure against a rising monthly SaaS bill is an easy comparison to make in their favour.",
    },
    {
      type: "heading",
      text: "Close on a concrete next step",
    },
    {
      type: "list",
      items: [
        "Do not end on 'let me know what you think' — propose the next action.",
        "Offer a scoped next step: a paid discovery/spec, a pilot on one email flow, or a fixed-price first phase.",
        "Send the live URL and the public docs link straight after the call while it is fresh.",
        "Agree a specific follow-up date before you hang up.",
      ],
    },
    {
      type: "callout",
      variant: "success",
      title: "Let the docs do the closing",
      text: "The single strongest close is sending the documentation library. It proves the work is real, maintainable, and thorough — and it keeps selling after the call ends.",
    },
  ],
}
