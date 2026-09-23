import type { Doc } from "../schema"

export const companyProfileAndSetup: Doc = {
  slug: "company-profile-and-admin-setup",
  title: "Company Profile & Admin Setup",
  category: "Store Operations",
  audience: "content",
  access: "admin",
  summary:
    "Set up the business identity once and reuse it everywhere — the company profile, the guided admin onboarding, and how the structured address becomes the single source of truth for invoices, email footers, and Strapi.",
  readingMinutes: 8,
  order: 1,
  updatedAt: "2026-09-23",
  tags: ["admin", "onboarding", "company profile", "address", "settings", "single source of truth"],
  body: [
    {
      type: "paragraph",
      text: "The admin dashboard separates two identities that used to be confused: the customer profile (who the shopper is, collected by the storefront onboarding) and the company profile (who the business is). This guide covers the company side — the one-time setup an admin completes, where the details live, and how everything downstream reads from that single record.",
    },
    {
      type: "callout",
      variant: "note",
      text: "Admin-only. Sign in with an admin account, open the account menu, and choose Profile to reach the company profile — it lives inside the dashboard, not on the storefront.",
    },
    {
      type: "heading",
      text: "First-run onboarding",
    },
    {
      type: "paragraph",
      text: "The first time an admin opens the dashboard without a completed company profile, a full-screen onboarding takeover appears. It mirrors the customer onboarding pattern but collects business details instead of shopper preferences. It is skippable — you can dismiss it and finish later from the profile page — but completing it seeds every field the rest of the dashboard expects.",
    },
    {
      type: "steps",
      items: [
        { title: "Identity", text: "Legal company name, trading name, industry, and logo upload." },
        { title: "Contact", text: "Primary contact name, admin/support email, and phone number." },
        { title: "Address", text: "Structured UK address — line 1, line 2, town/city, county, postcode, and country." },
        { title: "Tax & registration", text: "VAT number and company registration number, validated as you type." },
      ],
    },
    {
      type: "heading",
      text: "The company profile page",
    },
    {
      type: "paragraph",
      text: "Once set up, the same fields live on the company profile page, organised into tabs so the form stays readable as it grows. Each tab surfaces its own validation state, so an invalid postcode or email flags the tab it lives on rather than hiding at the bottom of a long form.",
    },
    {
      type: "table",
      title: "Profile tabs",
      headers: ["Tab", "What it holds"],
      rows: [
        ["Identity", "Company name, trading name, industry, logo."],
        ["Contact", "Contact person, admin email, support phone."],
        ["Address", "Structured UK address with a live single-line preview."],
        ["Tax & registration", "VAT and registration numbers."],
      ],
    },
    {
      type: "callout",
      variant: "tip",
      title: "Store details vs company profile",
      text: "The Settings page keeps a separate 'Store details' card (public store name, support email, currency) — that is the customer-facing storefront identity. The company profile is the legal/operational identity behind it. They are deliberately kept apart so a rebrand of one does not silently change the other.",
    },
    {
      type: "heading",
      text: "Why the address is structured",
    },
    {
      type: "paragraph",
      text: "The address is stored as discrete fields rather than a free-text block on purpose. A structured record is the single source of truth every other surface can read field-by-field — no fragile parsing of a textarea, and no copy of the address drifting out of date in three different places.",
    },
    {
      type: "list",
      items: [
        "Invoices and order PDFs render the registered business address from these fields.",
        "Transactional email footers (order confirmations, restock alerts) pull the same address and contact details.",
        "The future Strapi migration maps each field 1:1 onto a company/global content type — no re-modelling required.",
        "UK-specific validation (postcode format, phone, VAT) keeps the data clean at entry, so downstream consumers can trust it.",
      ],
    },
    {
      type: "callout",
      variant: "success",
      title: "Set once, reuse everywhere",
      text: "Update the company profile in one place and every invoice, email, and (later) CMS-driven page reflects it. That is the whole point of a single source of truth — the address is entered exactly once.",
    },
    {
      type: "callout",
      variant: "note",
      text: "Today the company record is persisted in the app's local storage layer, the same pattern as the demo auth. When the store moves server-side with Strapi, the record becomes a global/single-type and this workflow stays identical — you'll just be editing the same fields against the CMS.",
    },
  ],
}
