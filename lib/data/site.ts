import {
  BookOpen,
  Clock,
  Compass,
  Ear,
  FileText,
  Headphones,
  History,
  Home,
  Info,
  LayoutGrid,
  Mail,
  MapPin,
  MessageSquare,
  Newspaper,
  Package,
  Speaker,
  Sparkles,
} from "lucide-react"
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
      { label: "Philosophy", href: "/#statement", hint: "What we believe", icon: Sparkles },
      { label: "The collection", href: "/#collection", hint: "Every product", icon: LayoutGrid },
      { label: "Journal", href: "/#journal", hint: "Latest field notes", icon: Newspaper },
    ],
  },
  {
    label: "About",
    href: "/about",
    icon: Info,
    sections: [
      { label: "Our story", href: "/about#intro", hint: "How Momo began", icon: BookOpen },
      { label: "Values", href: "/about#values", hint: "What guides us", icon: Compass },
      { label: "Timeline", href: "/about#timeline", hint: "A decade of listening", icon: History },
      { label: "Visit us", href: "/about#visit", hint: "Come and listen", icon: MapPin },
    ],
  },
  {
    label: "Products",
    href: "/products",
    icon: Package,
    sections: [
      { label: "All products", href: "/products", hint: "The full collection", icon: LayoutGrid },
      { label: "Headphones", href: "/products?category=Headphones", hint: "Over-ear reference", icon: Headphones },
      { label: "Earbuds", href: "/products?category=Earbuds", hint: "Pocketable precision", icon: Ear },
      { label: "Speakers", href: "/products?category=Speakers", hint: "Fill the room", icon: Speaker },
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
      icon: FileText,
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
      { label: "Send an enquiry", href: "/contact#enquiry", hint: "Pick a topic", icon: MessageSquare },
      { label: "Opening hours", href: "/contact#hours", hint: "When we're around", icon: Clock },
      { label: "Our studios", href: "/contact#studios", hint: "Find us on the map", icon: MapPin },
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
