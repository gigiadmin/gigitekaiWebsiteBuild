import type { CookieOptions, Request } from "express";

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

/**
 * Session cookie options.
 * 
 * IMPORTANT: We intentionally do NOT set a `domain` property.
 * When domain is omitted, the browser scopes the cookie to the exact host
 * that set it (e.g., gigitekai.com). This is the safest and most compatible
 * approach across all browsers, including Safari ITP, iOS PWA, and InPrivate mode.
 * 
 * Setting domain to ".gigitekai.com" would make the cookie available to all
 * subdomains, but can cause issues with proxy configurations, Cloud Run routing,
 * and browser security policies.
 */
export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const isSecure = isSecureRequest(req);

  return {
    // domain is intentionally omitted - cookie scoped to exact host
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: isSecure,
  };
}
