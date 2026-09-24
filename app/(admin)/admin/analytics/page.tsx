import { AdminShell, AnalyticsPanel, OfferAnalyticsPanel } from "@/features/admin"

export default function AdminAnalyticsPage() {
  return (
    <AdminShell title="Analytics">
      <div className="flex flex-col gap-10">
        <AnalyticsPanel />
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-base font-semibold">Offers</h2>
            <p className="text-sm text-muted-foreground">
              Personal offer performance — sends, redemptions and conversion.
            </p>
          </div>
          <OfferAnalyticsPanel />
        </section>
      </div>
    </AdminShell>
  )
}
