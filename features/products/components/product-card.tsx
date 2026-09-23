import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import type { Product } from "@/lib/types"
import { formatMoney } from "@/lib/format"
import { Reveal } from "@/components/primitives"
import { ProductStockBadge } from "./product-stock-badge"

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  return (
    <Reveal delay={index * 0.06} className="h-full">
      <Link
        href={`/products/${product.slug}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-foreground/10 bg-foreground/[0.02] transition-colors hover:border-foreground/25"
      >
        <div className="relative aspect-[4/5] overflow-hidden">
          <div
            className="absolute inset-0 opacity-40 blur-3xl transition-opacity duration-500 group-hover:opacity-60"
            style={{ background: `radial-gradient(circle at 50% 40%, ${product.accent}, transparent 65%)` }}
            aria-hidden
          />
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <ProductStockBadge product={product} />
        </div>

        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/40">{product.category}</p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">{product.name}</h3>
            </div>
            <ArrowUpRight
              className="h-5 w-5 shrink-0 text-foreground/40 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
              strokeWidth={1.5}
            />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-foreground/50">{product.summary}</p>
          <p className="mt-6 text-lg font-medium text-foreground">{formatMoney(product.price)}</p>
        </div>
      </Link>
    </Reveal>
  )
}
