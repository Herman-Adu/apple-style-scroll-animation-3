import { buildThemeCss, type ThemeTemplate } from "@/features/settings"

/**
 * Emits the active theme's accent/gradient token overrides as an inline
 * <style>, rendered after globals.css so it wins the cascade. This is the
 * mechanism that re-themes the entire storefront + admin from one source with
 * zero per-component edits, SSR-seeded so there is no flash on first paint.
 */
export function BrandThemeStyle({ theme }: { theme: ThemeTemplate }) {
  return <style id="brand-theme" dangerouslySetInnerHTML={{ __html: buildThemeCss(theme) }} />
}
