import type { Metadata } from "next"
import { LegalPageLayout } from "@/components/layout/legal-page-layout"
import { returnsContent } from "@/lib/data/legal"

export const metadata: Metadata = {
  title: "Returns",
  description: returnsContent.description,
}

export default function ReturnsPage() {
  return <LegalPageLayout content={returnsContent} />
}
