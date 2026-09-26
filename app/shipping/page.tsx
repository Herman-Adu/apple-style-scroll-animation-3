import type { Metadata } from "next"
import { LegalPageLayout } from "@/components/layout/legal-page-layout"
import { shippingContent } from "@/lib/data/legal"

export const metadata: Metadata = {
  title: "Shipping",
  description: shippingContent.description,
}

export default function ShippingPage() {
  return <LegalPageLayout content={shippingContent} />
}
