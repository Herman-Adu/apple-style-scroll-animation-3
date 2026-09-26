import type { Metadata } from "next"
import { LegalPageLayout } from "@/components/layout/legal-page-layout"
import { warrantyContent } from "@/lib/data/legal"

export const metadata: Metadata = {
  title: "Warranty",
  description: warrantyContent.description,
}

export default function WarrantyPage() {
  return <LegalPageLayout content={warrantyContent} />
}
