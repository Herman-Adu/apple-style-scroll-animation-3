import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Product } from "../schema"
import { Eyebrow, AccentDivider, Reveal } from "@/components/primitives"
import { ProductCard } from "./product-card"

export function ProductShowcase({ products }: { products: Product[] }) {
  return (
    <section className="relative z-10 border-t border-foreground/10 bg-background px-6 py-24 md:px-12 md:py-32">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow dot={false} className="mb-4 text-foreground/40">
              The collection
            </Eyebrow>
            <h2 className="max-w-xl text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Engineered for every kind of listening.
            </h2>
            <AccentDivider className="mt-6" />
          </div>
          <Link
            href="/products"
            className="group inline-flex items-center gap-2 text-sm font-medium text-foreground/60 transition-colors hover:text-foreground"
          >
            View all products
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
          </Link>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => (
            <ProductCard key={product.slug} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
