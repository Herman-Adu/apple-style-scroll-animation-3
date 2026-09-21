import Image from "next/image"
import Link from "next/link"
import type { Article } from "@/lib/types"
import { formatDate } from "@/lib/format"
import { Reveal } from "@/components/primitives"

export function ArticleCard({ article, index = 0 }: { article: Article; index?: number }) {
  return (
    <Reveal delay={index * 0.06} className="h-full">
      <article className="h-full">
        <Link href={`/articles/${article.slug}`} className="group flex h-full flex-col">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-foreground/10">
            <Image
              src={article.coverImage || "/placeholder.svg"}
              alt={article.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          </div>
          <div className="flex flex-1 flex-col pt-5">
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
              <span>{article.category}</span>
              <span className="h-1 w-1 rounded-full bg-foreground/30" />
              <span>{article.readingMinutes} min read</span>
            </div>
            <h3 className="mt-3 text-xl font-semibold leading-snug text-foreground transition-colors group-hover:text-foreground/80">
              {article.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/50">{article.excerpt}</p>
            <p className="mt-4 text-xs text-foreground/40">{formatDate(article.publishedAt)}</p>
          </div>
        </Link>
      </article>
    </Reveal>
  )
}
