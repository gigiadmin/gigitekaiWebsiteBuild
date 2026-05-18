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

  // Extract domain from request host for cookie domain setting
  // This ensures cookies are sent across all requests to the same domain
  let domain: string | undefined = undefined;
  const host = req.headers.host || "";
  
  if (host && !LOCAL_HOSTS.has(host.split(":")[0]) && !isIpAddress(host)) {
    // For production domains (e.g., gigitekai.com), set domain to root domain
    // This allows cookies to be sent to all subdomains
    const parts = host.split(":")[0].split(".");
    if (parts.length >= 2) {
      domain = "." + parts.slice(-2).join("."); // e.g., ".gigitekai.com"
    }
  }
  // For localhost/IP addresses, don't set domain (browser will use exact host)

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
