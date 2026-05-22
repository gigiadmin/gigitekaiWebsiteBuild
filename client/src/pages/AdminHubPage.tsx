/**
 * AdminHubPage — GigitekAI Microsoft Portal Directory
 * 157 portals across 14 categories with search, favorites, and left-sidebar category nav
 * Design: Dark cyberpunk (navy/cyan) matching GigitekAI brand
 */
import { useState, useMemo, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { ExternalLink, Star, Search, Grid3X3, X } from "lucide-react";

// ─── Portal Data ──────────────────────────────────────────────────────────────
interface Portal {
  name: string;
  description: string;
  domain: string;
  url: string;
  category: string;
}

const PORTALS: Portal[] = [
  // Microsoft 365
  { name: "Microsoft 365 Admin Center", description: "Central M365 management", domain: "admin.cloud.microsoft", url: "https://admin.cloud.microsoft", category: "Microsoft 365" },
  { name: "Microsoft 365 Apps Admin Center", description: "Office apps configuration", domain: "config.office.com", url: "https://config.office.com", category: "Microsoft 365" },
  { name: "Exchange Admin Center", description: "Email & mailbox management", domain: "admin.cloud.microsoft", url: "https://admin.cloud.microsoft/exchange", category: "Microsoft 365" },
  { name: "SharePoint Admin Center", description: "SharePoint site management", domain: "admin.microsoft.com", url: "https://admin.microsoft.com/sharepoint", category: "Microsoft 365" },
  { name: "Microsoft Teams Admin Center", description: "Teams policies & settings", domain: "admin.teams.microsoft.com", url: "https://admin.teams.microsoft.com", category: "Microsoft 365" },
  { name: "Teams Rooms Pro Management", description: "Teams Rooms device management", domain: "portal.rooms.microsoft.com", url: "https://portal.rooms.microsoft.com", category: "Microsoft 365" },
  { name: "Microsoft Stream Admin", description: "Video streaming admin", domain: "web.microsoftstream.com", url: "https://web.microsoftstream.com", category: "Microsoft 365" },
  { name: "OneDrive Admin", description: "OneDrive storage management", domain: "admin.onedrive.com", url: "https://admin.onedrive.com", category: "Microsoft 365" },
  { name: "Viva Engage Admin", description: "Viva Engage (Yammer) admin", domain: "engage.cloud.microsoft", url: "https://engage.cloud.microsoft", category: "Microsoft 365" },
  { name: "Microsoft Purview", description: "Compliance & governance", domain: "purview.microsoft.com", url: "https://purview.microsoft.com", category: "Microsoft 365" },
  { name: "My Staff", description: "Delegated user management", domain: "mystaff.microsoft.com", url: "https://mystaff.microsoft.com", category: "Microsoft 365" },
  { name: "Teams Places Space Management", description: "Workplace space management", domain: "places.cloud.microsoft", url: "https://places.cloud.microsoft", category: "Microsoft 365" },
  { name: "My Applications", description: "App launcher portal", domain: "myapps.microsoft.com", url: "https://myapps.microsoft.com", category: "Microsoft 365" },
  { name: "My Access", description: "Access packages & requests", domain: "myaccess.microsoft.com", url: "https://myaccess.microsoft.com", category: "Microsoft 365" },
  { name: "Microsoft 365 Lighthouse", description: "Multi-tenant management for MSPs", domain: "lighthouse.microsoft.com", url: "https://lighthouse.microsoft.com", category: "Microsoft 365" },
  // Azure
  { name: "Azure Portal", description: "Main Azure management portal", domain: "portal.azure.com", url: "https://portal.azure.com", category: "Azure" },
  { name: "Azure Preview Portal", description: "Preview features portal", domain: "preview.portal.azure.com", url: "https://preview.portal.azure.com", category: "Azure" },
  { name: "Azure Release Candidate", description: "RC portal for testing", domain: "rc.portal.azure.com", url: "https://rc.portal.azure.com", category: "Azure" },
  { name: "Azure All Services", description: "Browse all Azure services", domain: "portal.azure.com", url: "https://portal.azure.com/#allservices", category: "Azure" },
  { name: "Azure Cloud Shell", description: "Browser-based CLI", domain: "shell.azure.com", url: "https://shell.azure.com", category: "Azure" },
  { name: "Azure Cosmos DB", description: "Cosmos DB management", domain: "cosmos.azure.com", url: "https://cosmos.azure.com", category: "Azure" },
  { name: "Azure Data Factory", description: "Data integration service", domain: "adf.azure.com", url: "https://adf.azure.com", category: "Azure" },
  { name: "Azure Synapse Analytics", description: "Analytics workspace", domain: "web.azuresynapse.net", url: "https://web.azuresynapse.net", category: "Azure" },
  { name: "Azure Resource Explorer", description: "ARM resource browser", domain: "resources.azure.com", url: "https://resources.azure.com", category: "Azure" },
  { name: "Azure SRE Agent", description: "Site Reliability Engineering", domain: "sre.azure.com", url: "https://sre.azure.com", category: "Azure" },
  { name: "Azure Backup Center", description: "Centralized backup management", domain: "portal.azure.com", url: "https://portal.azure.com/#view/Microsoft_Azure_DataProtection/BackupCenterMenuBlade", category: "Azure" },
  { name: "Azure Monitor", description: "Monitoring & diagnostics", domain: "portal.azure.com", url: "https://portal.azure.com/#view/Microsoft_Azure_Monitoring/AzureMonitoringBrowseBlade", category: "Azure" },
  { name: "Azure Sentinel", description: "SIEM & SOAR", domain: "portal.azure.com", url: "https://portal.azure.com/#view/Microsoft_Azure_Security_Insights/WorkspaceSelectorBlade", category: "Azure" },
  { name: "Azure Virtual Desktop", description: "AVD management", domain: "portal.azure.com", url: "https://portal.azure.com/#view/Microsoft_Azure_WVD/WvdManagerMenuBlade", category: "Azure" },
  { name: "Azure Update Manager", description: "Update management", domain: "portal.azure.com", url: "https://portal.azure.com/#view/Microsoft_Azure_Automation/UpdateCenterMenuBlade", category: "Azure" },
  { name: "Azure Universal Print", description: "Cloud printing service", domain: "portal.azure.com", url: "https://portal.azure.com/#view/Microsoft_Azure_Print/MainMenuBlade", category: "Azure" },
  { name: "Azure Non-profit Portal", description: "Non-profit resources", domain: "nonprofit.microsoft.com", url: "https://nonprofit.microsoft.com", category: "Azure" },
  { name: "Create New Tenant", description: "Create Azure AD tenant", domain: "account.azure.com", url: "https://account.azure.com/organization", category: "Azure" },
  // Entra ID
  { name: "Microsoft Entra Admin Center", description: "Identity & access management", domain: "entra.microsoft.com", url: "https://entra.microsoft.com", category: "Entra ID" },
  { name: "Privileged Identity Management", description: "PIM role management", domain: "portal.azure.com", url: "https://portal.azure.com/#view/Microsoft_Azure_PIMCommon/CommonMenuBlade/~/quickStart", category: "Entra ID" },
  { name: "Multi-factor Authentication", description: "MFA configuration", domain: "account.activedirectory.windowsazure.com", url: "https://account.activedirectory.windowsazure.com/usermanagement/multifactorverification.aspx", category: "Entra ID" },
  { name: "Entra ID Error Code Lookup", description: "Troubleshoot sign-in errors", domain: "login.microsoftonline.com", url: "https://login.microsoftonline.com/error", category: "Entra ID" },
  { name: "Legacy Applications (B2B)", description: "Legacy app management", domain: "account.activedirectory.windowsazure.com", url: "https://account.activedirectory.windowsazure.com", category: "Entra ID" },
  // Security & Defender
  { name: "Microsoft 365 Defender", description: "Unified security portal", domain: "security.microsoft.com", url: "https://security.microsoft.com", category: "Security & Defender" },
  { name: "Defender Multi-tenant", description: "Multi-tenant security", domain: "mto.security.microsoft.com", url: "https://mto.security.microsoft.com", category: "Security & Defender" },
  { name: "Microsoft Security Copilot", description: "AI-powered security", domain: "securitycopilot.microsoft.com", url: "https://securitycopilot.microsoft.com", category: "Security & Defender" },
  { name: "Defender Threat Intelligence", description: "Threat intelligence explorer", domain: "security.microsoft.com", url: "https://security.microsoft.com/threatintel", category: "Security & Defender" },
  { name: "Defender for Cloud Apps", description: "CASB & app governance", domain: "security.microsoft.com", url: "https://security.microsoft.com/cloudapps", category: "Security & Defender" },
  { name: "Defender for Endpoints", description: "Endpoint protection", domain: "securitycenter.windows.com", url: "https://securitycenter.windows.com", category: "Security & Defender" },
  { name: "Defender for Identity", description: "Identity threat detection", domain: "security.microsoft.com", url: "https://security.microsoft.com/atpidentities", category: "Security & Defender" },
  { name: "Defender for IoT", description: "IoT security", domain: "portal.azure.com", url: "https://portal.azure.com/#view/Microsoft_Azure_IoT_Defender/IoTDefenderDashboard/~/Getting_started", category: "Security & Defender" },
  { name: "Defender API Explorer", description: "Security API testing", domain: "security.microsoft.com", url: "https://security.microsoft.com/api-explorer", category: "Security & Defender" },
  { name: "Attack Simulation Training", description: "Phishing simulations", domain: "security.microsoft.com", url: "https://security.microsoft.com/attacksimulator", category: "Security & Defender" },
  { name: "Defender for Cloud", description: "Cloud security posture", domain: "portal.azure.com", url: "https://portal.azure.com/#view/Microsoft_Azure_Security/SecurityMenuBlade", category: "Security & Defender" },
  { name: "Microsoft Secure Score", description: "Security posture score", domain: "security.microsoft.com", url: "https://security.microsoft.com/securescore", category: "Security & Defender" },
  { name: "Security Intelligence", description: "Threat encyclopedia", domain: "microsoft.com", url: "https://www.microsoft.com/en-us/wdsi/threats", category: "Security & Defender" },
  { name: "Microsoft AccountGuard", description: "Account protection", domain: "accountguard.microsoft.com", url: "https://accountguard.microsoft.com", category: "Security & Defender" },
  { name: "Defender ATP Testground", description: "Test defender capabilities", domain: "demo.wd.microsoft.com", url: "https://demo.wd.microsoft.com", category: "Security & Defender" },
  { name: "Office 365 Security & Compliance", description: "Legacy compliance portal", domain: "protection.office.com", url: "https://protection.office.com", category: "Security & Defender" },
  { name: "Security Copilot Calculator", description: "Copilot usage estimator", domain: "securitycopilot.microsoft.com", url: "https://securitycopilot.microsoft.com/calculator", category: "Security & Defender" },
  // Power Platform
  { name: "Power Platform Admin Center", description: "Central Power Platform admin", domain: "admin.powerplatform.microsoft.com", url: "https://admin.powerplatform.microsoft.com", category: "Power Platform" },
  { name: "Power Apps Maker Portal", description: "Build Power Apps", domain: "make.powerapps.com", url: "https://make.powerapps.com", category: "Power Platform" },
  { name: "Power Automate Maker Portal", description: "Build automations", domain: "make.powerautomate.com", url: "https://make.powerautomate.com", category: "Power Platform" },
  { name: "Power BI Admin Portal", description: "BI admin & usage metrics", domain: "app.powerbi.com", url: "https://app.powerbi.com/admin-portal", category: "Power Platform" },
  { name: "Power Pages", description: "Build external websites", domain: "make.powerpages.microsoft.com", url: "https://make.powerpages.microsoft.com", category: "Power Platform" },
  { name: "Copilot Studio", description: "Build AI copilots", domain: "copilotstudio.microsoft.com", url: "https://copilotstudio.microsoft.com", category: "Power Platform" },
  { name: "Dynamics 365 Customer Insights", description: "Customer data platform", domain: "public-usa.mkt.dynamics.com", url: "https://public-usa.mkt.dynamics.com", category: "Power Platform" },
  { name: "Phone Number Service Center", description: "PSTN number management", domain: "pstnsd.powerappsportals.com", url: "https://pstnsd.powerappsportals.com", category: "Power Platform" },
  { name: "Power BI Playground", description: "Try Power BI features", domain: "playground.powerbi.com", url: "https://playground.powerbi.com", category: "Power Platform" },
  // Intune & Endpoint
  { name: "Microsoft Intune Admin Center", description: "Device & app management", domain: "intune.microsoft.com", url: "https://intune.microsoft.com", category: "Intune & Endpoint" },
  { name: "Windows 365", description: "Cloud PC management", domain: "windows365.microsoft.com", url: "https://windows365.microsoft.com", category: "Intune & Endpoint" },
  { name: "Windows Release Health", description: "Windows update status", domain: "learn.microsoft.com", url: "https://learn.microsoft.com/en-us/windows/release-health/", category: "Intune & Endpoint" },
  // AI & Copilot
  { name: "Microsoft AI", description: "Microsoft AI hub", domain: "microsoft.ai", url: "https://microsoft.ai", category: "AI & Copilot" },
  { name: "Microsoft Copilot", description: "AI assistant", domain: "copilot.microsoft.com", url: "https://copilot.microsoft.com", category: "AI & Copilot" },
  { name: "Azure AI Foundry", description: "AI model deployment", domain: "ai.azure.com", url: "https://ai.azure.com", category: "AI & Copilot" },
  { name: "Azure OpenAI Studio", description: "OpenAI model playground", domain: "oai.azure.com", url: "https://oai.azure.com", category: "AI & Copilot" },
  { name: "Azure Machine Learning", description: "ML workspace", domain: "ml.azure.com", url: "https://ml.azure.com", category: "AI & Copilot" },
  { name: "Azure AI Content Safety", description: "Content moderation", domain: "contentsafety.cognitive.azure.com", url: "https://contentsafety.cognitive.azure.com", category: "AI & Copilot" },
  { name: "Azure AI Document Intelligence", description: "Document processing", domain: "documentintelligence.ai.azure.com", url: "https://documentintelligence.ai.azure.com", category: "AI & Copilot" },
  { name: "Bot Framework Dev Portal", description: "Build bots", domain: "dev.botframework.com", url: "https://dev.botframework.com", category: "AI & Copilot" },
  { name: "Custom Translator", description: "Custom translation models", domain: "portal.customtranslator.azure.ai", url: "https://portal.customtranslator.azure.ai", category: "AI & Copilot" },
  { name: "Custom Vision", description: "Image classification", domain: "www.customvision.ai", url: "https://www.customvision.ai", category: "AI & Copilot" },
  { name: "Language Studio", description: "NLP tools", domain: "language.azure.com", url: "https://language.azure.com", category: "AI & Copilot" },
  { name: "Speech Studio", description: "Speech services", domain: "speech.microsoft.com", url: "https://speech.microsoft.com", category: "AI & Copilot" },
  { name: "Video Indexer", description: "Video AI analysis", domain: "www.videoindexer.ai", url: "https://www.videoindexer.ai", category: "AI & Copilot" },
  { name: "Copilot Studio Estimator", description: "Usage cost estimator", domain: "microsoft.github.io", url: "https://microsoft.github.io/CopilotStudioSamples/", category: "AI & Copilot" },
  // Developer
  { name: "Azure DevOps", description: "DevOps pipelines & repos", domain: "aex.dev.azure.com", url: "https://aex.dev.azure.com", category: "Developer" },
  { name: "Azure IoT Central", description: "IoT app platform", domain: "apps.azureiotcentral.com", url: "https://apps.azureiotcentral.com", category: "Developer" },
  { name: "Microsoft Fabric", description: "Unified analytics platform", domain: "fabric.microsoft.com", url: "https://fabric.microsoft.com", category: "Developer" },
  { name: "Azure Data Explorer", description: "Big data analytics", domain: "dataexplorer.azure.com", url: "https://dataexplorer.azure.com", category: "Developer" },
  { name: "Microsoft Graph Explorer", description: "Test Graph API calls", domain: "developer.microsoft.com", url: "https://developer.microsoft.com/en-us/graph/graph-explorer", category: "Developer" },
  { name: "JWT/MS Token Decoder", description: "Decode JWT tokens", domain: "jwt.ms", url: "https://jwt.ms", category: "Developer" },
  { name: "Adaptive Cards Designer", description: "Design adaptive cards", domain: "adaptivecards.io", url: "https://adaptivecards.io/designer", category: "Developer" },
  { name: "VS Code Web", description: "Browser-based VS Code", domain: "www.vscode.dev", url: "https://www.vscode.dev", category: "Developer" },
  { name: "VS Code Insiders Web", description: "VS Code preview features", domain: "insiders.vscode.dev", url: "https://insiders.vscode.dev", category: "Developer" },
  { name: "Microsoft AppSource", description: "Business apps marketplace", domain: "appsource.microsoft.com", url: "https://appsource.microsoft.com", category: "Developer" },
  { name: "Visual Studio Subscriptions", description: "VS subscription benefits", domain: "my.visualstudio.com", url: "https://my.visualstudio.com", category: "Developer" },
  { name: "Microsoft Clarity", description: "Heatmaps & session recordings", domain: "clarity.microsoft.com", url: "https://clarity.microsoft.com", category: "Developer" },
  { name: "Bing WebMaster Tools", description: "SEO & site management", domain: "www.bing.com", url: "https://www.bing.com/webmasters", category: "Developer" },
  { name: "Developer Portal for Teams", description: "Teams app development", domain: "dev.teams.microsoft.com", url: "https://dev.teams.microsoft.com", category: "Developer" },
  { name: "M365 Developer Program", description: "Developer sandbox", domain: "developer.microsoft.com", url: "https://developer.microsoft.com/en-us/microsoft-365/dev-program", category: "Developer" },
  { name: "Actionable Messages Dashboard", description: "Outlook actionable messages", domain: "outlook.office.com", url: "https://outlook.office.com/connectors/oam/publish", category: "Developer" },
  { name: "PowerShell Gallery", description: "PowerShell modules", domain: "www.powershellgallery.com", url: "https://www.powershellgallery.com", category: "Developer" },
  // Health & Status
  { name: "Microsoft Service Health", description: "M365, Azure, Power Platform status", domain: "status.cloud.microsoft", url: "https://status.cloud.microsoft", category: "Health & Status" },
  { name: "M365 Service Health Status", description: "Office 365 service status", domain: "portal.office.com", url: "https://portal.office.com/adminportal/home#/servicehealth", category: "Health & Status" },
  { name: "M365 Service Health (Admin)", description: "Admin portal health view", domain: "admin.microsoft.com", url: "https://admin.microsoft.com/adminportal/home#/servicehealth", category: "Health & Status" },
  { name: "Azure DevOps Status", description: "DevOps service status", domain: "status.dev.azure.com", url: "https://status.dev.azure.com", category: "Health & Status" },
  { name: "Azure Service Health", description: "Azure service issues", domain: "portal.azure.com", url: "https://portal.azure.com/#view/Microsoft_Azure_Health/AzureHealthBrowseBlade", category: "Health & Status" },
  { name: "Azure Status", description: "Azure global status", domain: "status.azure.com", url: "https://status.azure.com", category: "Health & Status" },
  { name: "M365 Network Connectivity Test", description: "Test network connectivity", domain: "connectivity.office.com", url: "https://connectivity.office.com", category: "Health & Status" },
  { name: "M365 Network Insights", description: "Network performance data", domain: "portal.office.com", url: "https://portal.office.com/adminportal/home#/networkperformance", category: "Health & Status" },
  { name: "Teams Call Quality Dashboard", description: "Teams call analytics", domain: "cqd.teams.microsoft.com", url: "https://cqd.teams.microsoft.com", category: "Health & Status" },
  { name: "Microsoft Remote Connectivity Analyzer", description: "Test Exchange/Teams connectivity", domain: "testconnectivity.microsoft.com", url: "https://testconnectivity.microsoft.com", category: "Health & Status" },
  // Partner & MSP
  { name: "Microsoft Partner Center", description: "Partner management hub", domain: "partner.microsoft.com", url: "https://partner.microsoft.com", category: "Partner & MSP" },
  { name: "Azure for Partners", description: "Partner technical resources", domain: "microsoft.github.io", url: "https://microsoft.github.io/PartnerResources/", category: "Partner & MSP" },
  { name: "Microsoft Partner Resources", description: "Partnership resources", domain: "partner.microsoft.com", url: "https://partner.microsoft.com/en-us/resources", category: "Partner & MSP" },
  { name: "FastTrack Partner Community", description: "FastTrack partner portal", domain: "fpc.microsoft.com", url: "https://fpc.microsoft.com", category: "Partner & MSP" },
  { name: "Dynamics 365 for Partners", description: "D365 partner resources", domain: "dynamicspartners.transform.microsoft.com", url: "https://dynamicspartners.transform.microsoft.com", category: "Partner & MSP" },
  { name: "Modern Work for Partners", description: "Modern workplace resources", domain: "cloudpartners.transform.microsoft.com", url: "https://cloudpartners.transform.microsoft.com", category: "Partner & MSP" },
  { name: "Power Platform for Partners", description: "Power Platform resources", domain: "powerplatformpartners.transform.microsoft.com", url: "https://powerplatformpartners.transform.microsoft.com", category: "Partner & MSP" },
  { name: "Microsoft Security Partners", description: "Security partner resources", domain: "securitypartners.transform.microsoft.com", url: "https://securitypartners.transform.microsoft.com", category: "Partner & MSP" },
  { name: "Partner Led Customer Trials", description: "Customer trial management", domain: "trials.transform.microsoft.com", url: "https://trials.transform.microsoft.com", category: "Partner & MSP" },
  { name: "Partner Cybersecurity Investment", description: "Security investment program", domain: "cloudaccelerator.microsoft.com", url: "https://cloudaccelerator.microsoft.com", category: "Partner & MSP" },
  { name: "Customer Digital Experiences", description: "Demo environments", domain: "cdx.transform.microsoft.com", url: "https://cdx.transform.microsoft.com", category: "Partner & MSP" },
  // Licensing & Support
  { name: "Azure Subscriptions", description: "Manage Azure subscriptions", domain: "account.azure.com", url: "https://account.azure.com/subscriptions", category: "Licensing & Support" },
  { name: "Azure Support Request", description: "Create support ticket", domain: "portal.azure.com", url: "https://portal.azure.com/#view/Microsoft_Azure_Support/HelpAndSupportBlade", category: "Licensing & Support" },
  { name: "Azure Enterprise Portal", description: "Enterprise agreement management", domain: "ea.azure.com", url: "https://ea.azure.com", category: "Licensing & Support" },
  { name: "Microsoft FastTrack", description: "Deployment assistance", domain: "fasttrack.microsoft.com", url: "https://fasttrack.microsoft.com", category: "Licensing & Support" },
  { name: "Microsoft Services Hub", description: "Premier support portal", domain: "serviceshub.microsoft.com", url: "https://serviceshub.microsoft.com", category: "Licensing & Support" },
  { name: "Volume Licensing eAgreements", description: "License agreements", domain: "eagreements.microsoft.com", url: "https://eagreements.microsoft.com", category: "Licensing & Support" },
  { name: "Next Gen Volume Licensing", description: "New licensing portal", domain: "businessaccount.microsoft.com", url: "https://businessaccount.microsoft.com", category: "Licensing & Support" },
  { name: "Volume Licensing Service Center", description: "VLSC management", domain: "admin.cloud.microsoft", url: "https://admin.cloud.microsoft/vlsc", category: "Licensing & Support" },
  { name: "Service Trust Portal", description: "Compliance documentation", domain: "servicetrust.microsoft.com", url: "https://servicetrust.microsoft.com", category: "Licensing & Support" },
  { name: "Microsoft Home Use Program", description: "Employee purchase program", domain: "www.microsoft.com", url: "https://www.microsoft.com/en-us/home-use-program", category: "Licensing & Support" },
  // Governance & Purview
  { name: "Microsoft Purview (Governance)", description: "Data governance & compliance", domain: "purview.microsoft.com", url: "https://purview.microsoft.com", category: "Governance & Purview" },
  { name: "Purview Azure & Fabric Governance", description: "Azure data governance", domain: "web.purview.azure.com", url: "https://web.purview.azure.com", category: "Governance & Purview" },
  { name: "Office 365 Anti-Spam Delist", description: "IP delist portal", domain: "sender.office.com", url: "https://sender.office.com", category: "Governance & Purview" },
  { name: "Outlook SNDS", description: "Smart Network Data Service", domain: "sendersupport.olc.protection.outlook.com", url: "https://sendersupport.olc.protection.outlook.com/snds/", category: "Governance & Purview" },
  { name: "Report Unsafe Site (Login)", description: "Report malicious sites", domain: "www.microsoft.com", url: "https://www.microsoft.com/en-us/wdsi/support/report-unsafe-site", category: "Governance & Purview" },
  { name: "Submit File for Analysis", description: "Malware file submission", domain: "www.microsoft.com", url: "https://www.microsoft.com/en-us/wdsi/filesubmission", category: "Governance & Purview" },
  { name: "Submit Vulnerability", description: "Report security vulnerabilities", domain: "msrc.microsoft.com", url: "https://msrc.microsoft.com/report/vulnerability", category: "Governance & Purview" },
  { name: "Submit Abuse Report", description: "Report abuse (CERT)", domain: "msrc.microsoft.com", url: "https://msrc.microsoft.com/report/abuse", category: "Governance & Purview" },
  // Other & Utilities
  { name: "Microsoft Marketplace", description: "Azure & M365 marketplace", domain: "marketplace.microsoft.com", url: "https://marketplace.microsoft.com", category: "Other & Utilities" },
  { name: "Microsoft Learn", description: "Documentation hub", domain: "learn.microsoft.com", url: "https://learn.microsoft.com", category: "Other & Utilities" },
  { name: "Microsoft Training", description: "Free training courses", domain: "learn.microsoft.com", url: "https://learn.microsoft.com/en-us/training/", category: "Other & Utilities" },
  { name: "Microsoft Events", description: "Conferences & webinars", domain: "events.microsoft.com", url: "https://events.microsoft.com", category: "Other & Utilities" },
  { name: "Microsoft Adoption", description: "Adoption resources", domain: "adoption.microsoft.com", url: "https://adoption.microsoft.com", category: "Other & Utilities" },
  { name: "Microsoft Assessments", description: "Readiness assessments", domain: "learn.microsoft.com", url: "https://learn.microsoft.com/en-us/assessments/", category: "Other & Utilities" },
  { name: "Microsoft Setup", description: "Guided setup wizards", domain: "setup.cloud.microsoft", url: "https://setup.cloud.microsoft", category: "Other & Utilities" },
  { name: "Deployment Guides for M365", description: "Step-by-step deployment", domain: "assistants.microsoft.com", url: "https://assistants.microsoft.com", category: "Other & Utilities" },
  { name: "Group Policy Search", description: "Find Group Policy settings", domain: "gpsearch.azurewebsites.net", url: "https://gpsearch.azurewebsites.net", category: "Other & Utilities" },
  { name: "M365 URLs & IP Ranges", description: "Required endpoints", domain: "learn.microsoft.com", url: "https://learn.microsoft.com/en-us/microsoft-365/enterprise/urls-and-ip-address-ranges", category: "Other & Utilities" },
  { name: "Microsoft Feedback", description: "Submit product feedback", domain: "feedbackportal.microsoft.com", url: "https://feedbackportal.microsoft.com", category: "Other & Utilities" },
  { name: "Microsoft Community", description: "Community forums", domain: "answers.microsoft.com", url: "https://answers.microsoft.com", category: "Other & Utilities" },
  { name: "Tech Community Video Hub", description: "Technical videos", domain: "techcommunity.microsoft.com", url: "https://techcommunity.microsoft.com/t5/video-hub/ct-p/VideoHub", category: "Other & Utilities" },
  { name: "Microsoft Blogs", description: "Official blog", domain: "blogs.microsoft.com", url: "https://blogs.microsoft.com", category: "Other & Utilities" },
  { name: "Microsoft MVP", description: "MVP program", domain: "mvp.microsoft.com", url: "https://mvp.microsoft.com", category: "Other & Utilities" },
  { name: "Microsoft Open Source", description: "Open source projects", domain: "opensource.microsoft.com", url: "https://opensource.microsoft.com", category: "Other & Utilities" },
  { name: "Bing Maps Portal", description: "Maps API management", domain: "www.bingmapsportal.com", url: "https://www.bingmapsportal.com", category: "Other & Utilities" },
  { name: "Office UI Fabric Icons", description: "Fluent UI icon browser", domain: "uifabricicons.azurewebsites.net", url: "https://uifabricicons.azurewebsites.net", category: "Other & Utilities" },
  { name: "Microsoft Exam Sandbox", description: "Practice exam environment", domain: "mscertdemo.starttest.com", url: "https://mscertdemo.starttest.com", category: "Other & Utilities" },
  { name: "Enterprise Skills Initiative", description: "Enterprise training", domain: "esi.microsoft.com", url: "https://esi.microsoft.com", category: "Other & Utilities" },
];

const CATEGORIES = [
  "Microsoft 365",
  "Azure",
  "Entra ID",
  "Security & Defender",
  "Power Platform",
  "Intune & Endpoint",
  "AI & Copilot",
  "Developer",
  "Health & Status",
  "Partner & MSP",
  "Licensing & Support",
  "Governance & Purview",
  "Other & Utilities",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Microsoft 365": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Azure": "bg-sky-500/20 text-sky-300 border-sky-500/30",
  "Entra ID": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "Security & Defender": "bg-red-500/20 text-red-300 border-red-500/30",
  "Power Platform": "bg-violet-500/20 text-violet-300 border-violet-500/30",
  "Intune & Endpoint": "bg-green-500/20 text-green-300 border-green-500/30",
  "AI & Copilot": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "Developer": "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Health & Status": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "Partner & MSP": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  "Licensing & Support": "bg-pink-500/20 text-pink-300 border-pink-500/30",
  "Governance & Purview": "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  "Other & Utilities": "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

const CATEGORY_ICONS: Record<string, string> = {
  "Microsoft 365": "M",
  "Azure": "Az",
  "Entra ID": "ID",
  "Security & Defender": "🛡",
  "Power Platform": "PP",
  "Intune & Endpoint": "EP",
  "AI & Copilot": "AI",
  "Developer": "{}",
  "Health & Status": "♥",
  "Partner & MSP": "MSP",
  "Licensing & Support": "Lic",
  "Governance & Purview": "Gov",
  "Other & Utilities": "⚙",
};

const FAVORITES_KEY = "gigitekai_admin_hub_favorites";

export default function AdminHubPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All Portals");
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Persist favorites
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  const toggleFavorite = (name: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const filtered = useMemo(() => {
    let list = PORTALS;
    if (activeCategory === "Favorites") {
      list = list.filter(p => favorites.has(p.name));
    } else if (activeCategory !== "All Portals") {
      list = list.filter(p => p.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.domain.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, activeCategory, favorites]);

  // Group by category for "All Portals" view
  const grouped = useMemo(() => {
    if (activeCategory !== "All Portals" || search.trim()) return null;
    const groups: Record<string, Portal[]> = {};
    CATEGORIES.forEach(cat => {
      const items = filtered.filter(p => p.category === cat);
      if (items.length > 0) groups[cat] = items;
    });
    return groups;
  }, [filtered, activeCategory, search]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { "All Portals": PORTALS.length, "Favorites": favorites.size };
    CATEGORIES.forEach(cat => {
      counts[cat] = PORTALS.filter(p => p.category === cat).length;
    });
    return counts;
  }, [favorites]);

  return (
    <AdminLayout>
      <div className="flex h-full min-h-screen bg-[#0A0E1A]">
        {/* Left Category Sidebar */}
        <aside className="w-56 shrink-0 border-r border-cyan-500/10 bg-[#0D1220] flex flex-col pt-4 pb-6 overflow-y-auto">
          <div className="px-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Grid3X3 size={16} className="text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Categories</span>
            </div>
          </div>
          <nav className="flex flex-col gap-0.5 px-2">
            {/* All Portals */}
            <button
              onClick={() => setActiveCategory("All Portals")}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-[opacity,transform] ${
                activeCategory === "All Portals"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <span className="font-medium">All Portals</span>
              <span className="text-xs opacity-60">{categoryCounts["All Portals"]}</span>
            </button>
            {/* Favorites */}
            <button
              onClick={() => setActiveCategory("Favorites")}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-[opacity,transform] ${
                activeCategory === "Favorites"
                  ? "bg-yellow-500/15 text-yellow-300 border border-yellow-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <Star size={13} className={activeCategory === "Favorites" ? "text-yellow-400 fill-yellow-400" : "text-slate-500"} />
                <span className="font-medium">Favorites</span>
              </div>
              <span className="text-xs opacity-60">{categoryCounts["Favorites"]}</span>
            </button>
            {/* Divider */}
            <div className="my-2 border-t border-slate-700/50" />
            {/* Category list */}
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-[opacity,transform] ${
                  activeCategory === cat
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <span className="truncate">{cat}</span>
                <span className="text-xs opacity-60 ml-1 shrink-0">{categoryCounts[cat]}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[#0A0E1A]/95 backdrop-blur border-b border-cyan-500/10 px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-white font-['Space_Grotesk']">
                  Microsoft Admin Hub
                </h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  {filtered.length} portal{filtered.length !== 1 ? "s" : ""} 
                  {activeCategory !== "All Portals" && ` in ${activeCategory}`}
                  {search && ` matching "${search}"`}
                </p>
              </div>
              {/* Search */}
              <div className="relative w-72">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search portals..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-[#0F1629] border border-cyan-500/20 rounded-lg pl-9 pr-9 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Portal Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search size={40} className="text-slate-600 mb-4" />
                <p className="text-slate-400 text-lg font-medium">No portals found</p>
                <p className="text-slate-500 text-sm mt-1">Try a different search term or category</p>
              </div>
            ) : grouped ? (
              // Grouped view for "All Portals" without search
              <div className="space-y-8">
                {Object.entries(grouped).map(([cat, portals]) => (
                  <section key={cat}>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-base font-semibold text-white font-['Space_Grotesk']">{cat}</h2>
                      <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{portals.length}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {portals.map(portal => (
                        <PortalCard
                          key={portal.name}
                          portal={portal}
                          isFavorite={favorites.has(portal.name)}
                          onToggleFavorite={() => toggleFavorite(portal.name)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              // Flat grid for filtered/category view
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filtered.map(portal => (
                  <PortalCard
                    key={portal.name}
                    portal={portal}
                    isFavorite={favorites.has(portal.name)}
                    onToggleFavorite={() => toggleFavorite(portal.name)}
                    showCategory={activeCategory === "Favorites"}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// ─── Portal Card Component ────────────────────────────────────────────────────
function PortalCard({
  portal,
  isFavorite,
  onToggleFavorite,
  showCategory = false,
}: {
  portal: Portal;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  showCategory?: boolean;
}) {
  const colorClass = CATEGORY_COLORS[portal.category] || "bg-slate-500/20 text-slate-300 border-slate-500/30";

  return (
    <div className="group relative bg-[#0F1629] border border-cyan-500/10 rounded-xl p-4 hover:border-cyan-500/30 hover:bg-[#111827] transition-[opacity,transform]">
      {/* Favorite button */}
      <button
        onClick={e => { e.preventDefault(); onToggleFavorite(); }}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Star
          size={14}
          className={isFavorite ? "text-yellow-400 fill-yellow-400" : "text-slate-500 hover:text-yellow-400"}
        />
      </button>
      {isFavorite && (
        <Star size={14} className="absolute top-3 right-3 text-yellow-400 fill-yellow-400 group-hover:opacity-0 transition-opacity" />
      )}

      <a
        href={portal.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {/* Category badge (shown in favorites view) */}
        {showCategory && (
          <span className={`inline-block text-xs px-2 py-0.5 rounded-full border mb-2 ${colorClass}`}>
            {portal.category}
          </span>
        )}
        {/* Portal name */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold text-white leading-tight group-hover:text-cyan-300 transition-colors pr-4">
            {portal.name}
          </h3>
          <ExternalLink size={12} className="text-slate-600 group-hover:text-cyan-400 shrink-0 mt-0.5 transition-colors" />
        </div>
        {/* Description */}
        <p className="text-xs text-slate-400 mb-2 leading-relaxed">{portal.description}</p>
        {/* Domain */}
        <p className="text-xs text-cyan-600 font-mono truncate">{portal.domain}</p>
      </a>
    </div>
  );
}
