import type { SocialFormat } from "./social-assets"

type Base = {
  id: string
  format: SocialFormat
  eyebrow: string
  title: string
  summary: string
}

export type StackSource = { pkg: string; major?: number } | { file: string }
export type StackItem = { name: string; version?: string; source: StackSource }

export type Infographic =
  | (Base & { kind: "stack"; groups: { label: string; items: StackItem[] }[] })
  | (Base & { kind: "layers"; layers: { name: string; detail: string }[] })
  | (Base & { kind: "before-after"; rows: { label: string; before: number; after: number; note: string }[] })
  | (Base & { kind: "site-map"; areas: { name: string; routes: { path: string; label: string }[] }[] })
  | (Base & { kind: "flow"; steps: { title: string; detail: string }[] })
  | (Base & { kind: "gates"; steps: { name: string; detail: string }[] })
  | (Base & { kind: "offer"; columns: { heading: string; items: string[] }[] })

export const INFOGRAPHIC_KINDS = ["stack", "layers", "before-after", "site-map", "flow", "gates", "offer"] as const

export const infographics: Infographic[] = [
  {
    id: "infographic-stack",
    kind: "stack",
    format: "carousel",
    eyebrow: "The stack",
    title: "A modern stack, chosen for the long run.",
    summary: "Typed end to end, server first, every piece swappable.",
    groups: [
      {
        label: "Framework",
        items: [
          { name: "Next.js", version: "16", source: { pkg: "next", major: 16 } },
          { name: "React", version: "19", source: { pkg: "react", major: 19 } },
          { name: "TypeScript", source: { pkg: "typescript" } },
          { name: "Tailwind CSS", version: "4", source: { pkg: "tailwindcss", major: 4 } },
        ],
      },
      {
        label: "Data and auth",
        items: [
          { name: "Prisma", version: "6", source: { pkg: "prisma", major: 6 } },
          { name: "Neon", source: { file: "prisma/schema.prisma" } },
          { name: "Better Auth", source: { pkg: "better-auth" } },
          { name: "Zod", version: "4", source: { pkg: "zod", major: 4 } },
        ],
      },
      {
        label: "Payments and email",
        items: [
          { name: "Stripe", source: { pkg: "stripe" } },
          { name: "Resend", source: { file: "features/email/lib/adapters/sending/provider.ts" } },
        ],
      },
      {
        label: "Quality",
        items: [
          { name: "Vitest", source: { pkg: "vitest" } },
          { name: "Playwright", source: { pkg: "@playwright/test" } },
        ],
      },
    ],
  },
  {
    id: "infographic-layers",
    kind: "layers",
    format: "square",
    eyebrow: "Architecture",
    title: "Dependencies flow one way.",
    summary: "Each layer knows only the one beneath it. CI enforces it.",
    layers: [
      { name: "app", detail: "Routes, layouts and error boundaries" },
      { name: "features", detail: "One slice per domain, one public entry each" },
      { name: "features/*/lib", detail: "actions, data, domain, adapters" },
      { name: "lib", detail: "Shared code. Never imports a feature" },
    ],
  },
  {
    id: "infographic-before-after",
    kind: "before-after",
    format: "square",
    eyebrow: "Engineering health",
    title: "Measured, then fixed.",
    summary: "Four architecture numbers tracked in CI, before and after.",
    rows: [
      { label: "Deep imports across features", before: 116, after: 0, note: "One public entry per slice" },
      { label: "Shared code depending on features", before: 16, after: 0, note: "Dependencies point one way" },
      { label: "any types", before: 28, after: 0, note: "Validated at every boundary" },
      { label: "useEffect calls", before: 55, after: 31, note: "Data loading moved to the server" },
    ],
  },
  {
    id: "infographic-site-map",
    kind: "site-map",
    format: "carousel",
    eyebrow: "What is in the box",
    title: "Storefront, admin and docs in one repo.",
    summary: "Customers shop, owners run the business, teams learn the system.",
    areas: [
      {
        name: "Storefront",
        routes: [
          { path: "/", label: "Home" },
          { path: "/products", label: "Product catalog" },
          { path: "/checkout", label: "Checkout" },
          { path: "/account", label: "Customer account" },
          { path: "/articles", label: "Articles" },
        ],
      },
      {
        name: "Admin",
        routes: [
          { path: "/admin", label: "Overview" },
          { path: "/admin/orders", label: "Orders" },
          { path: "/admin/customers", label: "Customers" },
          { path: "/admin/email", label: "Email campaigns" },
          { path: "/admin/discounts", label: "Discount codes" },
          { path: "/admin/analytics", label: "Analytics" },
        ],
      },
      {
        name: "Docs",
        routes: [
          { path: "/docs", label: "Documentation home" },
          { path: "/docs/[slug]", label: "Guides, ADRs and case studies" },
          { path: "/admin/docs", label: "In-admin help" },
        ],
      },
    ],
  },
  {
    id: "infographic-flow",
    kind: "flow",
    format: "carousel",
    eyebrow: "End to end",
    title: "From cart to confirmation email.",
    summary: "One flow, six steps, every one covered by tests.",
    steps: [
      { title: "Cart", detail: "Prices and quantities re-checked on the server" },
      { title: "Discount code", detail: "Validated and applied before payment" },
      { title: "Stripe payment", detail: "Hosted, secure and idempotent" },
      { title: "Webhook confirms", detail: "The order is finalised once, never twice" },
      { title: "Order saved", detail: "Stock updated and visible in the admin" },
      { title: "Confirmation email", detail: "Sent from an editable template" },
    ],
  },
  {
    id: "infographic-gates",
    kind: "gates",
    format: "square",
    eyebrow: "Quality gates",
    title: "Nothing merges unless all seven pass.",
    summary: "Every pull request runs the same pipeline, then a real preview build.",
    steps: [
      { name: "Typecheck", detail: "Strict TypeScript" },
      { name: "Lint", detail: "Boundary rules included" },
      { name: "Arch", detail: "Architecture ratchet" },
      { name: "Unit", detail: "Pure logic and docs guards" },
      { name: "Integration", detail: "Database-backed flows" },
      { name: "Smoke", detail: "Real browser journeys" },
      { name: "Axe", detail: "Accessibility checks" },
    ],
  },
  {
    id: "infographic-offer",
    kind: "offer",
    format: "carousel",
    eyebrow: "Work with me",
    title: "A working store, made yours.",
    summary: "Start from a tested template, spend time on what sets you apart.",
    columns: [
      {
        heading: "Included",
        items: [
          "Storefront with product pages",
          "Checkout with Stripe test mode",
          "Admin for orders and customers",
          "Email campaigns and templates",
          "Discount codes and offers",
        ],
      },
      {
        heading: "Customised for you",
        items: ["Your brand, theme and fonts", "Your products and catalog", "Your domain and email sender", "Your Stripe and Resend accounts"],
      },
      {
        heading: "Handover",
        items: ["Written handover guide", "Local runbook and environment guide", "Tests and CI left green", "Docs site your team can extend"],
      },
    ],
  },
]

export function getInfographic(id: string): Infographic | undefined {
  return infographics.find((i) => i.id === id)
}
