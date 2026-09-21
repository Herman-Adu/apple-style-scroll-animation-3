// Public surface of the products feature (client-safe). The server-only data
// access lives at `@/features/products/api` and is imported separately so it
// never leaks into client bundles.
export * from "./schema"
export * from "./lib/product"
export * from "./components/product-card"
export * from "./components/product-card-skeleton"
export * from "./components/product-showcase"
export * from "./components/product-features"
export * from "./components/product-specs"
export * from "./components/product-purchase"
export * from "./components/product-reviews"
export * from "./components/add-to-cart-button"
export * from "./components/review-form"
