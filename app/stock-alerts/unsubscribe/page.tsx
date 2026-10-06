import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { unsubscribeStockAlertForm } from "@/features/stock-alerts"

export const metadata: Metadata = {
  title: "Unsubscribe from stock alerts",
  robots: { index: false, follow: false },
}

type SearchParams = Promise<{ token?: string; status?: string }>

function Message({ title, body }: { title: string; body: string }) {
  return (
    <>
      <h1 className="text-balance font-sans text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-pretty leading-relaxed text-muted-foreground">{body}</p>
    </>
  )
}

export default async function UnsubscribeStockAlertPage({ searchParams }: { searchParams: SearchParams }) {
  const { token, status } = await searchParams

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col justify-center gap-6 px-6 py-24">
      {status === "done" ? (
        <Message title="You're unsubscribed" body="We won't email you about this product again." />
      ) : status === "invalid" || !token ? (
        <Message
          title="This link isn't valid"
          body="The alert may already have been removed. If you still get emails you don't want, reply to one and we'll sort it."
        />
      ) : (
        <>
          <Message
            title="Stop this stock alert?"
            body="Confirm below and we'll stop emailing you about this product."
          />
          <form action={unsubscribeStockAlertForm}>
            <input type="hidden" name="token" value={token} />
            <Button type="submit">Unsubscribe</Button>
          </form>
        </>
      )}
      <Link href="/products" className="text-sm underline underline-offset-4">
        Back to the products
      </Link>
    </main>
  )
}
