import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const isSecure = isSecureRequest(req);
  
  // Extract domain from host header
  let domain: string | undefined = undefined;
  const host = req.get("x-forwarded-host") || req.get("host") || "localhost";
  
  // Only set domain for non-localhost to avoid cookie issues
  if (!LOCAL_HOSTS.has(host) && !isIpAddress(host)) {
    // Set domain to root domain (e.g., .gigitekai.com from www.gigitekai.com)
    const parts = host.split(":")[0].split(".");
    if (parts.length > 1) {
      domain = "." + parts.slice(-2).join(".");
    }
  }

  // Safari (including iOS PWA) blocks SameSite=none cookies unless Secure is also set.
  // For same-origin OAuth flows (gigitekai.com → gigitekai.com), SameSite=lax is correct
  // and works on all browsers including Safari ITP and iOS PWA standalone mode.
  // SameSite=none is only needed for cross-origin embeds (iframes, third-party contexts).
  return {
    domain,
    httpOnly: true,
    path: "/",
    sameSite: isSecure ? "lax" : "lax",
    secure: isSecure,
  };
}
