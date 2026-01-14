/**
 * Extract hostname from URL input.
 * Preserves subdomains (e.g., "dot.asahi.com" stays "dot.asahi.com").
 * Only removes protocol, path, query, fragment, and port.
 */
export function extractRootDomain(input: string): string {
  if (!input) return ""

  let domain = input.trim().toLowerCase()

  // Remove protocol
  domain = domain.replace(/^https?:\/\//i, "")

  // Remove path, query, fragment
  const slashIndex = domain.indexOf("/")
  if (slashIndex !== -1) {
    domain = domain.substring(0, slashIndex)
  }

  // Remove port if present (e.g., localhost:3000 or example.com:8080)
  // Note: IPv6 uses colons, but usually inside brackets for URLs.
  // Simple regex for :port at the end of the domain part
  domain = domain.replace(/:\d+$/, "")

  return domain
}
