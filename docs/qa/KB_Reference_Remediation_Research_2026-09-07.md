# Knowledge Base Reference Remediation Research — September 7, 2026

The September audit reported nine URLs as broken. Article-context review separated three genuine published-link problems from six technical values inside inline code or PowerShell examples. The six code values must remain technically accurate; the audit parser should exclude code spans and fenced code blocks instead of treating those configuration values as clickable references.

| Reported URL | Classification | Remediation | Authoritative evidence |
|---|---|---|---|
| `https://account.microsoft.com/devices/recoverykey` | Retired/deep account link | Replace the clickable link with Microsoft Support’s current BitLocker recovery guidance. | https://support.microsoft.com/en-us/windows/security/encryption/find-your-bitlocker-recovery-key |
| `https://edgeservices.bing.com/edgesvc/shell` | Configuration endpoint inside inline code | Retain the endpoint; exclude inline code from reference health checks. | https://learn.microsoft.com/en-us/troubleshoot/microsoft-edge/experience/copilot-chat-loading-issues |
| `https://europe.token.botframework.com/.auth/web/redirect` | OAuth redirect value inside inline code | Retain the value; exclude inline code from reference health checks. | https://learn.microsoft.com/en-us/microsoft-copilot-studio/configuration-authentication-azure-ad |
| `https://gigitest.com` and related paths | Retired test-domain content | Replace each contextual occurrence with the correct GigitekAI production route, approved email, or official Microsoft password-reset page. | https://gigitekai.com |
| `https://learn.microsoft.com/intune/apps/app-protection-policies-exception` | Retired Microsoft Learn article | Replace with the current Intune data-transfer exception guidance. | https://learn.microsoft.com/en-us/intune/app-management/protection/create-data-transfer-exceptions |
| `https://outlook.office365.com/autodiscover/autodiscover.xml` | Exchange service endpoint inside inline code | Retain the endpoint; exclude inline code from reference health checks. | https://learn.microsoft.com/en-us/exchange/client-developer/exchange-web-services/autodiscover-for-exchange |
| `https://portal.manage.microsoft.com/TermsofUse.aspx` | Intune configuration value inside inline code | Retain the value; exclude inline code from reference health checks. | https://learn.microsoft.com/en-us/troubleshoot/mem/intune/device-enrollment/troubleshoot-windows-enrollment-errors |
| `https://token.botframework.com/.auth/web/redirect` | OAuth redirect value inside inline code | Retain the value; exclude inline code from reference health checks. | https://learn.microsoft.com/en-us/azure/bot-service/ref-oauth-redirect-urls?view=azure-bot-service-4.0 |
| `https://yourtenant.sharepoint.com/sites/legal` | Explicit tenant placeholder inside a PowerShell example | Retain the placeholder example; exclude fenced code from reference health checks rather than publishing an unverified tenant-specific site. | Contextual configuration placeholder; no public destination should be substituted. |

This classification avoids changing operational endpoint values merely to satisfy an HTTP `HEAD` check. Genuine user-facing links and retired test-domain content will be corrected in the affected articles, and the audit will retain an evidence trail of every change.
