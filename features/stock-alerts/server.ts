// Server-only public surface of the stock-alerts slice. Import from here in server
// code that announces a restock; client-safe exports live in ./index.
export * from "./lib/data/dispatch"
