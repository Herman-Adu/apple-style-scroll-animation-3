import { BookOpen, Clock, Compass, Ear, FileText, Headphones, History, Home, Info, LayoutGrid, Mail, MapPin, MessageSquare, Newspaper, Package, Sparkles, Speaker } from "lucide-react"
import { getAllArticles } from "@/features/articles"
import { splitSectionHref } from "@/lib/nav"
import type { NavLink } from "@/lib/types"

/** The three most recent articles, surfaced in the Articles nav dropdown. */
const featuredArticles = getAllArticles().slice(0, 3)

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

/** All scroll-spy anchor ids referenced anywhere in the nav (stable, module-level). */
export const NAV_SECTION_IDS: string[] = Array.from(
  new Set(
    mainNav
      .flatMap((link) => link.sections ?? [])
      .map((section) => splitSectionHref(section.href).hash)
      .filter(Boolean),
  ),
)
