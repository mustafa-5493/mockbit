/**
 * SSRF Protection Helper
 * Validates outgoing URLs to prevent Server-Side Request Forgery against
 * loopback, internal private subnets, and cloud instance metadata endpoints.
 */

export function isSafeExternalUrl(rawUrl: string): { safe: boolean; reason?: string } {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { safe: false, reason: "Empty or invalid URL" };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { safe: false, reason: "Malformed URL structure" };
  }

  // Enforce HTTP / HTTPS protocol only
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { safe: false, reason: `Unsupported protocol '${parsed.protocol}'. Only http and https are allowed.` };
  }

  const hostname = parsed.hostname.toLowerCase().trim();

  // Loopback / localhost check
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "0.0.0.0" ||
    hostname === "0"
  ) {
    return { safe: false, reason: "Access to localhost or loopback addresses is restricted." };
  }

  // Cloud Instance Metadata Endpoints (AWS / GCP / Azure / OpenStack)
  if (
    hostname === "169.254.169.254" ||
    hostname === "169.254.169.253" ||
    hostname.startsWith("169.254.") ||
    hostname === "metadata.google.internal"
  ) {
    return { safe: false, reason: "Access to cloud instance metadata services is restricted." };
  }

  // Private IPv4 Subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = hostname.match(ipv4Regex);

  if (match) {
    const [, oct1, oct2] = match.map(Number);

    // 10.0.0.0/8
    if (oct1 === 10) {
      return { safe: false, reason: "Access to private IP range (10.0.0.0/8) is restricted." };
    }

    // 172.16.0.0 - 172.31.255.255
    if (oct1 === 172 && oct2 >= 16 && oct2 <= 31) {
      return { safe: false, reason: "Access to private IP range (172.16.0.0/12) is restricted." };
    }

    // 192.168.0.0/16
    if (oct1 === 192 && oct2 === 168) {
      return { safe: false, reason: "Access to private IP range (192.168.0.0/16) is restricted." };
    }
  }

  return { safe: true };
}
