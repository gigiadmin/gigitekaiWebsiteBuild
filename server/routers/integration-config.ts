/**
 * Integration Configuration Metadata Router
 * 
 * Exposes integration configuration status (which integrations are configured)
 * WITHOUT exposing actual secrets or credentials.
 * 
 * Used by intake forms, dashboards, and external systems to determine
 * which integrations are available for use.
 */

import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const integrationConfigRouter = router({
  /**
   * Get all integration configuration status
   * Returns which integrations are configured (true/false) but NOT the actual credentials
   */
  getConfiguredIntegrations: publicProcedure.query(async () => {
    const integrations = {
      // Azure & Microsoft
      msGraph: {
        name: "Microsoft Graph API",
        configured: !!(process.env.MS_GRAPH_CLIENT_ID && process.env.MS_GRAPH_CLIENT_SECRET),
        category: "Microsoft",
        description: "Email, calendar, and Teams integration",
      },
      azureAd: {
        name: "Azure Active Directory",
        configured: !!(process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET),
        category: "Microsoft",
        description: "User authentication and directory",
      },
      azureArm: {
        name: "Azure ARM",
        configured: !!(process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET),
        category: "Microsoft",
        description: "Azure resource management",
      },
      azureSpeech: {
        name: "Azure Speech Services",
        configured: !!(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION),
        category: "Microsoft",
        description: "Speech-to-text and text-to-speech",
      },

      // Dynamics 365
      dynamics365: {
        name: "Dynamics 365",
        configured: !!process.env.D365_ORG_URL,
        category: "CRM",
        description: "Customer relationship management",
      },

      // Communication
      teamsBot: {
        name: "Teams Bot",
        configured: !!(process.env.TEAMS_BOT_APP_ID && process.env.TEAMS_BOT_CLIENT_SECRET),
        category: "Communication",
        description: "Microsoft Teams notifications and commands",
      },
      teamsWebhook: {
        name: "Teams Webhook",
        configured: !!process.env.TEAMS_WEBHOOK_URL,
        category: "Communication",
        description: "Teams channel notifications",
      },
      acs: {
        name: "Azure Communication Services",
        configured: !!process.env.ACS_CONNECTION_STRING,
        category: "Communication",
        description: "SMS, calling, and chat",
      },
      twilio: {
        name: "Twilio",
        configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
        category: "Communication",
        description: "SMS and voice calls",
      },

      // AI & Copilot
      copilotStudio: {
        name: "Copilot Studio",
        configured: !!process.env.COPILOT_STUDIO_ENVIRONMENT_ID,
        category: "AI",
        description: "Generative AI agents and automation",
      },
      azureOpenAi: {
        name: "Azure OpenAI",
        configured: !!process.env.AZURE_OPENAI_API_KEY,
        category: "AI",
        description: "GPT models and embeddings",
      },
      claudeAi: {
        name: "Claude AI",
        configured: !!process.env.CLAUDE_API_KEY,
        category: "AI",
        description: "Anthropic Claude models",
      },
      geminiAi: {
        name: "Google Gemini",
        configured: !!process.env.GEMINI_API_KEY,
        category: "AI",
        description: "Google Gemini models",
      },

      // Monitoring & Uptime
      uptimeRobot: {
        name: "UptimeRobot",
        configured: !!process.env.UPTIMEROBOT_API_KEY,
        category: "Monitoring",
        description: "Website uptime monitoring",
      },

      // Email & Marketing
      sendGrid: {
        name: "SendGrid",
        configured: !!process.env.SENDGRID_API_KEY,
        category: "Email",
        description: "Email delivery and campaigns",
      },
      newsApi: {
        name: "News API",
        configured: !!process.env.NEWS_API_KEY,
        category: "Data",
        description: "News and content aggregation",
      },

      // Payment & Commerce
      stripe: {
        name: "Stripe",
        configured: !!process.env.STRIPE_SECRET_KEY,
        category: "Payment",
        description: "Payment processing",
      },

      // Social & Marketing
      facebook: {
        name: "Facebook",
        configured: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
        category: "Social",
        description: "Facebook and Instagram integration",
      },
      linkedin: {
        name: "LinkedIn",
        configured: !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
        category: "Social",
        description: "LinkedIn posting and analytics",
      },
      twitter: {
        name: "Twitter/X",
        configured: !!(process.env.TWITTER_API_KEY && process.env.TWITTER_API_SECRET),
        category: "Social",
        description: "Twitter/X posting and monitoring",
      },

      // Project Management
      jira: {
        name: "Jira",
        configured: !!(process.env.JIRA_API_TOKEN && process.env.JIRA_EMAIL),
        category: "ProjectMgmt",
        description: "Issue tracking and project management",
      },
      atlassian: {
        name: "Atlassian",
        configured: !!(process.env.ATLASSIAN_API_TOKEN && process.env.ATLASSIAN_EMAIL),
        category: "ProjectMgmt",
        description: "Atlassian cloud services",
      },

      // ERP & Accounting
      xero: {
        name: "Xero",
        configured: !!(process.env.XERO_CLIENT_ID && process.env.XERO_CLIENT_SECRET),
        category: "Accounting",
        description: "Cloud accounting and invoicing",
      },
      hubspot: {
        name: "HubSpot",
        configured: !!process.env.HUBSPOT_API_KEY,
        category: "CRM",
        description: "Marketing automation and CRM",
      },

      // Domain & DNS
      godaddy: {
        name: "GoDaddy",
        configured: !!(process.env.GODADDY_API_KEY && process.env.GODADDY_API_SECRET),
        category: "Domain",
        description: "Domain and DNS management",
      },
      cloudflare: {
        name: "Cloudflare",
        configured: !!process.env.CLOUDFLARE_API_TOKEN,
        category: "Domain",
        description: "DNS, CDN, and security",
      },

      // Security & VPN
      nordLayer: {
        name: "NordLayer VPN",
        configured: !!process.env.NORDLAYER_API_KEY,
        category: "Security",
        description: "VPN and network security",
      },
      connectSecure: {
        name: "ConnectSecure",
        configured: !!process.env.CONNECTSECURE_API_KEY,
        category: "Security",
        description: "Security assessment and compliance",
      },

      // Meridian
      meridian: {
        name: "Meridian/OpenClaw",
        configured: !!process.env.MERIDIAN_API_TOKEN,
        category: "Integration",
        description: "Meridian agent orchestration",
      },
    };

    // Count by category
    const byCategory: Record<string, { total: number; configured: number }> = {};
    Object.values(integrations).forEach((integration) => {
      if (!byCategory[integration.category]) {
        byCategory[integration.category] = { total: 0, configured: 0 };
      }
      byCategory[integration.category].total += 1;
      if (integration.configured) {
        byCategory[integration.category].configured += 1;
      }
    });

    const totalConfigured = Object.values(integrations).filter((i) => i.configured).length;
    const totalAvailable = Object.keys(integrations).length;

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalConfigured,
        totalAvailable,
        percentConfigured: Math.round((totalConfigured / totalAvailable) * 100),
      },
      byCategory,
      integrations,
    };
  }),

  /**
   * Get Azure-specific configuration (for intake forms)
   */
  getAzureConfig: publicProcedure.query(async () => {
    return {
      msGraph: {
        configured: !!(process.env.MS_GRAPH_CLIENT_ID && process.env.MS_GRAPH_CLIENT_SECRET),
        tenantId: process.env.MS_GRAPH_TENANT_ID ? "configured" : "not set",
      },
      azureAd: {
        configured: !!(process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET),
        tenantId: process.env.AZURE_TENANT_ID ? "configured" : "not set",
      },
      azureSpeech: {
        configured: !!(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION),
        region: process.env.AZURE_SPEECH_REGION || "not set",
      },
      azureOpenAi: {
        configured: !!process.env.AZURE_OPENAI_API_KEY,
        endpoint: process.env.AZURE_OPENAI_ENDPOINT ? "configured" : "not set",
      },
    };
  }),

  /**
   * Get Teams-specific configuration (for intake forms)
   */
  getTeamsConfig: publicProcedure.query(async () => {
    return {
      teamsBot: {
        configured: !!(process.env.TEAMS_BOT_APP_ID && process.env.TEAMS_BOT_CLIENT_SECRET),
        appId: process.env.TEAMS_BOT_APP_ID ? "configured" : "not set",
        teamId: process.env.TEAMS_BOT_TEAM_ID ? "configured" : "not set",
        channelId: process.env.TEAMS_BOT_CHANNEL_ID ? "configured" : "not set",
      },
      teamsWebhook: {
        configured: !!process.env.TEAMS_WEBHOOK_URL,
      },
      msGraph: {
        configured: !!(process.env.MS_GRAPH_CLIENT_ID && process.env.MS_GRAPH_CLIENT_SECRET),
      },
    };
  }),

  /**
   * Get communication integrations (for intake forms)
   */
  getCommunicationConfig: publicProcedure.query(async () => {
    return {
      teamsBot: {
        configured: !!(process.env.TEAMS_BOT_APP_ID && process.env.TEAMS_BOT_CLIENT_SECRET),
      },
      teamsWebhook: {
        configured: !!process.env.TEAMS_WEBHOOK_URL,
      },
      acs: {
        configured: !!process.env.ACS_CONNECTION_STRING,
      },
      twilio: {
        configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
        phoneNumber: process.env.TWILIO_PHONE_NUMBER ? "configured" : "not set",
      },
      sendGrid: {
        configured: !!process.env.SENDGRID_API_KEY,
      },
    };
  }),
});
