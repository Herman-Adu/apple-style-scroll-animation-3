import { BookOpen, Home, Info, Mail, Newspaper, Package } from "lucide-react"
import type { NavLink } from "@/lib/types"
import { getAllArticles } from "@/lib/data/articles"

/** The three most recent articles, surfaced in the Articles nav dropdown. */
const featuredArticles = getAllArticles().slice(0, 3)

export const siteConfig = {
  name: "Momo Audio",
  shortName: "MOMO",
  description:
    "Momo Audio builds reference-grade headphones, earbuds, and speakers. Titanium craft, planar precision, and immersive spatial sound.",
  founded: 2016,
  location: "London · Copenhagen · Accra · Tokyo",
  email: "hello@momoaudio.com",
}

export const mainNav: NavLink[] = [
  {
    label: "Home",
    href: "/",
    icon: Home,
    sections: [
      { label: "Philosophy", href: "/#statement", hint: "What we believe" },
      { label: "The collection", href: "/#collection", hint: "Every product" },
      { label: "Journal", href: "/#journal", hint: "Latest field notes" },
    ],
  },
  {
    label: "About",
    href: "/about",
    icon: Info,
    sections: [
      { label: "Our story", href: "/about#intro", hint: "How Momo began" },
      { label: "Values", href: "/about#values", hint: "What guides us" },
      { label: "Timeline", href: "/about#timeline", hint: "A decade of listening" },
      { label: "Visit us", href: "/about#visit", hint: "Come and listen" },
    ],
  },
  {
    label: "Products",
    href: "/products",
    icon: Package,
    sections: [
      { label: "All products", href: "/products", hint: "The full collection" },
      { label: "Headphones", href: "/products?category=Headphones", hint: "Over-ear reference" },
      { label: "Earbuds", href: "/products?category=Earbuds", hint: "Pocketable precision" },
      { label: "Speakers", href: "/products?category=Speakers", hint: "Fill the room" },
    ],
  },
  {
    label: "Articles",
    href: "/articles",
    icon: Newspaper,
    sections: featuredArticles.map((article) => ({
      label: article.title,
      href: `/articles/${article.slug}`,
      hint: `${article.category} · ${article.readingMinutes} min read`,
    })),
  },
  {
    label: "Docs",
    href: "/docs",
    icon: BookOpen,
  },
  {
    label: "Contact",
    href: "/contact",
    icon: Mail,
    sections: [
      { label: "Send an enquiry", href: "/contact#enquiry", hint: "Pick a topic" },
      { label: "Opening hours", href: "/contact#hours", hint: "When we're around" },
      { label: "Our studios", href: "/contact#studios", hint: "Find us on the map" },
    ],
  },
]

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
      { label: "Warranty", href: "/about" },
      { label: "Shipping", href: "/about" },
      { label: "Returns", href: "/about" },
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
