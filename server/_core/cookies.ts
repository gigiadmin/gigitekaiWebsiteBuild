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
  let sameSite: "lax" | "strict" | "none" = "lax";
  const host = req.get("x-forwarded-host") || req.get("host") || "localhost";
  const hostWithoutPort = host.split(":")[0];
  
  // Check if this is a Manus preview domain (*.manus.space or *.manus.computer)
  const isManusDomain = hostWithoutPort.includes(".manus.space") || hostWithoutPort.includes(".manus.computer");
  
  // For Manus preview domains, don't set a domain cookie (use default/current domain only)
  // This ensures the cookie is accessible within the same preview domain
  if (isManusDomain) {
    // Don't set domain - cookie will be scoped to exact domain
    domain = undefined;
  } else if (!LOCAL_HOSTS.has(hostWithoutPort) && !isIpAddress(hostWithoutPort)) {
    // For production domains, set root domain (e.g., .gigitekai.com from www.gigitekai.com)
    const parts = hostWithoutPort.split(".");
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
    sameSite,
    secure: isSecure,
  };
}
