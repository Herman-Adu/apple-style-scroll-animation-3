import type { Doc } from "../lib/domain/schema"

export const managingTheProductCatalog: Doc = {
  slug: "managing-the-product-catalog",
  title: "Managing the Product Catalog",
  category: "Catalog",
  audience: "content",
  access: "public",
  summary:
    "Add, edit, and retire products from the admin dashboard, and understand how stock controls what customers can buy.",
  readingMinutes: 7,
  order: 1,
  updatedAt: "2026-10-06",
  tags: ["admin", "products", "stock", "inventory", "catalog"],
  body: [
    {
      type: "paragraph",
      text: "The catalog is managed entirely from the admin dashboard — no code required. This guide covers the day-to-day tasks: creating a product, editing its details, and using stock to control whether customers can buy it.",
    },
    {
      type: "callout",
      variant: "note",
      text: "This is admin-only. Sign in with an admin account and open the Admin dashboard from the account menu to follow along.",
    },
    {
      type: "heading",
      text: "Adding a product",
    },
    {
      type: "steps",
      items: [
        { title: "Open Products", text: "Open the Admin dashboard and go to the Products section." },
        {
          title: "Create the product",
          text: "Choose 'New product' and fill in the name, price, category, and description.",
        },
        {
          title: "Add options and stock",
          text: "Add the colour options customers can choose, and set the starting stock for each.",
        },
        {
          title: "Save",
          text: "Save. The product appears in the storefront as soon as it has stock and is published.",
        },
      ],
    },
    {
      type: "heading",
      text: "Editing an existing product",
    },
    {
      type: "paragraph",
      text: "Select any product from the list to edit its details. Changes to price, copy, and imagery take effect immediately. Editing is non-destructive — you're updating the same record customers see, so double-check price and stock before saving.",
    },
    {
      type: "heading",
      text: "How stock controls purchasability",
    },
    {
      type: "table",
      headers: ["Stock level", "What customers see"],
      rows: [
        ["In stock", "Add to cart is available and checkout proceeds normally."],
        ["Low stock", "Add to cart still works, with a low-stock note to create urgency."],
        ["Out of stock", "Add to cart is disabled; the product shows as sold out but stays visible, with a \"Notify me\" form. When stock goes from zero back above zero (an admin edit, an expired checkout releasing its hold, or a full refund), everyone waiting gets one back-in-stock email with a one-click unsubscribe link."],
      ],
    },
    {
      type: "callout",
      variant: "note",
      text: "Back-in-stock requests are stored (one per email and product, so repeats never double up) and rate limited per visitor. Pre-orders never show the form, because there is no stock to wait for.",
    },
    {
      type: "callout",
      variant: "tip",
      text: "See demand before you restock: the Products table has a sortable Waiting column (click its header to sort most-wanted first), and the Overview shows a Most wanted card with the top three products and the total number of shoppers waiting. Counts only include people who asked while the product was sold out, and they drop to zero once the restock email has gone out. The full flow is in /docs/back-in-stock-alerts.",
    },
    {
      type: "callout",
      variant: "tip",
      text: "Stock is the single switch for purchasability. To temporarily stop sales of an item without deleting it, set its stock to zero.",
    },
    {
      type: "heading",
      text: "Retiring a product",
    },
    {
      type: "paragraph",
      text: "To pull a product from sale, unpublish it or set it out of stock rather than deleting it — that preserves the history on past orders. Reserve deletion for items that were created in error and never sold.",
    },
    {
      type: "callout",
      variant: "note",
      text: "Today the catalog is backed by the app's local content layer. When the store moves to Strapi, these same fields map 1:1 to the product content type, so this workflow stays the same — you'll just be editing in Strapi's admin instead.",
    },
  ],
}
