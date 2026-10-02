import type { NavLink } from "@/lib/types"

export const siteConfig = {
  name: "Momo Audio",
  shortName: "MOMO",
  description:
    "Momo Audio builds reference-grade headphones, earbuds, and speakers. Titanium craft, planar precision, and immersive spatial sound.",
  founded: 2016,
  location: "London · Copenhagen · Accra · Tokyo",
  email: "admin@adudev.co.uk",
}

export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/products" },
      { label: "Headphones", href: "/products?category=Headphones" },
      { label: "Earbuds", href: "/products?category=Earbuds" },
      { label: "Speakers", href: "/products?category=Speakers" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Articles", href: "/articles" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help & Docs", href: "/docs" },
      { label: "Warranty", href: "/warranty" },
      { label: "Shipping", href: "/shipping" },
      { label: "Returns", href: "/returns" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
]

/** The values that anchor the About page narrative. */
export const companyValues = [
  {
    title: "Truth over hype",
    description:
      "We tune to neutrality, not to a marketing curve. What you hear is what the artist made.",
  },
  {
    title: "Built to last",
    description:
      "Serviceable parts, machined metal, and repairs over replacement. Great sound should not be disposable.",
  },
  {
    title: "Research first",
    description:
      "Every product starts in the lab. If the measurements do not hold, the idea does not ship.",
  },
]

export const companyMilestones = [
  {
    year: "2016",
    title: "Founded in Copenhagen",
    description: "Three engineers and one anechoic chamber.",
    icon: "compass",
  },
  {
    year: "2019",
    title: "First planar driver",
    description: "The 40mm driver that would become Momo X.",
    icon: "waveform",
  },
  {
    year: "2022",
    title: "Opened the Accra lab",
    description: "A second acoustics team and a global standard.",
    icon: "flask",
  },
  {
    year: "2026",
    title: "The Momo X era",
    description: "Our most advanced headphone reaches the world.",
    icon: "headphones",
  },
  ]
