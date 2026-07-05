#!/usr/bin/env node
/**
 * Bulk import 100 KB articles into kbArticles table
 * Hardcoded article data (100 articles across Azure, Exchange, Teams, SharePoint, OneDrive, Intune, Entra ID)
 */

import { getDb } from '../server/db.ts';
import { kbArticles } from '../drizzle/schema.ts';
import { eq } from 'drizzle-orm';

// KB article data - 100 articles
const articleData = [
  // Azure (20 articles)
  { code: 'AZR-001', title: 'Cannot Sign In to Azure Portal — No Subscriptions Found', category: 'Azure > Identity & Access', tier: 1, audience: 'Help Desk', tags: 'azure, portal, sign-in, subscription', content: 'Unable to access Azure subscriptions in the portal. Verify account permissions and subscription assignments.' },
  { code: 'AZR-002', title: 'Azure VM Won\'t Start — Allocation Failure or Stuck Starting', category: 'Azure > Virtual Machines', tier: 2, audience: 'Administrators', tags: 'azure, vm, allocation-failure', content: 'VM fails to start with allocation error. Try deallocating and reallocating the VM, or migrate to a different region.' },
  { code: 'AZR-003', title: 'Cannot RDP/SSH to Azure VM — NSG Rules and Just-in-Time Access', category: 'Azure > Virtual Machines', tier: 2, audience: 'Administrators', tags: 'azure, vm, rdp, nsg, jit', content: 'Remote access blocked. Check NSG rules, enable Just-in-Time access, and verify firewall settings.' },
  { code: 'AZR-004', title: 'Azure VM Disk Full — Expand OS and Data Disks Safely', category: 'Azure > Virtual Machines', tier: 2, audience: 'Administrators', tags: 'azure, vm, disk, expand', content: 'Disk space exhausted. Expand managed disks and extend partitions using Azure portal or PowerShell.' },
  { code: 'AZR-005', title: 'Restore Files or a Full VM from Azure Backup', category: 'Azure > Backup & Recovery', tier: 2, audience: 'Administrators', tags: 'azure, backup, restore, recovery-vault', content: 'Recover deleted or corrupted VMs using Azure Backup Recovery Services Vault.' },
  { code: 'AZR-006', title: 'Azure Storage 403 Errors — Expired SAS Tokens and Key Rotation', category: 'Azure > Storage', tier: 2, audience: 'Administrators', tags: 'azure, storage, sas, 403', content: 'Access denied to storage. Regenerate SAS tokens or rotate storage account keys.' },
  { code: 'AZR-007', title: 'Azure File Share Won\'t Map — Port 445 Blocked by ISP', category: 'Azure > Storage', tier: 1, audience: 'Help Desk', tags: 'azure-files, smb, port-445', content: 'SMB 445 blocked. Use Azure Files REST API or configure VPN bypass.' },
  { code: 'AZR-008', title: 'Entra Connect Sync Errors — Users Not Appearing in Microsoft 365', category: 'Azure > Hybrid Identity', tier: 2, audience: 'Administrators', tags: 'entra-connect, sync, hybrid', content: 'Hybrid sync failing. Check Entra Connect health, verify connector credentials, and review sync rules.' },
  { code: 'AZR-009', title: 'Password Changes Not Syncing to the Cloud (Password Hash Sync)', category: 'Azure > Hybrid Identity', tier: 2, audience: 'Administrators', tags: 'phs, password, sync', content: 'PHS not syncing. Enable password hash sync in Entra Connect and verify Azure AD Connect Health.' },
  { code: 'AZR-010', title: 'Grant and Troubleshoot Azure RBAC Role Assignments', category: 'Azure > Governance', tier: 2, audience: 'Administrators', tags: 'rbac, roles, iam', content: 'Manage role-based access control. Assign roles at subscription/resource group level and audit permissions.' },
  { code: 'AZR-011', title: 'Unexpected Azure Cost Spike — Budgets, Alerts, and Cost Analysis', category: 'Azure > Cost Management', tier: 2, audience: 'Administrators', tags: 'cost, budget, alerts', content: 'Monitor costs with Azure Cost Management, set budgets, and enable alerts for overspending.' },
  { code: 'AZR-012', title: 'Resource Deletion Blocked by an Azure Resource Lock', category: 'Azure > Governance', tier: 1, audience: 'Administrators', tags: 'resource-lock, delete, cannotdelete', content: 'Cannot delete resource due to lock. Remove CanNotDelete or ReadOnly locks from resource or resource group.' },
  { code: 'AZR-013', title: 'Point-to-Site VPN Client Cannot Connect to Azure VPN Gateway', category: 'Azure > Networking', tier: 2, audience: 'Administrators', tags: 'p2s, vpn, gateway, certificate', content: 'P2S VPN connection fails. Verify client certificate, gateway configuration, and VPN client settings.' },
  { code: 'AZR-014', title: 'Site-to-Site VPN Tunnel Down — IKE/IPsec Troubleshooting', category: 'Azure > Networking', tier: 2, audience: 'Administrators', tags: 's2s, vpn, ike, ipsec', content: 'S2S VPN tunnel offline. Check IKE/IPsec settings, pre-shared key, and on-premises VPN device logs.' },
  { code: 'AZR-015', title: 'Azure Bastion Connection Failures', category: 'Azure > Networking', tier: 2, audience: 'Administrators', tags: 'bastion, rdp, ssh', content: 'Bastion RDP/SSH fails. Verify NSG rules, VM network settings, and Bastion subnet configuration.' },
  { code: 'AZR-016', title: 'Azure App Service Down — Restart, Log Stream, and Health Checks', category: 'Azure > App Services', tier: 2, audience: 'Administrators', tags: 'app-service, 503, restart', content: 'App Service returning 503. Restart app, check resource limits, review application logs, and verify dependencies.' },
  { code: 'AZR-017', title: 'Clean Up Stale and Duplicate Devices in Entra ID', category: 'Azure > Identity & Access', tier: 2, audience: 'Administrators', tags: 'entra, devices, stale', content: 'Remove inactive devices. Use Entra ID device management to delete stale or duplicate device records.' },
  { code: 'AZR-018', title: 'VM Patch Failures in Azure Update Manager', category: 'Azure > Virtual Machines', tier: 2, audience: 'Administrators', tags: 'update-manager, patching, vm', content: 'Patching fails. Check VM agent status, network connectivity, and Update Manager maintenance windows.' },
  { code: 'AZR-019', title: 'Azure Monitor Alerts Not Firing', category: 'Azure > Monitoring', tier: 2, audience: 'Administrators', tags: 'azure-monitor, alerts, action-group', content: 'Alerts not triggering. Verify alert rules, action groups, and notification settings in Azure Monitor.' },
  { code: 'AZR-020', title: 'Private Endpoint DNS Resolution Failures', category: 'Azure > Networking', tier: 2, audience: 'Administrators', tags: 'private-endpoint, dns, privatelink', content: 'Private endpoint DNS not resolving. Configure private DNS zones and verify DNS settings.' },
  
  // Exchange Online / Email (20 articles)
  { code: 'EML-054', title: 'Run a Message Trace in Exchange Online', category: 'Email > Mail Flow', tier: 2, audience: 'Help Desk, Administrators', tags: 'message-trace, exchange-online, delivery', content: 'Trace email delivery. Use Exchange admin center message trace to diagnose mail flow issues.' },
  { code: 'EML-055', title: 'Release Email from Quarantine (User and Admin)', category: 'Email > Security', tier: 1, audience: 'End Users, Help Desk', tags: 'quarantine, defender, release', content: 'Email in quarantine. Release from quarantine in Defender portal or user quarantine portal.' },
  { code: 'EML-056', title: 'SPF, DKIM, and DMARC — Setup and Failure Troubleshooting', category: 'Email > Mail Flow', tier: 2, audience: 'Administrators', tags: 'spf, dkim, dmarc, authentication', content: 'Email authentication failing. Configure SPF, DKIM, and DMARC records in DNS.' },
  { code: 'EML-057', title: 'NDR Quick Reference — Decoding 5.1.1, 5.7.1, and Other Bounce Codes', category: 'Email > Mail Flow', tier: 1, audience: 'Help Desk', tags: 'ndr, bounce, 550', content: 'Non-delivery reports. Decode NDR codes: 5.1.1 (user not found), 5.7.1 (permission denied), etc.' },
  { code: 'EML-058', title: 'External Forwarding Blocked by Outbound Spam Policy', category: 'Email > Mail Flow', tier: 2, audience: 'Administrators', tags: 'forwarding, outbound-spam, 5.7.520', content: 'Forwarding blocked. Modify outbound spam policy to allow external forwarding.' },
  { code: 'EML-059', title: 'Convert a User Mailbox to a Shared Mailbox (Offboarding)', category: 'Email > Administration', tier: 2, audience: 'Administrators', tags: 'shared-mailbox, offboarding, license', content: 'Convert mailbox. Remove license and convert to shared mailbox for team access.' },
  { code: 'EML-060', title: 'Full Access vs Send As vs Send on Behalf — Mailbox Permissions', category: 'Email > Permissions', tier: 2, audience: 'Help Desk, Administrators', tags: 'permissions, send-as, full-access', content: 'Mailbox permissions. Assign Full Access, Send As, or Send on Behalf permissions as needed.' },
  { code: 'EML-061', title: 'Room and Equipment Mailboxes — Booking Requests Not Working', category: 'Email > Calendar', tier: 2, audience: 'Administrators', tags: 'room-mailbox, booking, resource', content: 'Resource booking failing. Configure room mailbox settings and booking policies.' },
  { code: 'EML-062', title: 'Calendar Sharing Permission Levels and Troubleshooting', category: 'Email > Calendar', tier: 1, audience: 'End Users, Help Desk', tags: 'calendar, sharing, permissions', content: 'Calendar not sharing. Set sharing permissions: Can view all details, Can view titles and times, etc.' },
  { code: 'EML-063', title: 'Enable Online Archive and Auto-Expanding Archive', category: 'Email > Storage & Quota', tier: 2, audience: 'Administrators', tags: 'archive, mailbox, quota', content: 'Enable archive. Activate online archive and auto-expanding archive for mailboxes.' },
  { code: 'EML-064', title: 'Litigation Hold vs Retention Policy — Preserving Mailbox Data', category: 'Email > Compliance', tier: 2, audience: 'Administrators', tags: 'litigation-hold, retention, purview', content: 'Preserve data. Apply litigation hold or retention policy for compliance.' },
  { code: 'EML-065', title: 'Safe Links Blocking or Rewriting Legitimate URLs', category: 'Email > Security', tier: 2, audience: 'Help Desk, Administrators', tags: 'safe-links, defender, url', content: 'Safe Links blocking URLs. Whitelist URLs or adjust Safe Links policy.' },
  { code: 'EML-066', title: 'Safe Attachments Delaying or Blocking Inbound Mail', category: 'Email > Security', tier: 2, audience: 'Administrators', tags: 'safe-attachments, defender, delay', content: 'Safe Attachments delays. Adjust policy or whitelist senders.' },
  { code: 'EML-067', title: 'Blocked Attachment Types in Outlook and Exchange Online', category: 'Email > Attachments', tier: 1, audience: 'End Users, Help Desk', tags: 'attachments, blocked, file-types', content: 'Attachment blocked. Modify attachment filter policy or use alternative file formats.' },
  { code: 'EML-068', title: 'Exchange Online Sending Limits and Recipient Rate Throttling', category: 'Email > Mail Flow', tier: 2, audience: 'Help Desk', tags: 'sending-limits, throttling, 10000', content: 'Sending limit exceeded. Increase limits or distribute sends over time.' },
  { code: 'EML-069', title: 'Set Up Email Aliases and Plus Addressing', category: 'Email > Administration', tier: 1, audience: 'Help Desk', tags: 'alias, plus-addressing, proxy-address', content: 'Add email aliases. Configure proxy addresses or plus addressing for mailboxes.' },
  { code: 'EML-070', title: 'Distribution List vs Microsoft 365 Group — Choose and Convert', category: 'Email > Administration', tier: 2, audience: 'Administrators', tags: 'distribution-list, m365-group, convert', content: 'Choose collaboration tool. Convert distribution lists to Microsoft 365 Groups.' },
  { code: 'EML-071', title: 'Mail Flow Connectors for Third-Party Filters (Proofpoint, Mimecast)', category: 'Email > Mail Flow', tier: 2, audience: 'Administrators', tags: 'connectors, proofpoint, mimecast, eop', content: 'Configure connectors. Set up mail flow connectors for third-party email security.' },
  { code: 'EML-072', title: 'Rebuild a Corrupt Outlook Profile from Scratch', category: 'Email > Outlook Desktop', tier: 1, audience: 'Help Desk', tags: 'outlook, profile, rebuild', content: 'Fix Outlook. Delete and recreate Outlook profile to resolve corruption.' },
  { code: 'EML-073', title: 'Set Up and Troubleshoot Outlook Mobile (iOS/Android)', category: 'Email > Mobile', tier: 1, audience: 'End Users, Help Desk', tags: 'outlook-mobile, ios, android', content: 'Mobile email setup. Configure Outlook app for iOS/Android and troubleshoot sync issues.' },
  
  // Teams (20 articles)
  { code: 'TMS-060', title: 'Teams Guest Invitations Not Received or Can\'t Be Redeemed', category: 'Teams > External Access', tier: 2, audience: 'Help Desk, Administrators', tags: 'guest, invitation, b2b', content: 'Guest invite failing. Resend invitation or check guest access policies.' },
  { code: 'TMS-061', title: 'External (Federated) Chat Not Working with Another Organization', category: 'Teams > External Access', tier: 2, audience: 'Administrators', tags: 'federation, external-access, chat', content: 'Federation disabled. Enable external access and federation in Teams admin center.' },
  { code: 'TMS-062', title: 'Join a Teams Meeting as an External or Anonymous Attendee', category: 'Teams > Meetings', tier: 1, audience: 'End Users', tags: 'anonymous, join, meeting', content: 'Join meeting. Use meeting link to join as external or anonymous participant.' },
  { code: 'TMS-063', title: 'Enable Live Captions and Meeting Transcription', category: 'Teams > Meetings', tier: 1, audience: 'End Users, Administrators', tags: 'captions, transcription, meetings', content: 'Enable accessibility. Turn on live captions and transcription in Teams meetings.' },
  { code: 'TMS-064', title: 'Assign a Teams Phone Number to a User', category: 'Teams > Voice & Calls', tier: 2, audience: 'Administrators', tags: 'phone-number, calling-plan, voice', content: 'Assign phone number. Configure Teams Phone license and assign PSTN number.' },
  { code: 'TMS-065', title: 'Configure Emergency Calling (E911) Addresses and Locations', category: 'Teams > Voice & Calls', tier: 2, audience: 'Administrators', tags: 'e911, emergency, lis', content: 'Setup E911. Configure emergency addresses and location information services.' },
  { code: 'TMS-066', title: 'Teams Voicemail Not Working or Not Transcribing', category: 'Teams > Voice & Calls', tier: 2, audience: 'Help Desk', tags: 'voicemail, transcription, calling', content: 'Voicemail issues. Enable voicemail transcription and check voicemail settings.' },
  { code: 'TMS-067', title: 'Diagnose Poor Call Quality with CQD and Per-User Analytics', category: 'Teams > Call Quality', tier: 2, audience: 'Administrators', tags: 'cqd, call-quality, jitter', content: 'Call quality analysis. Use Call Quality Dashboard to diagnose network issues.' },
  { code: 'TMS-068', title: 'Breakout Rooms Missing or Failing to Open', category: 'Teams > Meetings', tier: 1, audience: 'Help Desk', tags: 'breakout-rooms, meetings', content: 'Breakout rooms not working. Check Teams version and meeting policies.' },
  { code: 'TMS-069', title: 'Teams Desktop App Crashing or Not Starting', category: 'Teams > Client', tier: 1, audience: 'End Users, Help Desk', tags: 'crash, client, startup', content: 'App crashes. Reinstall Teams or clear cache.' },
  { code: 'TMS-070', title: 'Teams File Upload Fails or Files Not Syncing', category: 'Teams > Files & Storage', tier: 1, audience: 'End Users, Help Desk', tags: 'files, upload, sync', content: 'File sync issues. Check SharePoint storage and file permissions.' },
  { code: 'TMS-071', title: 'Teams Channel Moderation and Message Retention Policies', category: 'Teams > Governance', tier: 2, audience: 'Administrators', tags: 'moderation, retention, governance', content: 'Manage channels. Configure moderation and message retention policies.' },
  { code: 'TMS-072', title: 'Teams App Installation and Sideloading for Custom Apps', category: 'Teams > Apps', tier: 2, audience: 'Administrators', tags: 'apps, sideload, custom', content: 'Deploy apps. Install Teams apps or sideload custom applications.' },
  { code: 'TMS-073', title: 'Teams Live Event Setup and Troubleshooting', category: 'Teams > Events', tier: 2, audience: 'Administrators', tags: 'live-event, broadcast, streaming', content: 'Live events. Configure and troubleshoot Teams live events.' },
  { code: 'TMS-074', title: 'Teams Meeting Recording Not Available or Deleted', category: 'Teams > Meetings', tier: 1, audience: 'Help Desk', tags: 'recording, storage, deleted', content: 'Recording missing. Check Stream storage and recovery options.' },
  { code: 'TMS-075', title: 'Teams Presence Status Not Updating or Stuck', category: 'Teams > Status', tier: 1, audience: 'End Users, Help Desk', tags: 'presence, status, offline', content: 'Status stuck. Restart Teams or check network connectivity.' },
  { code: 'TMS-076', title: 'Teams Search Not Finding Messages or Files', category: 'Teams > Search', tier: 1, audience: 'End Users, Help Desk', tags: 'search, messages, files', content: 'Search issues. Wait for indexing or try advanced search filters.' },
  { code: 'TMS-077', title: 'Teams Notifications Not Working or Too Many Alerts', category: 'Teams > Notifications', tier: 1, audience: 'End Users, Help Desk', tags: 'notifications, alerts, mute', content: 'Notification problems. Adjust notification settings or check do-not-disturb.' },
  { code: 'TMS-078', title: 'Teams Bot Integration and Webhook Configuration', category: 'Teams > Automation', tier: 2, audience: 'Administrators', tags: 'bot, webhook, automation', content: 'Setup automation. Configure Teams bots and incoming webhooks.' },
  { code: 'TMS-079', title: 'Teams Compliance and Data Retention Policies', category: 'Teams > Compliance', tier: 2, audience: 'Administrators', tags: 'compliance, retention, ediscovery', content: 'Compliance setup. Configure retention and eDiscovery for Teams.' },
  
  // SharePoint (20 articles)
  { code: 'SPO-001', title: 'SharePoint Site Storage Full — Increase Quota or Archive', category: 'SharePoint > Storage & Quota', tier: 2, audience: 'Administrators', tags: 'sharepoint, storage, quota', content: 'Storage exceeded. Increase site quota or move old content to archive.' },
  { code: 'SPO-002', title: 'SharePoint List View Threshold — 5000 Item Limit Error', category: 'SharePoint > Lists', tier: 2, audience: 'Administrators', tags: 'list, threshold, 5000', content: 'View threshold exceeded. Create indexed columns or use filters.' },
  { code: 'SPO-003', title: 'SharePoint Search Not Finding Documents', category: 'SharePoint > Search', tier: 2, audience: 'Administrators', tags: 'search, indexing, documents', content: 'Search issues. Wait for crawl completion or reindex content.' },
  { code: 'SPO-004', title: 'SharePoint Permissions Not Inheriting or Stuck', category: 'SharePoint > Permissions', tier: 2, audience: 'Administrators', tags: 'permissions, inheritance, access', content: 'Permission issues. Reset inheritance or manually assign permissions.' },
  { code: 'SPO-005', title: 'SharePoint Workflow Not Triggering or Stuck in Loop', category: 'SharePoint > Workflows', tier: 2, audience: 'Administrators', tags: 'workflow, automation, trigger', content: 'Workflow issues. Check triggers and conditions or recreate workflow.' },
  { code: 'SPO-006', title: 'SharePoint Version History Disabled or Deleted Items', category: 'SharePoint > Content Management', tier: 2, audience: 'Administrators', tags: 'version, history, restore', content: 'Recover content. Restore from version history or recycle bin.' },
  { code: 'SPO-007', title: 'SharePoint Site Collection Provisioning Fails', category: 'SharePoint > Administration', tier: 2, audience: 'Administrators', tags: 'site-collection, provisioning, create', content: 'Site creation fails. Check quotas and permissions.' },
  { code: 'SPO-008', title: 'SharePoint Sync Issues with OneDrive Sync Client', category: 'SharePoint > Sync', tier: 1, audience: 'Help Desk', tags: 'sync, onedrive, client', content: 'Sync not working. Restart sync client or reset sync.' },
  { code: 'SPO-009', title: 'SharePoint External Sharing Not Working or Blocked', category: 'SharePoint > Sharing', tier: 2, audience: 'Administrators', tags: 'sharing, external, guests', content: 'Sharing blocked. Enable external sharing in SharePoint settings.' },
  { code: 'SPO-010', title: 'SharePoint Modern Page Performance Slow', category: 'SharePoint > Performance', tier: 2, audience: 'Administrators', tags: 'performance, modern, slow', content: 'Page slow. Optimize web parts and reduce script complexity.' },
  { code: 'SPO-011', title: 'SharePoint Metadata and Content Types Best Practices', category: 'SharePoint > Governance', tier: 2, audience: 'Administrators', tags: 'metadata, content-types, governance', content: 'Organize content. Create content types and metadata columns.' },
  { code: 'SPO-012', title: 'SharePoint Hub Sites — Setup and Navigation', category: 'SharePoint > Hub Sites', tier: 2, audience: 'Administrators', tags: 'hub-site, navigation, hierarchy', content: 'Hub site setup. Create hub sites and associate sites.' },
  { code: 'SPO-013', title: 'SharePoint Information Architecture and Site Planning', category: 'SharePoint > Governance', tier: 2, audience: 'Administrators', tags: 'ia, planning, structure', content: 'Plan structure. Design site hierarchy and information architecture.' },
  { code: 'SPO-014', title: 'Departed Employee OneDrive Access and Content Recovery', category: 'SharePoint > Offboarding', tier: 2, audience: 'Administrators', tags: 'onedrive, offboarding, access', content: 'Offboarding. Grant access to OneDrive or transfer ownership.' },
  { code: 'SPO-015', title: 'SharePoint REST API and CSOM Development', category: 'SharePoint > Development', tier: 2, audience: 'Administrators', tags: 'api, rest, csom', content: 'API development. Use REST API or CSOM for custom solutions.' },
  { code: 'SPO-016', title: 'SharePoint Power Automate Flows and Automation', category: 'SharePoint > Automation', tier: 2, audience: 'Administrators', tags: 'power-automate, flow, automation', content: 'Automate tasks. Create flows for list operations and approvals.' },
  { code: 'SPO-017', title: 'SharePoint Power Apps Integration', category: 'SharePoint > Apps', tier: 2, audience: 'Administrators', tags: 'power-apps, custom-app', content: 'Custom apps. Build Power Apps for SharePoint lists.' },
  { code: 'SPO-018', title: 'SharePoint Compliance and Data Retention', category: 'SharePoint > Compliance', tier: 2, audience: 'Administrators', tags: 'compliance, retention, dlp', content: 'Compliance setup. Configure retention and DLP policies.' },
  { code: 'SPO-019', title: 'SharePoint Migration from On-Premises to Online', category: 'SharePoint > Migration', tier: 2, audience: 'Administrators', tags: 'migration, on-premises, cloud', content: 'Migrate content. Use Migration Manager or third-party tools.' },
  { code: 'SPO-020', title: 'SharePoint Disaster Recovery and Business Continuity', category: 'SharePoint > Backup & Recovery', tier: 2, audience: 'Administrators', tags: 'disaster-recovery, backup, continuity', content: 'Disaster recovery. Plan backup and recovery strategies.' },
  
  // OneDrive (8 articles)
  { code: 'ODV-070', title: 'OneDrive Sign-In Errors — 0x8004de40 and Other Codes', category: 'OneDrive > Troubleshooting', tier: 1, audience: 'Help Desk', tags: 'onedrive, signin, error', content: 'Sign-in fails. Clear cache and re-authenticate.' },
  { code: 'ODV-071', title: 'OneDrive Sync Not Starting or Stuck', category: 'OneDrive > Sync', tier: 1, audience: 'Help Desk', tags: 'onedrive, sync, stuck', content: 'Sync issues. Restart sync client or check network.' },
  { code: 'ODV-072', title: 'OneDrive Storage Full — Manage Quota and Cleanup', category: 'OneDrive > Storage', tier: 1, audience: 'End Users, Help Desk', tags: 'onedrive, storage, quota', content: 'Storage exceeded. Delete old files or request quota increase.' },
  { code: 'ODV-073', title: 'OneDrive File Restore from Recycle Bin', category: 'OneDrive > Recovery', tier: 1, audience: 'End Users, Help Desk', tags: 'onedrive, restore, recycle-bin', content: 'Recover files. Restore from recycle bin within 93 days.' },
  { code: 'ODV-074', title: 'OneDrive Sharing and Permission Issues', category: 'OneDrive > Sharing', tier: 1, audience: 'End Users, Help Desk', tags: 'onedrive, sharing, permissions', content: 'Sharing problems. Adjust sharing links and permissions.' },
  { code: 'ODV-075', title: 'OneDrive Mobile App Setup and Troubleshooting', category: 'OneDrive > Mobile', tier: 1, audience: 'End Users, Help Desk', tags: 'onedrive, mobile, app', content: 'Mobile setup. Configure OneDrive app for iOS/Android.' },
  { code: 'ODV-076', title: 'OneDrive Version History and File Recovery', category: 'OneDrive > Recovery', tier: 1, audience: 'End Users, Help Desk', tags: 'onedrive, version, recovery', content: 'Recover versions. Restore previous file versions.' },
  { code: 'ODV-077', title: 'OneDrive Compliance and Data Retention', category: 'OneDrive > Compliance', tier: 2, audience: 'Administrators', tags: 'onedrive, compliance, retention', content: 'Compliance setup. Configure retention policies for OneDrive.' },
  
  // Intune (6 articles)
  { code: 'INT-001', title: 'Intune Device Enrollment Failures — Windows, iOS, Android', category: 'Intune > Enrollment', tier: 2, audience: 'Administrators', tags: 'intune, enrollment, device', content: 'Enrollment fails. Check device compatibility and network.' },
  { code: 'INT-002', title: 'Win32 App Installation Failures — 0x87D Error Codes', category: 'Intune > App Management', tier: 2, audience: 'Administrators', tags: 'intune, app, win32', content: 'App install fails. Check app requirements and dependencies.' },
  { code: 'INT-003', title: 'Intune Compliance Policy Not Enforcing or Blocking Access', category: 'Intune > Compliance', tier: 2, audience: 'Administrators', tags: 'intune, compliance, policy', content: 'Compliance issues. Review policy rules and device status.' },
  { code: 'INT-004', title: 'Intune Remote Actions — Wipe, Lock, and Password Reset', category: 'Intune > Device Management', tier: 2, audience: 'Administrators', tags: 'intune, remote-action, wipe', content: 'Remote management. Execute remote actions on devices.' },
  { code: 'INT-005', title: 'Intune Conditional Access and Device-Based Access Control', category: 'Intune > Security', tier: 2, audience: 'Administrators', tags: 'intune, conditional-access, device', content: 'Access control. Configure device-based conditional access.' },
  { code: 'INT-006', title: 'Intune Configuration Profiles and Deployment Troubleshooting', category: 'Intune > Configuration', tier: 2, audience: 'Administrators', tags: 'intune, profile, deployment', content: 'Profile deployment. Troubleshoot configuration profile issues.' },
  
  // Entra ID (6 articles)
  { code: 'EID-001', title: 'Entra ID User Provisioning and Deprovisioning Workflows', category: 'Entra ID > User Management', tier: 2, audience: 'Administrators', tags: 'entra, user, provisioning', content: 'User lifecycle. Automate user provisioning and deprovisioning.' },
  { code: 'EID-002', title: 'Diagnose Conditional Access Blocks and MFA Issues', category: 'Entra ID > Security', tier: 2, audience: 'Administrators', tags: 'entra, conditional-access, mfa', content: 'Access issues. Diagnose and troubleshoot CA blocks.' },
  { code: 'EID-003', title: 'Entra ID Application Registration and OAuth Flows', category: 'Entra ID > Applications', tier: 2, audience: 'Administrators', tags: 'entra, app, oauth', content: 'App registration. Register apps and configure OAuth.' },
  { code: 'EID-004', title: 'Entra ID Group Management and Dynamic Groups', category: 'Entra ID > Groups', tier: 2, audience: 'Administrators', tags: 'entra, groups, dynamic', content: 'Group management. Create dynamic groups and manage members.' },
  { code: 'EID-005', title: 'Entra ID Audit Logs and Sign-In Analysis', category: 'Entra ID > Monitoring', tier: 2, audience: 'Administrators', tags: 'entra, audit, logs', content: 'Monitoring. Review audit logs and sign-in activity.' },
  { code: 'EID-006', title: 'Entra ID Privileged Identity Management (PIM) Setup', category: 'Entra ID > Governance', tier: 2, audience: 'Administrators', tags: 'entra, pim, privileged', content: 'PIM setup. Configure privileged access management.' },
];

async function importArticles() {
  console.log('🚀 Starting KB article import...');
  console.log(`📚 Importing ${articleData.length} articles`);

  try {
    const db = await getDb();
    let importedCount = 0;
    let skippedCount = 0;

    for (const article of articleData) {
      try {
        // Check if article already exists
        const existing = await db.query.kbArticles.findFirst({
          where: eq(kbArticles.articleCode, article.code),
        });

        if (existing) {
          console.log(`⏭️  Skipping ${article.code} (already exists)`);
          skippedCount++;
          continue;
        }

        // Insert article
        await db.insert(kbArticles).values({
          title: article.title,
          content: article.content,
          category: article.category,
          tags: article.tags,
          isPublished: true,
          articleCode: article.code,
          tier: article.tier,
          audience: article.audience,
          viewCount: 0,
          averageRating: 0,
          ratingCount: 0,
          commentCount: 0,
        });

        console.log(`✅ Imported: ${article.code} - ${article.title}`);
        importedCount++;
      } catch (error) {
        console.error(`❌ Failed to import ${article.code}:`, error instanceof Error ? error.message : error);
      }
    }

    console.log(`\n📊 Import Summary:`);
    console.log(`   ✅ Imported: ${importedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   📚 Total: ${importedCount + skippedCount}`);
    console.log(`\n✨ Import complete!`);
    process.exit(0);
  } catch (error) {
    console.error('💥 Import failed:', error);
    process.exit(1);
  }
}

importArticles();
