import type { DocBlock } from "../lib/domain/schema"

export const socialLaunchPackClientBlocks: DocBlock[] = [
  { type: "heading", text: "For prospective clients" },
  {
    type: "paragraph",
    text: "These speak to business owners, not engineers. Keep the language about outcomes: one system for the store and its email, a site you can change yourself, and a handover that does not leave you dependent on one person. Do not post prices. Agree scope and price per project.",
  },
  {
    type: "code",
    language: "text",
    title: "LinkedIn - client 1: store and email in one",
    code: `If you run an online store, you probably pay for a shop platform and a separate email service, then copy products between them.

I built the two into one system. Staff create emails from blocks, pull real products and prices from the catalog, and start from Black Friday, Bank Holiday or Christmas templates. Brand headers and footers can be locked so nothing changes by accident, and every edit can be undone.

Customer emails, order confirmations, refunds and campaigns sit next to the orders they relate to. No copying between tools.

See the finished emails: [live URL]/docs/email-seasonal-campaigns

If you want something like this for your business, send me a message.`,
  },
  {
    type: "code",
    language: "text",
    title: "LinkedIn - client 2: what I can build for you",
    code: `I now build custom commerce sites from a template I have developed and tested heavily.

What you start with:

- Storefront, Stripe checkout, customer accounts and an admin dashboard
- A block-based email builder with seasonal starters
- Role-based admin access with an audit trail of permission changes
- Documentation for your staff and for your next developer
- A test suite, so later changes do not break what already works

How it works: we start from the template, customise the brand, products, content and emails, connect your own database, payment and email accounts, and I hand over with documentation. Going live, payments and compliance are set up with you, not assumed.

The case study and docs are public: [live URL]/docs/case-study-email-platform

Message me with what you sell and I will tell you honestly whether it fits.`,
  },
  {
    type: "code",
    language: "text",
    title: "LinkedIn - client 3: the handover",
    code: `A site is only as good as its handover.

Every project I deliver comes with documentation written for five different readers: your customers, your content team, your developers, your decision makers and you as the owner. There is a changelog that says what changed and why, decision records that explain the big choices, and a test suite that protects the work.

So when you bring in a new developer next year, they start on day one instead of reverse engineering a black box.

You can read the same documentation I use on my own template: [live URL]/docs/whats-new`,
  },
  {
    type: "code",
    language: "text",
    title: "Telegram - client 1: founders and store owners",
    code: `Selling online and juggling a shop platform plus an email tool?

I build commerce sites where the store and the email live in one system: real products and prices in your emails, seasonal starters, locked brand blocks and undo on every edit. Built on a tested template, documented for handover.

See the emails: [live URL]/docs/email-seasonal-campaigns

Tell me what you sell and I will say whether it fits.`,
  },
  {
    type: "code",
    language: "text",
    title: "X - client 1",
    code: "Own your store and your email in one place. Block-based email builder, seasonal starters, real products and prices from your catalog. No separate email subscription. [live URL]/docs/email-seasonal-campaigns",
  },
  {
    type: "code",
    language: "text",
    title: "X - client 2",
    code: "Need a commerce site on a tested foundation? I start from a Next.js template with checkout, admin, email and docs already in place, then customise it to your brand. Message me. [live URL]/docs/case-study-email-platform",
  },
  {
    type: "code",
    language: "text",
    title: "X - client 3",
    code: "A handover should not be a black box. My builds ship with decision records, a changelog and a test suite, so your next developer can start on day one. [live URL]/docs/whats-new",
  },
  {
    type: "code",
    language: "text",
    title: "DM - client",
    code: `Hi, thanks for your message. The best overview is the public case study for the platform I would start from: [live URL]/docs/case-study-email-platform

To tell you honestly whether it fits, I need three things: what you sell, roughly how many products, and whether you already have a site or email tool you want to replace. Then I can suggest a scope.

[your name]`,
  },
]
