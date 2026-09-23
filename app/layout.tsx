import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Inter } from "next/font/google"
import { CartProvider } from "@/lib/cart-context"
import { CatalogProvider } from "@/features/catalog"
import { AuthProvider } from "@/lib/auth/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { SiteChrome } from "@/components/layout/site-chrome"
import { getAllProducts } from "@/lib/data/products"
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const catalog = getAllProducts()

  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
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
        <Analytics />
      </body>
    </html>
  )
}
