import type { PageHeroContent } from "@/lib/types"
import { siteConfig } from "@/lib/data/site"

/** Per-page hero headers. Home keeps its bespoke scroll hero. */
export const pageHeroes: Record<"about" | "products" | "articles" | "contact" | "docs", PageHeroContent> = {
  about: {
    eyebrow: `Since ${siteConfig.founded}`,
    title: "We build instruments for the truth of sound.",
    titleAccent: "truth of sound",
    subtitle:
      "Three engineers, one anechoic chamber, and a decade spent chasing a single uncompromising standard.",
    image: "/heroes/about-hero.png",
    imageAlt:
      "A Momo acoustic engineer examining a titanium headphone inside the anechoic chamber.",
    align: "left",
    layout: "split",
  },
  products: {
    eyebrow: "The collection",
    title: "Every product is a reference instrument.",
    titleAccent: "reference instrument",
    subtitle:
      "Headphones, earbuds, and speakers — engineered in the same lab and tuned to the same standard.",
    image: "/heroes/products-hero.png",
    imageAlt: "Premium titanium over-ear headphones lit dramatically on a stone plinth.",
    align: "right",
    layout: "split",
  },
  articles: {
    eyebrow: "From the lab",
    title: "Field notes on sound and craft.",
    titleAccent: "sound and craft",
    subtitle:
      "Long-form writing on the acoustics, materials, and psychoacoustics behind every Momo product.",
    image: "/heroes/articles-hero.png",
    imageAlt:
      "A moody workbench with handwritten notes and a disassembled headphone driver under a desk lamp.",
    align: "left",
  },
  contact: {
    eyebrow: "Contact",
    title: "Let's talk sound.",
    titleAccent: "sound",
    subtitle:
      "A question about a product, help with a device you own, or a review to share — we'll route it to the right team.",
    image: "/heroes/contact-hero.png",
    imageAlt: "A Momo support specialist wearing a headset at a minimal studio desk.",
    align: "left",
  },
  docs: {
    eyebrow: "Documentation",
    title: "The engineering & platform library.",
    titleAccent: "platform library",
    subtitle:
      "Deep guides on the server-first architecture, the Strapi migration, DevOps, commerce, and how to position and sell the platform.",
    image: "/heroes/docs-hero.png",
    imageAlt:
      "An architect's desk from above with technical blueprints and exploded-view engineering schematics under a soft directional light.",
    align: "right",
    layout: "split",
  },
}
