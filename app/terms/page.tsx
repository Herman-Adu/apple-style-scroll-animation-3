import type { Metadata } from "next"
import { LegalPageLayout } from "@/components/layout/legal-page-layout"
import { termsContent } from "@/lib/data/legal"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: termsContent.description,
}

export default function TermsPage() {
  return <LegalPageLayout content={termsContent} />
}
