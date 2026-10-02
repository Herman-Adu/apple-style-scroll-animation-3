import type { Doc } from "../schema"

export const platformGlossary: Doc = {
  slug: "platform-glossary",
  title: "Platform Glossary",
  category: "Store Operations",
  audience: "content",
  access: "public",
  summary:
    "Plain-English definitions of the terms used across the store, the email builder, security and engineering docs. Useful for new team members, clients reviewing the platform and recruiters reading the engineering pages.",
  readingMinutes: 6,
  order: 99,
  updatedAt: "2026-10-02",
  tags: ["glossary", "terms", "definitions", "onboarding"],
  body: [
    {
      type: "paragraph",
      text: "Terms are grouped by where you will meet them. Each definition describes how the term works in this platform specifically, not just in general.",
    },
    {
      type: "table",
      title: "Email builder",
      headers: ["Term", "Meaning"],
      rows: [
        ["Block", "One piece of an email: hero, heading, text, button, image, list, callout, divider, spacer, order summary, Product picks or low stock items. Templates are an ordered list of blocks."],
        ["Template", "A reusable email made of blocks plus a subject line. Used for campaigns and transactional messages."],
        ["System template", "A built-in transactional email (order confirmation, refund, low stock, order notification). It can be edited and reset to its original version, but not deleted."],
        ["Starter", "A ready-made template in the New template gallery, grouped as Essentials or Seasonal campaigns."],
        ["Saved section", "A named group of blocks (for example a brand header) that can be inserted into any template. Each insert is an independent copy, up to 20 blocks."],
        ["Locked block", "A block that cannot be edited, moved or deleted. Only admins with lock permission can lock or unlock."],
        ["Placeholder", "A token such as {{customer_name}} that is replaced with real data when the email is sent. The picker inserts them; the editor flags unknown ones."],
        ["Product picks", "A block that shows real products from the catalog, with live prices and images."],
        ["Version history", "Every save is recorded. The last 50 saves can be restored; the original version is always kept."],
        ["Reset to original", "Restores a system template to how it shipped, recorded as a new version so it can be undone."],
        ["Campaign", "A template sent to subscribers, now or at a scheduled time."],
      ],
    },
    {
      type: "table",
      title: "Access and security",
      headers: ["Term", "Meaning"],
      rows: [
        ["Owner", "The super admin account. Can see owner-only docs and always has lock permission."],
        ["Admin", "A staff account with access to the admin area."],
        ["Lock permission", "The right to lock and unlock blocks. Granted to the owner plus an allow-list of admin emails."],
        ["Proxy", "The first check on every request. Sends signed-out visitors away from admin pages before any page code runs."],
        ["Server action", "A function that runs on the server when the admin UI saves something. Every email action checks the caller is an admin."],
        ["Defence in depth", "Checking permissions in several independent places (proxy, server, UI) so one mistake does not expose anything."],
      ],
    },
    {
      type: "table",
      title: "Engineering",
      headers: ["Term", "Meaning"],
      rows: [
        ["TDD", "Test-driven development: the test is written first, seen to fail, then the code is written to pass it. Every sprint in this project followed it."],
        ["Unit test", "A fast test of one pure function, such as the lock or placeholder rules."],
        ["Integration test", "A test of several parts together, such as a server action, its permission check and the database layer."],
        ["Pure module", "Code with no database or network access, so it is easy to test. Business rules live in pure modules."],
        ["ADR", "Architecture decision record: a short note explaining why a technical choice was made."],
        ["Squash merge", "Combining a pull request into one commit on main, keeping history readable."],
        ["Revalidation", "Telling the site to refresh cached pages after data changes, so customers see current prices and stock."],
        ["Cron", "A scheduled job. Here it sends scheduled campaigns on time."],
      ],
    },
    {
      type: "callout",
      variant: "info",
      title: "Missing a term?",
      text: "If you meet a word in the docs that is not defined here, it is a docs bug. Add it to this page in the same pull request as the feature that introduced it.",
    },
  ],
}
