import type { Doc } from "../schema"

export const caringForYourHeadphones: Doc = {
  slug: "caring-for-your-headphones",
  title: "Caring for Your Headphones & Earbuds",
  category: "Product Care",
  audience: "user",
  access: "public",
  summary:
    "Keep your devices sounding and looking their best: cleaning, storage, ear tips, and battery health.",
  readingMinutes: 4,
  order: 2,
  updatedAt: "2026-09-20",
  tags: ["cleaning", "storage", "battery", "maintenance", "ear tips"],
  body: [
    {
      type: "paragraph",
      text: "A little routine care keeps your Momo device performing like new for years. None of this takes more than a minute, and it protects both the sound and the materials.",
    },
    {
      type: "heading",
      text: "Cleaning",
    },
    {
      type: "list",
      items: [
        "Wipe earcups and surfaces with a dry or very lightly damp microfibre cloth. Never use alcohol, solvents, or abrasive cleaners.",
        "For earbuds, remove the silicone tips and rinse them in warm water; let them dry fully before refitting.",
        "Clear the mesh on earbuds gently with a soft, dry brush — don't push debris inward.",
        "Keep the USB-C port and charging contacts free of lint with a dry cotton swab.",
      ],
    },
    {
      type: "heading",
      text: "Storage",
    },
    {
      type: "paragraph",
      text: "Always return your device to its case when you're done. Store it away from direct sunlight, heat, and humidity — a warm car dashboard is the most common cause of avoidable wear on the ear cushions and battery.",
    },
    {
      type: "heading",
      text: "Battery health",
    },
    {
      type: "list",
      items: [
        "You don't need to fully drain the battery — top up whenever it's convenient.",
        "If you won't use the device for a few weeks, charge it to about half first, then store it.",
        "Avoid leaving it plugged in and fully charged in a hot environment for long stretches.",
      ],
    },
    {
      type: "callout",
      variant: "note",
      text: "Ear tips and cushions are wear items. If they lose their shape or seal over time, replacements are available so the rest of the device keeps going.",
    },
    {
      type: "heading",
      text: "Getting the right fit (earbuds)",
    },
    {
      type: "paragraph",
      text: "A good seal is what delivers the bass and isolation the earbuds were tuned for. Try each ear tip size — the right one feels secure without pressure and noticeably quiets the room. It's normal to use a different size in each ear.",
    },
  ],
}
