import type { Doc } from "../schema"

export const managingYourTheme: Doc = {
  slug: "managing-your-theme",
  title: "Managing Your Theme",
  category: "Store Operations",
  audience: "content",
  access: "public",
  summary:
    "Run the store's look from one place. The Theme section controls brand colours, heading style (two-tone, solid, or gradient), and email accent — and every change flows to the storefront, the admin, and your emails at once. Covers the four tabs: Active & presets, Brand colours, Headings & style, and Theme templates.",
  readingMinutes: 8,
  order: 3,
  updatedAt: "2026-09-29",
  tags: ["theme", "branding", "colours", "headings", "email", "store operations"],
  body: [
    {
      type: "paragraph",
      text: "The Theme section (Admin → Theme) is the single control room for how the whole store looks. Pick or build a colour theme, choose how headings render, and set the email accent — and it all takes effect everywhere the moment you activate it. There's no per-page styling to chase: the storefront, this admin, and your transactional emails all read from the one active theme.",
    },
    {
      type: "callout",
      variant: "tip",
      title: "One theme, everywhere",
      text: "Whatever theme is marked Active is the theme customers see, the theme you see in the admin, and the accent colour on your emails. Change it once here and the whole surface follows.",
    },
    {
      type: "heading",
      text: "The four tabs at a glance",
    },
    {
      type: "table",
      headers: ["Tab", "What it controls", "When to use it"],
      rows: [
        ["Active & presets", "Which theme is live, and a gallery of built-in palettes to start from.", "Switching the active look, or installing a preset as a starting point."],
        ["Brand colours", "The core brand colour and accents for the active theme.", "Fine-tuning your palette to match your brand exactly."],
        ["Headings & style", "How headings render (two-tone, solid, or gradient) and how far the accent reaches.", "Setting the signature look of titles across the store."],
        ["Theme templates", "Saving, duplicating, and managing your own reusable themes.", "Keeping a seasonal or campaign look ready to switch back on."],
      ],
    },
    {
      type: "heading",
      text: "Active & presets",
    },
    {
      type: "paragraph",
      text: "This is the home tab. Your Themes lists the themes you own, with the active one clearly marked; Presets is a gallery of built-in palettes (Titanium Teal, Solar Amber, Electric Indigo, and more). Activating a preset copies it into Your Themes and makes it live — presets themselves are never edited, so you always have a clean starting point to come back to.",
    },
    {
      type: "steps",
      items: [
        { title: "Preview a preset", text: "The Live Preview panel on the right shows a real slice of the storefront in the selected palette before you commit." },
        { title: "Activate", text: "Click Active on a theme (or activate a preset) to make it live. The change is immediate across storefront, admin, and email." },
        { title: "Reset if needed", text: "Reset to default returns you to the shipped Titanium Teal theme at any time." },
      ],
    },
    {
      type: "heading",
      text: "How a theme reaches every surface",
    },
    {
      type: "mermaid",
      kind: "flow",
      title: "Figure 1 — From Save to the whole store",
      caption:
        "The active theme is stored once and injected as CSS variables when each page renders. The storefront, admin, and emails all read those same variables, so nothing can drift out of sync.",
      diagram: [
        "flowchart LR",
        "  A[Edit theme in admin] --> B[Save / Activate]",
        "  B --> C[(Stored as the active theme)]",
        "  C --> D[Injected as colour + font variables at render]",
        "  D --> E[Storefront]",
        "  D --> F[Admin dashboard]",
        "  D --> G[Emails - accent colour]",
      ].join("\n"),
    },
    {
      type: "heading",
      text: "Brand colours",
    },
    {
      type: "paragraph",
      text: "Here you set the brand colour and its accents for the active theme. Adjust them and the Live Preview updates so you can see the palette on real UI — buttons, links, badges, and the email accent — before you save. Aim for a small, confident palette: one brand colour plus a couple of accents reads far more premium than a rainbow.",
    },
    {
      type: "callout",
      variant: "note",
      title: "Contrast is checked for you",
      text: "The palette keeps text-on-colour readable, so a saved theme stays legible in both light and dark mode. If a combination would be hard to read, tune the brand colour rather than forcing text colours by hand.",
    },
    {
      type: "heading",
      text: "Headings & style",
    },
    {
      type: "paragraph",
      text: "This tab sets the signature treatment for headings across the store. There are three styles, and the choice is what gives the store its personality.",
    },
    {
      type: "table",
      headers: ["Style", "Look", "Best for"],
      rows: [
        ["Two-tone", "Most of the heading in the foreground colour, the last word (or accent word) in the brand colour.", "A modern, editorial feel — the default."],
        ["Solid", "The whole heading in one colour.", "Clean, understated, maximum legibility."],
        ["Gradient", "The heading fades across two brand colours.", "A bold, expressive hero moment."],
      ],
    },
    {
      type: "mermaid",
      kind: "state",
      title: "Figure 2 — Choosing a heading style",
      caption: "One switch changes every heading on the store. Two-tone is the default; solid and gradient are one click away.",
      diagram: [
        "stateDiagram-v2",
        "  [*] --> TwoTone: default",
        "  TwoTone --> Solid: pick Solid",
        "  TwoTone --> Gradient: pick Gradient",
        "  Solid --> TwoTone: pick Two-tone",
        "  Solid --> Gradient: pick Gradient",
        "  Gradient --> TwoTone: pick Two-tone",
        "  Gradient --> Solid: pick Solid",
      ].join("\n"),
    },
    {
      type: "callout",
      variant: "tip",
      title: "Two-tone reads the accent word for you",
      text: "In two-tone mode the accent falls on the last word of a heading. Titles can also mark a specific accent word, so \"Titanium Performance.\" keeps \"Titanium\" in the foreground and colours \"Performance.\" — no manual styling required.",
    },
    {
      type: "paragraph",
      text: "Below the style, the Accent reach controls decide which headings are accented at all. It's a second, independent choice from the style — and it's split into three switches you can toggle in any combination, so you shape exactly how far the brand colour travels.",
    },
    {
      type: "table",
      headers: ["Accent toggle", "What it controls", "Typical use"],
      rows: [
        ["Page & hero titles", "The single largest headline on each page — heroes and page titles.", "Almost always on — the boldest brand moment."],
        ["Section headlines", "The titles that introduce each section down a page.", "On for a fully branded feel; off to keep sections calm."],
        ["Card & list titles", "Small repeated titles — product and value cards, list items, timeline milestones.", "Off by default for a refined look; on for maximum brand presence."],
      ],
    },
    {
      type: "callout",
      variant: "note",
      title: "Mix them any way you like",
      text: "The three toggles are independent: accent your page titles but keep section headlines and cards plain, light up everything, or anything in between. Each switch flows to every page the moment you save — the storefront, the admin, and every section inside — with nothing to set per page or per card.",
    },
    {
      type: "callout",
      variant: "note",
      title: "Reset to default anytime",
      text: "The Reset to default button on the Headings & style page returns the style and all three accent toggles to the shipped Titanium Teal two-tone look — page and section titles accented, cards plain. Experiment freely; you're always one click from the original.",
    },
    {
      type: "heading",
      text: "Theme templates",
    },
    {
      type: "paragraph",
      text: "Templates are your own saved themes. Duplicate the active theme to branch a new look, rename it, and keep it on the shelf — a festive palette, a launch-day accent, a partner co-brand — ready to activate when the moment comes. Deleting a template never affects the built-in presets, which are always available to start again from.",
    },
    {
      type: "steps",
      items: [
        { title: "Duplicate", text: "Copy the active theme to create an editable template without touching what's live." },
        { title: "Tune & name", text: "Adjust colours and heading style, then give it a memorable name." },
        { title: "Activate when ready", text: "Switch it live for a campaign, then switch back — both looks stay saved." },
      ],
    },
    {
      type: "callout",
      variant: "warning",
      title: "Activating changes the live store instantly",
      text: "There's no separate publish step — activating a theme is the publish. Preview in the Live Preview panel first, especially before activating during busy trading hours.",
    },
    {
      type: "heading",
      text: "Where to go next",
    },
    {
      type: "list",
      items: [
        "Email Templates — how the theme accent flows into your transactional and campaign emails.",
        "The Theme System (developer guide) — how the active theme is stored and injected, if you want the technical picture.",
      ],
    },
  ],
}
