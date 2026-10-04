import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Inter } from "next/font/google"
import { CartProvider } from "@/features/checkout"
import { CatalogProvider } from "@/features/catalog"
import { AuthProvider } from "@/lib/auth/adapters/auth-context"
// `fetchAppSession` used to seed the session at the root layout, but that
// forces every page to be server-rendered. We fetch session client-side in
// `AuthProvider` so public pages can be statically prerendered or ISR.
import { ThemeProvider } from "@/components/theme-provider"
import { SiteChrome } from "@/components/layout/site-chrome"
import { BrandThemeStyle } from "@/components/theme/brand-theme-style"
import { getStoreSettingsAction } from "@/features/settings"
import { getActiveTheme, getHeadingAccent } from "@/features/settings"
import { getCatalogProducts } from "@/features/catalog"
import { siteConfig } from "@/lib/data/site"
import { getBaseUrl } from "@/lib/seo/site"
import { JsonLd } from "@/components/seo/json-ld"
import { organizationLd, websiteLd } from "@/lib/seo/structured-data"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: `${siteConfig.name} | Reference-grade sound`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  generator: "v0.app",
  keywords: ["headphones", "earbuds", "speakers", "reference audio", "planar", "spatial sound", siteConfig.name],
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [{ title: `${siteConfig.name} — Journal`, url: "/articles/rss.xml" }],
    },
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: `${siteConfig.name} | Reference-grade sound`,
    description: siteConfig.description,
    url: getBaseUrl(),
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Reference-grade sound`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [catalog, settings] = await Promise.all([getCatalogProducts(), getStoreSettingsAction()])
  const activeTheme = getActiveTheme(settings.theme)
  const headingAccent = getHeadingAccent(activeTheme)

  return (
    <html
      lang="en"
      className="bg-background"
      data-heading-style={activeTheme.headingStyle}
      data-accent-h1={headingAccent.h1 ? "on" : "off"}
      data-accent-h2={headingAccent.h2 ? "on" : "off"}
      data-accent-cards={headingAccent.cards ? "on" : "off"}
      suppressHydrationWarning
    >
      <body className={`${inter.variable} font-sans antialiased`}>
        <BrandThemeStyle theme={activeTheme} />
        <JsonLd data={[organizationLd(), websiteLd()]} />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <CatalogProvider initialProducts={catalog}>
              <CartProvider catalog={catalog}>
                <SiteChrome>{children}</SiteChrome>
              </CartProvider>
            </CatalogProvider>
          </AuthProvider>
        </ThemeProvider>
        {/* /_vercel/insights only exists on Vercel; elsewhere (CI `next start`) the script 404s. */}
        {process.env.VERCEL ? <Analytics /> : null}
      </body>
    </html>
  )
}
