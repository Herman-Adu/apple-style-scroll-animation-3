import type { Metadata } from "next"
import { LegalPageLayout } from "@/components/layout/legal-page-layout"
import { privacyContent } from "@/lib/data/legal"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: privacyContent.description,
}

export default function PrivacyPage() {
  return <LegalPageLayout content={privacyContent} />
}
