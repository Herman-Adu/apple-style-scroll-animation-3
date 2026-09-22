import type { Doc } from "../schema"

export const managingTheProductCatalog: Doc = {
  slug: "managing-the-product-catalog",
  title: "Managing the Product Catalog",
  category: "Catalog",
  audience: "content",
  access: "admin",
  summary:
    "Add, edit, and retire products from the admin dashboard, and understand how stock controls what customers can buy.",
  readingMinutes: 7,
  order: 1,
  updatedAt: "2026-09-20",
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
        "Open the Admin dashboard and go to the Products section.",
        "Choose 'New product' and fill in the name, price, category, and description.",
        "Add the colour options customers can choose, and set the starting stock for each.",
        "Save. The product appears in the storefront as soon as it has stock and is published.",
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
        ["Out of stock", "Add to cart is disabled; the product shows as sold out but stays visible."],
      ],
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
