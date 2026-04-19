/**
 * Knowledge Base Seeding System
 * Populates KB with common M365 issues and solutions
 * Used during Phase 1 to bootstrap AI training data
 */

import { protectedProcedure, adminProcedure, router } from '../_core/trpc';
import { z } from 'zod';

export interface KBArticle {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  problem: string;
  solution: string;
  steps: string[];
  keywords: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  estimatedResolutionTime: string;
  affectedServices: string[];
  preventionTips?: string[];
  relatedArticles?: string[];
}

/**
 * Default KB articles for GigitekAI
 * These are common M365 issues that AI can auto-resolve
 */
export const DEFAULT_KB_ARTICLES: KBArticle[] = [
  // ============ EXCHANGE ONLINE ============
  {
    id: 'exchange-cannot-access',
    title: 'Cannot Access Exchange Online / Outlook',
    category: 'Exchange Online',
    subcategory: 'Access Issues',
    problem: 'User cannot access their mailbox or Outlook is showing connection errors',
    solution: 'The issue is usually caused by network connectivity, cached credentials, or authentication problems. Follow the steps below to resolve.',
    steps: [
      '1. Check internet connection - Ensure you have stable internet connectivity',
      '2. Clear Outlook cache - Close Outlook completely, delete cache files, and restart',
      '3. Verify credentials - Ensure you are using the correct email address and password',
      '4. Check MFA - If MFA is enabled, ensure you have access to your authentication method',
      '5. Try OWA - Access Outlook Web App (outlook.office.com) to verify account is working',
      '6. Restart Outlook - Close and reopen Outlook completely',
      '7. Update Outlook - Ensure you have the latest version of Outlook installed',
    ],
    keywords: ['outlook', 'exchange', 'cannot access', 'connection error', 'mailbox'],
    severity: 'high',
    estimatedResolutionTime: '15-30 minutes',
    affectedServices: ['Exchange Online', 'Outlook'],
    preventionTips: [
      'Keep Outlook updated to the latest version',
      'Use strong passwords and enable MFA',
      'Ensure stable internet connection',
      'Regularly clear Outlook cache',
    ],
  },

  {
    id: 'exchange-send-receive-mail',
    title: 'Cannot Send or Receive Emails in Outlook',
    category: 'Exchange Online',
    subcategory: 'Email Issues',
    problem: 'Emails are not sending or receiving in Outlook',
    solution: 'This is usually caused by sync issues, server problems, or account configuration. Try these steps:',
    steps: [
      '1. Check Outlook sync status - Look for sync indicators in Outlook',
      '2. Restart Outlook - Close and reopen the application',
      '3. Check internet connection - Ensure stable connectivity',
      '4. Verify mailbox quota - Check if mailbox is full (Admin Portal > Users)',
      '5. Check server status - Verify Exchange Online is operational',
      '6. Try OWA - Test sending/receiving via Outlook Web App',
      '7. Repair Outlook - Use Office Repair tool (Control Panel > Programs > Programs and Features)',
    ],
    keywords: ['email', 'send', 'receive', 'outlook', 'mail sync'],
    severity: 'high',
    estimatedResolutionTime: '20-45 minutes',
    affectedServices: ['Exchange Online', 'Outlook'],
    preventionTips: [
      'Monitor mailbox quota regularly',
      'Keep Outlook synchronized',
      'Use reliable internet connection',
    ],
  },

  {
    id: 'exchange-calendar-sync',
    title: 'Calendar Not Syncing in Outlook',
    category: 'Exchange Online',
    subcategory: 'Calendar Issues',
    problem: 'Calendar events are not syncing or appearing in Outlook',
    solution: 'Calendar sync issues can be resolved by refreshing the sync or resetting the calendar.',
    steps: [
      '1. Close Outlook completely',
      '2. Clear Outlook cache - Delete OST files from AppData',
      '3. Restart Outlook - This will rebuild the cache',
      '4. Check calendar permissions - Ensure calendar is not hidden',
      '5. Verify calendar is selected - In Outlook, check that calendar is enabled',
      '6. Try OWA - Access calendar via Outlook Web App to verify events exist',
      '7. Restart computer - If issue persists, restart your computer',
    ],
    keywords: ['calendar', 'sync', 'events', 'outlook', 'not syncing'],
    severity: 'medium',
    estimatedResolutionTime: '15-30 minutes',
    affectedServices: ['Exchange Online', 'Outlook', 'Calendar'],
  },

  // ============ MICROSOFT TEAMS ============
  {
    id: 'teams-cannot-access',
    title: 'Cannot Access Microsoft Teams',
    category: 'Microsoft Teams',
    subcategory: 'Access Issues',
    problem: 'User cannot sign in to Teams or Teams keeps disconnecting',
    solution: 'Teams access issues are usually caused by authentication or network problems.',
    steps: [
      '1. Check internet connection - Ensure stable connectivity',
      '2. Sign out completely - Exit Teams completely (right-click icon > Quit)',
      '3. Clear Teams cache - Delete Teams cache folder (%appdata%\\Microsoft\\Teams)',
      '4. Restart Teams - Open Teams and sign in again',
      '5. Check credentials - Verify correct email and password',
      '6. Verify MFA - If MFA is enabled, ensure you can authenticate',
      '7. Try Teams Web - Access teams.microsoft.com to verify account works',
      '8. Restart computer - If issue persists, restart your computer',
    ],
    keywords: ['teams', 'cannot access', 'sign in', 'connection', 'offline'],
    severity: 'high',
    estimatedResolutionTime: '15-30 minutes',
    affectedServices: ['Microsoft Teams'],
    preventionTips: [
      'Keep Teams updated to latest version',
      'Maintain stable internet connection',
      'Enable MFA for security',
    ],
  },

  {
    id: 'teams-no-audio-video',
    title: 'No Audio or Video in Teams Meetings',
    category: 'Microsoft Teams',
    subcategory: 'Meeting Issues',
    problem: 'Audio or video not working during Teams meetings',
    solution: 'Audio/video issues are usually caused by device settings or permissions.',
    steps: [
      '1. Check device settings - Go to Teams Settings > Devices',
      '2. Verify microphone - Ensure correct microphone is selected and not muted',
      '3. Verify camera - Ensure correct camera is selected and not disabled',
      '4. Check permissions - Windows may be blocking camera/microphone access',
      '5. Test devices - Use Teams device test call to verify audio/video',
      '6. Restart Teams - Close and reopen Teams',
      '7. Update drivers - Ensure audio/video drivers are up to date',
      '8. Test in browser - Try Teams Web to verify devices work',
    ],
    keywords: ['teams', 'audio', 'video', 'microphone', 'camera', 'meeting'],
    severity: 'high',
    estimatedResolutionTime: '10-20 minutes',
    affectedServices: ['Microsoft Teams'],
    preventionTips: [
      'Regularly test audio/video devices',
      'Keep device drivers updated',
      'Check Windows privacy settings',
    ],
  },

  // ============ SHAREPOINT ONLINE ============
  {
    id: 'sharepoint-access-denied',
    title: 'Access Denied to SharePoint Site',
    category: 'SharePoint Online',
    subcategory: 'Access Issues',
    problem: 'User gets "Access Denied" error when trying to access SharePoint',
    solution: 'Access denied errors are usually caused by missing permissions or site membership.',
    steps: [
      '1. Verify site membership - Check if user is added to the SharePoint site',
      '2. Check permissions - Verify user has appropriate permission level',
      '3. Clear browser cache - Clear cookies and cached data',
      '4. Try incognito mode - Test access in private/incognito browser window',
      '5. Try different browser - Test with Edge, Chrome, or Firefox',
      '6. Wait for sync - Permission changes can take 15-30 minutes to sync',
      '7. Contact admin - If issue persists, contact your IT administrator',
    ],
    keywords: ['sharepoint', 'access denied', 'permission', 'site', 'denied'],
    severity: 'high',
    estimatedResolutionTime: '10-30 minutes',
    affectedServices: ['SharePoint Online'],
    preventionTips: [
      'Verify site membership before accessing',
      'Regularly review user permissions',
      'Use appropriate permission levels',
    ],
  },

  {
    id: 'sharepoint-file-sync',
    title: 'SharePoint Files Not Syncing to Computer',
    category: 'SharePoint Online',
    subcategory: 'Sync Issues',
    problem: 'Files are not syncing from SharePoint to local computer',
    solution: 'Sync issues can be resolved by restarting sync or reconfiguring the sync folder.',
    steps: [
      '1. Check sync status - Look for sync icon in system tray',
      '2. Verify sync folder - Ensure sync folder is properly configured',
      '3. Restart OneDrive - Right-click OneDrive icon > Pause sync > Resume sync',
      '4. Check storage - Ensure you have enough local storage space',
      '5. Check file size - Files larger than 250GB cannot sync',
      '6. Verify permissions - Ensure you have read/write permissions',
      '7. Restart computer - If issue persists, restart your computer',
    ],
    keywords: ['sharepoint', 'sync', 'files', 'onedrive', 'not syncing'],
    severity: 'medium',
    estimatedResolutionTime: '15-30 minutes',
    affectedServices: ['SharePoint Online', 'OneDrive'],
  },

  // ============ ONEDRIVE ============
  {
    id: 'onedrive-sync-stuck',
    title: 'OneDrive Sync Stuck or Not Syncing',
    category: 'OneDrive',
    subcategory: 'Sync Issues',
    problem: 'OneDrive is stuck syncing or files are not syncing',
    solution: 'Stuck sync can usually be resolved by restarting the sync process.',
    steps: [
      '1. Check sync status - Look for sync icon in system tray',
      '2. Pause sync - Right-click OneDrive icon > Pause sync',
      '3. Wait 30 seconds - Let the pause complete',
      '4. Resume sync - Right-click OneDrive icon > Resume sync',
      '5. Check file size - Ensure files are not too large',
      '6. Check storage - Ensure you have enough OneDrive storage',
      '7. Restart OneDrive - Close and reopen OneDrive',
      '8. Restart computer - If issue persists, restart your computer',
    ],
    keywords: ['onedrive', 'sync', 'stuck', 'not syncing', 'files'],
    severity: 'medium',
    estimatedResolutionTime: '10-20 minutes',
    affectedServices: ['OneDrive'],
    preventionTips: [
      'Monitor OneDrive storage usage',
      'Keep files organized',
      'Regularly check sync status',
    ],
  },

  // ============ ENTRA ID / AZURE AD ============
  {
    id: 'entra-password-reset',
    title: 'Reset Your Password in Entra ID',
    category: 'Entra ID / Azure AD',
    subcategory: 'Account Management',
    problem: 'User needs to reset their password or forgot their password',
    solution: 'Passwords can be reset through the Entra ID portal or by contacting IT.',
    steps: [
      '1. Go to account.activedirectory.windowsazure.com',
      '2. Click "Can\'t access your account"',
      '3. Enter your username and complete the CAPTCHA',
      '4. Select verification method (email or phone)',
      '5. Verify your identity using the selected method',
      '6. Create a new password',
      '7. Sign in with your new password',
      '8. If you cannot reset, contact your IT administrator',
    ],
    keywords: ['password', 'reset', 'entra', 'azure ad', 'forgot password'],
    severity: 'high',
    estimatedResolutionTime: '5-10 minutes',
    affectedServices: ['Entra ID'],
    preventionTips: [
      'Use strong passwords',
      'Enable MFA for security',
      'Keep recovery email updated',
    ],
  },

  {
    id: 'entra-mfa-setup',
    title: 'Setup Multi-Factor Authentication (MFA)',
    category: 'Entra ID / Azure AD',
    subcategory: 'Security',
    problem: 'User needs to setup MFA or add authentication method',
    solution: 'MFA can be setup through the Entra ID portal in a few minutes.',
    steps: [
      '1. Go to myaccount.microsoft.com',
      '2. Click "Security info" in the left menu',
      '3. Click "Add sign-in method"',
      '4. Select authentication method (Authenticator app, Phone, Email)',
      '5. Follow the setup wizard for your chosen method',
      '6. Complete the verification process',
      '7. Test MFA by signing out and signing back in',
      '8. Save backup codes in a safe place',
    ],
    keywords: ['mfa', 'multi-factor', 'authentication', 'entra', 'security'],
    severity: 'medium',
    estimatedResolutionTime: '10-15 minutes',
    affectedServices: ['Entra ID'],
    preventionTips: [
      'Enable MFA for all accounts',
      'Use authenticator app when possible',
      'Keep backup codes safe',
    ],
  },

  // ============ GENERAL ============
  {
    id: 'general-slow-performance',
    title: 'Microsoft 365 Services Running Slow',
    category: 'General IT Support',
    subcategory: 'Performance',
    problem: 'Microsoft 365 services (Teams, Outlook, etc.) are running slowly',
    solution: 'Slow performance is usually caused by network issues or system resources.',
    steps: [
      '1. Check internet speed - Run a speed test at speedtest.net',
      '2. Close unnecessary apps - Close programs consuming resources',
      '3. Clear browser cache - Clear cookies and cached data',
      '4. Restart computer - Restart your computer to free up resources',
      '5. Check network - Ensure stable network connection',
      '6. Update software - Ensure all Microsoft 365 apps are updated',
      '7. Disable extensions - Browser extensions can slow down performance',
      '8. Contact IT - If issue persists, contact your IT administrator',
    ],
    keywords: ['slow', 'performance', 'lag', 'microsoft 365', 'speed'],
    severity: 'medium',
    estimatedResolutionTime: '15-30 minutes',
    affectedServices: ['All'],
    preventionTips: [
      'Keep software updated',
      'Monitor system resources',
      'Maintain stable internet connection',
      'Regularly restart computer',
    ],
  },

  {
    id: 'general-license-issue',
    title: 'License Not Assigned or License Error',
    category: 'General IT Support',
    subcategory: 'Licensing',
    problem: 'User is getting license errors or cannot access services',
    solution: 'License issues are usually caused by missing license assignment.',
    steps: [
      '1. Check license assignment - Admin Portal > Users > Check user license',
      '2. Assign license - If missing, assign appropriate Microsoft 365 license',
      '3. Wait for sync - License assignment can take 15-30 minutes to sync',
      '4. Sign out - Sign out of all Microsoft 365 services',
      '5. Sign in - Sign back in to Microsoft 365 services',
      '6. Restart apps - Close and reopen Microsoft 365 applications',
      '7. Verify access - Verify user can now access services',
      '8. Contact admin - If issue persists, contact IT administrator',
    ],
    keywords: ['license', 'error', 'not assigned', 'access denied', 'subscription'],
    severity: 'high',
    estimatedResolutionTime: '30-45 minutes',
    affectedServices: ['All'],
    preventionTips: [
      'Regularly audit license assignments',
      'Remove licenses from inactive users',
      'Monitor license usage',
    ],
  },
];

/**
 * tRPC router for KB seeding
 */
export const kbSeedingRouter = router({
  /**
   * Get all default KB articles
   */
  getDefaultArticles: protectedProcedure.query(() => {
    return DEFAULT_KB_ARTICLES;
  }),

  /**
   * Get KB articles by category
   */
  getArticlesByCategory: protectedProcedure
    .input(z.object({ category: z.string() }))
    .query(({ input }) => {
      return DEFAULT_KB_ARTICLES.filter((article) => article.category === input.category);
    }),

  /**
   * Search KB articles by keyword
   */
  searchArticles: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(({ input }) => {
      const query = input.query.toLowerCase();
      return DEFAULT_KB_ARTICLES.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.problem.toLowerCase().includes(query) ||
          article.keywords.some((k) => k.toLowerCase().includes(query))
      );
    }),

  /**
   * Get article by ID
   */
  getArticleById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return DEFAULT_KB_ARTICLES.find((article) => article.id === input.id);
    }),

  /**
   * Get categories
   */
  getCategories: protectedProcedure.query(() => {
    const categories = new Set(DEFAULT_KB_ARTICLES.map((a) => a.category));
    return Array.from(categories).sort();
  }),

  /**
   * Get article count
   */
  getArticleCount: protectedProcedure.query(() => {
    return DEFAULT_KB_ARTICLES.length;
  }),
});
