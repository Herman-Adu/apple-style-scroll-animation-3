/** Top-level domains reserved for testing (RFC 2606, RFC 6761). Mail sent there can only bounce. */
const RESERVED_TLDS = ["test", "example", "invalid", "localhost"] as const

export function isReservedEmail(address: string): boolean {
  const domain = address.trim().toLowerCase().split("@").at(-1) ?? ""
  const tld = domain.split(".").at(-1) ?? ""
  return (RESERVED_TLDS as readonly string[]).includes(tld)
}

/** Keeps demo and test addresses out of every real send, so seeded data can never cause a bounce. */
export function deliverableRecipients(to: string | string[]): string[] {
  return (Array.isArray(to) ? to : [to]).filter((address) => !isReservedEmail(address))
}
