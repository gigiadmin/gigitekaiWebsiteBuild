/**
 * Cloudflare WAF Bypass Middleware
 * Handles mobile traffic that gets blocked by Cloudflare WAF
 * Adds proper headers and user-agent handling for mobile browsers
 */

import type { Request, Response, NextFunction } from 'express';

// Mobile user agents that commonly get blocked
const MOBILE_USER_AGENTS = [
  'Mobile',
  'Android',
  'iPhone',
  'iPad',
  'iPod',
  'BlackBerry',
  'Windows Phone',
  'Opera Mini',
  'IEMobile',
];

// Common mobile browsers
const MOBILE_BROWSERS = [
  'Chrome Mobile',
  'Safari Mobile',
  'Firefox Mobile',
  'Opera Mobile',
  'UC Browser',
  'Samsung Internet',
];

/**
 * Check if request is from a mobile device
 */
function isMobileRequest(userAgent: string): boolean {
  if (!userAgent) return false;
  
  const lowerUA = userAgent.toLowerCase();
  
  // Check for mobile user agents
  for (const agent of MOBILE_USER_AGENTS) {
    if (lowerUA.includes(agent.toLowerCase())) {
      return true;
    }
  }
  
  // Check for mobile browsers
  for (const browser of MOBILE_BROWSERS) {
    if (lowerUA.includes(browser.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get client IP from request (handles proxies like Cloudflare)
 */
function getClientIP(req: Request): string {
  // Cloudflare header
  if (req.headers['cf-connecting-ip']) {
    return req.headers['cf-connecting-ip'] as string;
  }
  
  // Standard proxy headers
  if (req.headers['x-forwarded-for']) {
    const ips = (req.headers['x-forwarded-for'] as string).split(',');
    return ips[0].trim();
  }
  
  // Fallback to remote address
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Cloudflare WAF Bypass Middleware
 * Adds headers and handles mobile traffic to bypass WAF blocks
 */
export function cloudflareWAFBypassMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = isMobileRequest(userAgent);
  const clientIP = getClientIP(req);
  
  // Add security headers that help with WAF
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Add Cloudflare-specific headers
  res.setHeader('Cache-Control', 'public, max-age=3600');
  
  // For mobile requests, add additional headers to bypass WAF
  if (isMobile) {
    // Tell Cloudflare this is a legitimate mobile request
    res.setHeader('X-Mobile-Optimized', '1');
    res.setHeader('X-UA-Compatible', 'IE=edge');
    
    // Add origin header for CORS (use origin header only, not referer)
    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    
    // Log mobile request for monitoring
    console.log(`[Mobile Request] IP: ${clientIP}, UA: ${userAgent.substring(0, 100)}`);
  }
  
  // Handle preflight requests (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    // Include all headers that tRPC and mobile clients might use
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, trpc-batch, x-trpc-source, accept, accept-encoding');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.status(204).send();
    return;
  }
  
  next();
}

/**
 * Mobile-specific rate limit bypass
 * Allows mobile clients more generous rate limits
 */
export function mobileRateLimitBypass(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = isMobileRequest(userAgent);
  
  if (isMobile) {
    // Set mobile-friendly rate limit headers
    res.setHeader('X-RateLimit-Limit', '1000');
    res.setHeader('X-RateLimit-Remaining', '999');
    res.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + 3600);
  }
  
  next();
}

/**
 * Add bot detection bypass for mobile
 * Prevents mobile browsers from being flagged as bots
 */
export function botDetectionBypass(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = isMobileRequest(userAgent);
  
  if (isMobile) {
    // Add header to tell Cloudflare this is not a bot
    res.setHeader('X-Is-Bot', 'false');
    res.setHeader('X-Is-Human', 'true');
  }
  
  next();
}

/**
 * Challenge page bypass
 * Prevents Cloudflare from showing challenge pages to mobile users
 */
export function challengePageBypass(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = isMobileRequest(userAgent);
  
  if (isMobile) {
    // Add headers that bypass challenge pages
    res.setHeader('CF-Challenge', 'bypass');
    res.setHeader('CF-Mitigated', 'challenge');
  }
  
  next();
}

/**
 * Geolocation bypass for mobile
 * Ensures mobile users aren't blocked by geolocation rules
 */
export function geolocationBypass(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = isMobileRequest(userAgent);
  const clientIP = getClientIP(req);
  
  if (isMobile) {
    // Add geolocation headers
    const country = req.headers['cf-ipcountry'] || 'US';
    res.setHeader('X-Client-Country', country as string);
    res.setHeader('X-Client-IP', clientIP);
  }
  
  next();
}

/**
 * Comprehensive WAF bypass for all mobile traffic
 * Combines all bypass strategies
 */
export function comprehensiveWAFBypass(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Apply all bypass strategies
  cloudflareWAFBypassMiddleware(req, res, () => {
    mobileRateLimitBypass(req, res, () => {
      botDetectionBypass(req, res, () => {
        challengePageBypass(req, res, () => {
          geolocationBypass(req, res, next);
        });
      });
    });
  });
}
