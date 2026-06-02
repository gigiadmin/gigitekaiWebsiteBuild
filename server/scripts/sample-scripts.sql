-- Sample Scripts for Scripts Portal
-- Insert these scripts to populate the /scripts portal

INSERT INTO scripts (name, description, category, version, author, created_at, updated_at, download_count, rating, difficulty_level, tags, documentation, github_url) VALUES

('Teams Phone Audit', 
'Comprehensive audit of Teams Phone System configuration including call queues, auto-attendants, resource accounts, and call policies.',
'Teams',
'2.1.0',
'GigitekAI Engineering',
NOW(),
NOW(),
0,
0,
'Advanced',
'["teams", "phone", "audit", "configuration"]',
'# Teams Phone Audit Script

## Overview
This script performs a comprehensive audit of your Teams Phone System configuration.

## Features
- Audit all call queues and their settings
- Verify auto-attendant configuration
- Check resource account assignments
- Validate call policies and routing rules
- Generate detailed audit report

## Usage
```powershell
.\Invoke-TeamsPhoneAudit.ps1 -TenantId "your-tenant-id" -OutputPath "C:\Reports"
```

## Requirements
- Teams PowerShell Module v4.0+
- Global Administrator role
- Teams Phone System license

## Output
- Detailed audit report (HTML)
- Configuration export (JSON)
- Issues and recommendations

## Support
For issues or questions, contact support@gigitekai.com',
'https://github.com/gigitekai/scripts/blob/main/Teams/Invoke-TeamsPhoneAudit.ps1'),

('Microsoft 365 License Audit',
'Audit all Microsoft 365 licenses across your tenant, identify unused licenses, and generate cost optimization recommendations.',
'M365',
'1.8.5',
'GigitekAI Engineering',
NOW(),
NOW(),
0,
0,
'Intermediate',
'["m365", "licenses", "audit", "cost-optimization"]',
'# Microsoft 365 License Audit Script

## Overview
Comprehensive license audit for Microsoft 365 services.

## Features
- Inventory all assigned licenses
- Identify unused licenses
- Detect license conflicts
- Generate cost analysis
- Recommend optimization strategies

## Usage
```powershell
.\Invoke-M365LicenseAudit.ps1 -OutputPath "C:\Reports"
```

## Output
- License inventory report
- Cost analysis
- Optimization recommendations
- Unused license list

## Support
Contact support@gigitekai.com',
'https://github.com/gigitekai/scripts/blob/main/M365/Invoke-M365LicenseAudit.ps1'),

('Azure AD User Management',
'Bulk user management for Azure AD including creation, modification, and deletion with audit logging.',
'Azure',
'3.2.1',
'GigitekAI Engineering',
NOW(),
NOW(),
0,
0,
'Advanced',
'["azure", "ad", "users", "bulk-operations"]',
'# Azure AD User Management Script

## Overview
Bulk user management operations for Azure AD.

## Features
- Bulk user creation from CSV
- Bulk user modification
- Bulk user deletion with confirmation
- Automatic group assignment
- Audit logging

## Usage
```powershell
.\Invoke-AzureADUserManagement.ps1 -Operation Create -InputFile "users.csv"
```

## Input Format
CSV with columns: UserPrincipalName, DisplayName, Department, Manager

## Support
Contact support@gigitekai.com',
'https://github.com/gigitekai/scripts/blob/main/Azure/Invoke-AzureADUserManagement.ps1'),

('Exchange Online Mailbox Audit',
'Audit Exchange Online mailboxes for compliance, security, and configuration issues.',
'M365',
'2.0.3',
'GigitekAI Engineering',
NOW(),
NOW(),
0,
0,
'Intermediate',
'["exchange", "mailbox", "audit", "compliance"]',
'# Exchange Online Mailbox Audit Script

## Overview
Comprehensive mailbox audit for Exchange Online.

## Features
- Check mailbox forwarding rules
- Verify retention policies
- Audit shared mailboxes
- Check delegate access
- Identify inactive mailboxes

## Usage
```powershell
.\Invoke-ExchangeMailboxAudit.ps1 -OutputPath "C:\Reports"
```

## Output
- Mailbox configuration report
- Security findings
- Compliance issues
- Recommendations

## Support
Contact support@gigitekai.com',
'https://github.com/gigitekai/scripts/blob/main/Exchange/Invoke-ExchangeMailboxAudit.ps1'),

('SharePoint Site Governance',
'Enforce SharePoint governance policies including site naming, retention, and access control.',
'M365',
'1.5.2',
'GigitekAI Engineering',
NOW(),
NOW(),
0,
0,
'Intermediate',
'["sharepoint", "governance", "policies"]',
'# SharePoint Site Governance Script

## Overview
Enforce governance policies across SharePoint sites.

## Features
- Validate site naming conventions
- Check retention policies
- Audit access permissions
- Identify orphaned sites
- Generate governance report

## Usage
```powershell
.\Invoke-SharePointGovernance.ps1 -EnforcePolicies
```

## Output
- Governance compliance report
- Non-compliant sites list
- Remediation actions

## Support
Contact support@gigitekai.com',
'https://github.com/gigitekai/scripts/blob/main/SharePoint/Invoke-SharePointGovernance.ps1'),

('Security Posture Assessment',
'Comprehensive security assessment including MFA, conditional access, and threat protection.',
'Security',
'2.3.0',
'GigitekAI Engineering',
NOW(),
NOW(),
0,
0,
'Advanced',
'["security", "assessment", "mfa", "threat-protection"]',
'# Security Posture Assessment Script

## Overview
Comprehensive security assessment for Microsoft 365.

## Features
- Check MFA enforcement
- Audit conditional access policies
- Verify threat protection settings
- Check password policies
- Generate security score

## Usage
```powershell
.\Invoke-SecurityPostureAssessment.ps1
```

## Output
- Security assessment report
- Risk findings
- Remediation recommendations
- Security score

## Support
Contact support@gigitekai.com',
'https://github.com/gigitekai/scripts/blob/main/Security/Invoke-SecurityPostureAssessment.ps1');
