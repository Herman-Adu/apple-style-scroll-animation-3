// Server-only public surface of the contact slice. Import from here in server code;
// client-safe exports live in ./index.
export * from "./lib/rate-limit"
export * from "./lib/submit"
