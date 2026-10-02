// Server-only public surface of the email slice. Import from here in server code;
// client-safe exports live in ./index.
export * from "./campaign-send"
export * from "./provider"
export * from "./repo"
