import type { Infographic } from "./infographics"

const COST_STAGES = ["Launch", "Year one", "Year two", "Year three"]
const FROM_SCRATCH = [6, 8, 10, 12]
const TEMPLATE = [2, 3, 4, 5]

/** Slides for business owners and buyers. Cost leads; every number is either illustrative or the seeded demo store. */
export const buyerInfographics: Infographic[] = [
  {
    id: "infographic-buyer-cost-table",
    kind: "table",
    format: "carousel",
    pack: "buyer",
    illustrative: true,
    eyebrow: "Total cost",
    title: "Three years of ownership, side by side.",
    summary: "Relative cost units: building from scratch versus this tested store.",
    columns: ["Stage", "From scratch", "Template"],
    rows: COST_STAGES.map((label, index) => ({ label, cells: [FROM_SCRATCH[index], TEMPLATE[index]] })),
  },
  {
    id: "infographic-buyer-cost-line",
    kind: "line-chart",
    format: "carousel",
    pack: "buyer",
    illustrative: true,
    eyebrow: "Total cost",
    title: "The gap widens every year.",
    summary: "Cost at each stage, in the same relative units as the table.",
    alt: "Illustrative line chart of cost at each stage over three years: building from scratch climbs steeply, while the tested template starts lower and rises gently.",
    xLabels: COST_STAGES,
    series: [
      { name: "From scratch", values: FROM_SCRATCH },
      { name: "Template", values: TEMPLATE },
    ],
  },
  {
    id: "infographic-buyer-self-serve",
    kind: "table",
    format: "carousel",
    pack: "buyer",
    eyebrow: "Control",
    title: "Your team changes the store, not a developer.",
    summary: "Everyday changes move from a ticket to a page in the admin.",
    columns: ["Change", "Before", "With this store"],
    rows: [
      { label: "Theme", cells: ["Developer ticket", "Theme editor"] },
      { label: "Discounts", cells: ["Code change", "Discounts page"] },
      { label: "Email", cells: ["Agency send", "Campaign builder"] },
      { label: "Restock", cells: ["Lost sale", "Waiting list"] },
    ],
  },
  {
    id: "infographic-buyer-stock-alerts",
    kind: "bar-chart",
    format: "carousel",
    pack: "buyer",
    demoData: true,
    eyebrow: "Back in stock",
    title: "Sold out, still selling.",
    summary: "Waiting per product in the demo store, emailed when stock returns.",
    alt: "Bar chart from the demo store showing how many people are waiting for each sold-out product, with MOMO Studio the most wanted.",
    unit: "people waiting",
    bars: [
      { label: "MOMO Studio", value: 12 },
      { label: "MOMO X", value: 7 },
      { label: "MOMO Beat", value: 4 },
    ],
  },
]
