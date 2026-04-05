# Security Audit Report — April 5, 2026

## Dependency Vulnerability Scan

**Tool:** `pnpm audit`
**Date:** April 5, 2026
**Total Vulnerabilities Found:** 37
**Severity Breakdown:** 1 low | 21 moderate | 15 high

### Key Findings

| Package | Severity | Issue | Status |
|---------|----------|-------|--------|
| pnpm | High | Lifecycle scripts bypass (v10.0.0-10.26.0) | Transitive - platform-managed |
| dompurify | Moderate | XSS bypass (<=3.3.1) | Transitive via streamdown > mermaid |
| qs | Low | arrayLimit bypass DoS (6.7.0-6.14.1) | Transitive via express > body-parser |

### Assessment

Most vulnerabilities are in **transitive dependencies** (dependencies of dependencies) and are not directly exploitable in our application context:

- **pnpm vulnerabilities (15 high):** These affect the package manager itself, not the deployed application. Platform-managed.
- **dompurify:** Used by mermaid (via streamdown) for rendering markdown diagrams. Low risk since we control input to the LLM chat.
- **qs:** Used by Express body-parser. Mitigated by our rate limiting middleware.

### Mitigations Applied

1. **Rate limiting** - Prevents DoS attacks that could exploit qs vulnerability
2. **CSP headers** - Prevents XSS even if dompurify is bypassed
3. **Input validation** - All user inputs validated via Zod schemas
4. **File upload validation** - MIME type, extension, magic bytes, and size checks

### Recommendations

- Monitor for updates to `streamdown` and `express` for patched transitive deps
- Run `pnpm audit` monthly as part of maintenance cycle
- Consider upgrading Express to v5 when stable (resolves qs dependency)

---

## Security Hardening Implemented

| Feature | Status |
|---------|--------|
| Rate limiting (API, chat, forms, auth, uploads) | Implemented |
| Content Security Policy (CSP) | Implemented |
| X-Frame-Options (SAMEORIGIN) | Implemented |
| X-Content-Type-Options (nosniff) | Implemented |
| X-XSS-Protection | Implemented |
| Referrer-Policy | Implemented |
| Permissions-Policy | Implemented |
| HSTS (production only) | Implemented |
| Honeypot bot protection | Implemented |
| File upload MIME validation | Implemented |
| Magic bytes verification | Implemented |
| Filename sanitization | Implemented |
| Admin security notifications | Implemented |
