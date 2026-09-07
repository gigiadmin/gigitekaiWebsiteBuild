# Knowledge Base Remediation Release

**Date:** September 7, 2026  
**Scope:** Broken-reference remediation, duplicate-record resolution, canonical redirects, and historical audit trends.

## Executive Summary

The Knowledge Base remediation is complete. The release corrected every actionable reference found by the September audit, removed six false-positive endpoint classes from link monitoring by excluding inline and fenced code, reconciled all 63 duplicate-candidate pairs as 61 connected components, and archived 62 redundant records behind durable canonical redirects. No article was deleted. Two canonical articles received explicit unique-content merges before their subordinate records were archived.

The September audit was then refreshed in place, preserving the one-record-per-period contract. It now reports **0 broken references**, **0 duplicate groups**, **560 published articles**, and **100 Copilot articles**. The protected dashboard uses this persisted September run as its honest baseline; future monthly runs will extend the trend charts automatically.

## Reference Findings

| Finding class | Reported URLs | Article placements | Final disposition |
|---|---:|---:|---|
| Actionable content corrections | 3 | 6 | Corrected with verified production or current Microsoft destinations |
| Valid operational endpoints or tenant placeholders inside code | 6 | 9 | Retained unchanged and excluded from automated link checks |
| Total reviewed | 9 | 15 | Fully classified and remediated |

The corrected records include the BitLocker recovery guide, three contextual `gigitest.com` references, and both copies of the retired Intune app-protection exception link. The current Microsoft destinations returned HTTP 200 during validation. The Edge, Bot Framework, Exchange Autodiscover, Intune enrollment, and SharePoint placeholder values remain intact because they are configuration examples rather than public reference links.

## Duplicate Resolution

| Measure | Result |
|---|---:|
| Candidate pairs reviewed | 63 |
| Connected duplicate components | 61 |
| Redundant article records archived | 62 |
| Durable archived-ID redirects | 62 |
| Canonical records retained | 61 |
| Content-preserving merge components | 2 |
| Hard-deleted records | 0 |

The Azure VM disk-full cluster was resolved at component level with article `1740001` as canonical. Its maintained guide now includes both OS-disk reclaim/resize procedures and the unique data-disk provisioning, initialization, and formatting guidance. The MFA pair was consolidated into article `210068`, which now retains the unique escalation conditions from article `330003` and current GigitekAI support contact details.

Each redirect stores the archived article ID, canonical article ID, disposition, decision evidence, candidate numbers, and a source snapshot. An external pre-remediation backup also preserves all 131 affected article records.

## Final Persisted Audit Baseline

| Metric | September 2026 result |
|---|---:|
| Total records | 622 |
| Published articles | 560 |
| Copilot articles | 100 |
| References checked | 258 |
| Broken references | 0 |
| Blocked or unreachable checks | 87 |
| Stale articles | 0 |
| Duplicate groups | 0 |

Blocked or unreachable checks are reported separately from confirmed broken links because many authoritative sites restrict automated requests. They are not treated as content failures without corroborating evidence.

## Validation Evidence

| Control | Outcome |
|---|---|
| Code-aware URL extraction | Inline code, fenced code, and tenant placeholders excluded; genuine source, Markdown, and prose links retained |
| Redirect integrity | 62 archived records resolve to published canonical records; zero orphan redirects |
| Canonical integrity | Zero redirect targets are unpublished |
| Public routes | `/kb`, `/kb/copilot`, canonical article IDs, and archived article IDs returned HTTP 200 |
| Archived-ID behavior | Archived article `1770056` resolved to canonical article `1740056` |
| Custom-domain cache safety | Public article-detail requests use a versioned query key so pre-remediation edge-cache entries cannot expose archived responses after rollout |
| Admin authorization | Unauthenticated audit-history RPC returned HTTP 401 and the page redirected to Microsoft admin sign-in |
| Authenticated audit data | In-memory signed active-admin validation returned HTTP 200 with the single persisted September run and aggregate metrics only; no session token was logged |
| Automated tests | 32 tests passed across 7 focused files |
| TypeScript | `pnpm tsc --noEmit` passed |
| Production build | `pnpm build` passed |
| Audit alert | Final recheck summary delivered to `support@gigitekai.com` through Microsoft Graph |

## Trend Dashboard Behavior

The protected `/admin/kb-audit` dashboard now renders two responsive historical charts from persisted `kbAuditRuns` values: publication coverage and quality findings. With only one completed period, the dashboard shows September as a single baseline point and clearly states that no history was estimated or backfilled.
