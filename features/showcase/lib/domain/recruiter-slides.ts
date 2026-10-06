import type { Infographic } from "./infographics"

export const recruiterInfographics: Infographic[] = [
  {
    id: "infographic-recruiter-built",
    kind: "table",
    format: "carousel",
    pack: "recruiter",
    eyebrow: "What I built",
    title: "A real store, built and run like a product.",
    summary: "Each part exists because the business needs it.",
    columns: ["Built", "Why it matters"],
    rows: [
      { label: "Storefront and checkout", cells: ["Customers pay safely with Stripe"] },
      { label: "Admin for owners", cells: ["Orders, stock and offers without a developer"] },
      { label: "Email platform", cells: ["Campaigns built from live catalog data"] },
      { label: "Back-in-stock alerts", cells: ["Sold-out pages still capture demand"] },
      { label: "Docs site", cells: ["New teammates get productive fast"] },
    ],
  },
  {
    id: "infographic-recruiter-proof",
    kind: "table",
    format: "carousel",
    pack: "recruiter",
    eyebrow: "Proof",
    title: "Measured on every run, not claimed.",
    summary: "Read from the latest test run, never typed in by hand.",
    columns: ["Measure", "Today", "Kept honest by"],
    rows: [
      { label: "Automated tests", cells: [{ fact: "tests.total" }, "Every pull request"] },
      { label: "Line coverage %", cells: [{ fact: "coverage.lines" }, "A baseline CI will not lower"] },
      { label: "Branch coverage %", cells: [{ fact: "coverage.branches" }, "The same ratchet"] },
      { label: "Deep imports", cells: [{ fact: "arch.deepImports" }, "Architecture audit in CI"] },
      { label: "Merge gates", cells: ["All required", "CI checks plus a preview build"] },
    ],
  },
  {
    id: "infographic-recruiter-judgement",
    kind: "layers",
    format: "carousel",
    pack: "recruiter",
    eyebrow: "Engineering judgement",
    title: "One rule: dependencies flow one way.",
    summary: "Never the reverse. CI fails any import that breaks the rule.",
    layers: [
      { name: "app", detail: "Routes and layouts only" },
      { name: "features", detail: "One slice per domain, one public entry each" },
      { name: "features/*/lib", detail: "actions, data, domain, adapters" },
      { name: "lib", detail: "Shared code. Never imports a feature" },
    ],
  },
]
