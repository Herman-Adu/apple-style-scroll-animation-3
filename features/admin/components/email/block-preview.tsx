"use client";

import { useMemo, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { renderEmail } from "@/features/email";
import type { EmailBlock, EmailBranding } from "@/features/email";
import {
  sampleVars,
  SAMPLE_ORDER_SUMMARY,
  SAMPLE_LOW_STOCK_ITEMS,
} from "@/features/email";
import type { ProductImageMap } from "@/features/products";
import { cn } from "@/lib/utils";

/**
 * Live email preview. Renders the exact same block HTML that gets sent, inside a
 * sandboxed iframe so the email's inline styles can't leak into the admin UI.
 * Pure — recomputes only when blocks, branding, or the product catalog change.
 */
export function BlockPreview({
  blocks,
  branding,
  products = {},
  className,
}: {
  blocks: EmailBlock[];
  branding: EmailBranding;
  /** Slug -> live name/image lookup, so product-linked blocks preview the real image. */
  products?: ProductImageMap;
  className?: string;
}) {
  const html = useMemo(
    () =>
      renderEmail(blocks, branding, {
        vars: sampleVars(branding),
        dynamic: {
          orderSummary: SAMPLE_ORDER_SUMMARY,
          lowStockItems: SAMPLE_LOW_STOCK_ITEMS,
        },
        products,
      }),
    [blocks, branding, products],
  );

  return (
    <iframe
      title="Email preview"
      srcDoc={html}
      sandbox=""
      className={cn(
        "h-full w-full rounded-xl border border-border bg-white",
        className,
      )}
    />
  );
}

/**
 * `BlockPreview` wrapped with a desktop/mobile viewport toggle and heading.
 * Shared by the template editor and campaign editor so content managers can
 * sanity-check single-column mobile rendering without leaving either screen.
 */
export function EmailPreviewPane({
  blocks,
  branding,
  products,
  label = "Live preview",
  emptyState,
  className,
}: {
  blocks: EmailBlock[];
  branding: EmailBranding;
  products?: ProductImageMap;
  label?: string;
  /** Rendered instead of the preview iframe, e.g. "Choose a template to preview". */
  emptyState?: React.ReactNode;
  className?: string;
}) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5">
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              aria-label="Preview on desktop width"
              aria-pressed={device === "desktop"}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
                device === "desktop"
                  ? "bg-accent-teal/10 text-accent-teal"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Monitor className="size-3.5" aria-hidden />
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              aria-label="Preview on mobile width"
              aria-pressed={device === "mobile"}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
                device === "mobile"
                  ? "bg-accent-teal/10 text-accent-teal"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Smartphone className="size-3.5" aria-hidden />
              Mobile
            </button>
          </div>
          <span className="text-xs text-muted-foreground">Sample data</span>
        </div>
      </div>
      {emptyState ? (
        emptyState
      ) : (
        <div
          className={cn(
            "transition-[max-width] duration-200",
            device === "mobile" ? "mx-auto max-w-[390px]" : "max-w-none",
          )}
        >
          <BlockPreview
            blocks={blocks}
            branding={branding}
            products={products}
            className={className ?? "h-[720px]"}
          />
        </div>
      )}
    </div>
  );
}
