import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { ENV } from "../_core/env";
import { notifyOwner } from "../_core/notification";
import { sendEmail } from "../_core/email";
import { invokeLLM } from "../_core/llm";
import axios, { AxiosError } from "axios";

// ============================================================================
// TYPES & VALIDATION
// ============================================================================

const ClientOnboardingInput = z.object({
  companyName: z.string().min(1, "Company name required"),
  companyEmail: z.string().email("Valid email domain required"),
  contactFirstName: z.string().min(1, "First name required"),
  contactLastName: z.string().min(1, "Last name required"),
  contactEmail: z.string().email("Valid email required"),
  contactPhone: z.string().min(10, "Valid phone required"),
  serviceType: z.string().min(1, "Service type required"),
  annualValue: z.number().min(0, "Annual value must be positive"),
});

// ============================================================================
// HUBSPOT INTEGRATION
// ============================================================================

async function createHubSpotCompany(input: {
  companyName: string;
  companyEmail: string;
  annualValue: number;
  serviceType: string;
}) {
  try {
    if (!process.env.HUBSPOT_API_KEY) {
      throw new Error("HubSpot API key not configured");
    }

    const response = await axios.post(
      "https://api.hubapi.com/crm/v3/objects/companies",
      {
        properties: {
          name: input.companyName,
          domain: input.companyEmail.split("@")[1] || input.companyEmail,
          annualrevenue: input.annualValue,
          industry: "Technology",
          lifecyclestage: "customer",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUBSPOT_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.id;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error creating HubSpot company:", error.message);
      if (error.response) {
        console.error("HubSpot Response:", error.response.status, error.response.data);
      }
    }
    throw error;
  }
}

async function createHubSpotContact(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyId: string;
}) {
  try {
    if (!process.env.HUBSPOT_API_KEY) {
      throw new Error("HubSpot API key not configured");
    }

    const response = await axios.post(
      "https://api.hubapi.com/crm/v3/objects/contacts",
      {
        properties: {
          firstname: input.firstName,
          lastname: input.lastName,
          email: input.email,
          phone: input.phone,
          lifecyclestage: "customer",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUBSPOT_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const contactId = response.data.id;

    // Associate contact with company
    if (input.companyId) {
      await axios.post(
        `https://api.hubapi.com/crm/v4/objects/contacts/${contactId}/associations/companies/batch/create`,
        {
          inputs: [
            {
              id: input.companyId,
              type: "company",
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.HUBSPOT_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return contactId;
  } catch (error) {
    console.error("Error creating HubSpot contact:", error);
    throw error;
  }
}

// ============================================================================
// MICROSOFT GRAPH INTEGRATION
// ============================================================================

async function getGraphAccessToken(): Promise<string> {
  try {
    // Microsoft OAuth token endpoint requires URL-encoded form data, NOT JSON
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", ENV.msGraphClientId);
    params.append("client_secret", ENV.msGraphClientSecret);
    params.append("scope", "https://graph.microsoft.com/.default");

    const response = await axios.post(
      `https://login.microsoftonline.com/${ENV.msGraphTenantId}/oauth2/v2.0/token`,
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data.access_token;
  } catch (error: any) {
    console.error("Error getting Graph access token:", error?.response?.data || error?.message || error);
    throw error;
  }
}

async function createOutlookCalendarEvent(input: {
  companyName: string;
  contactEmail: string;
  accessToken: string;
}) {
  try {
    // Schedule kickoff meeting for 2 days from now at 10 AM
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 2);
    startTime.setHours(10, 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setHours(11, 0, 0, 0);

    // client_credentials flow cannot use /me/ - must use /users/{userId}
    const userEmail = "support@gigitekai.com";
    const response = await axios.post(
      `https://graph.microsoft.com/v1.0/users/${userEmail}/events`,
      {
        subject: `Kickoff Meeting: ${input.companyName}`,
        body: {
          contentType: "HTML",
          content: `
            <p>Welcome to GigitekAI!</p>
            <p>We're excited to begin your onboarding process. During this kickoff meeting, we'll:</p>
            <ul>
              <li>Review your service requirements</li>
              <li>Discuss implementation timeline</li>
              <li>Introduce your dedicated support team</li>
              <li>Answer any questions</li>
            </ul>
            <p>Looking forward to working with you!</p>
          `,
        },
        start: {
          dateTime: startTime.toISOString(),
          timeZone: "Eastern Standard Time",
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: "Eastern Standard Time",
        },
        attendees: [
          {
            emailAddress: {
              address: input.contactEmail,
              name: input.companyName,
            },
            type: "required",
          },
        ],
        isReminderOn: true,
        reminderMinutesBeforeStart: 15,
      },
      {
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.id;
  } catch (error) {
    console.error("Error creating calendar event:", error);
    throw error;
  }
}

async function sendWelcomeEmail(input: {
  contactEmail: string;
  contactName: string;
  companyName: string;
  accessToken: string;
}) {
  try {
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .header { background-color: #0A0E1A; color: #00D4FF; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .section { margin-bottom: 20px; }
          .button { background-color: #00D4FF; color: #0A0E1A; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px; }
          .footer { background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to GigitekAI! 🚀</h1>
        </div>
        
        <div class="content">
          <p>Hi ${input.contactName},</p>
          
          <p>Thank you for choosing GigitekAI as your Managed Services Provider. We're excited to partner with ${input.companyName} and help you achieve your IT goals.</p>
          
          <div class="section">
            <h2>What's Next?</h2>
            <p>Your onboarding journey has begun! Here's what to expect:</p>
            <ul>
              <li><strong>Kickoff Meeting:</strong> We'll schedule a meeting to discuss your requirements and timeline</li>
              <li><strong>Discovery Phase:</strong> Our team will assess your current infrastructure</li>
              <li><strong>Implementation:</strong> We'll deploy and configure your services</li>
              <li><strong>Training:</strong> Your team will receive comprehensive training</li>
              <li><strong>Support:</strong> Ongoing 24/7 support from our expert team</li>
            </ul>
          </div>
          
          <div class="section">
            <h2>Quick Links</h2>
            <ul>
              <li><a href="https://gigitekai.com/support">Support Portal</a></li>
              <li><a href="https://gigitekai.com/documentation">Documentation</a></li>
              <li><a href="https://gigitekai.com/faq">FAQ</a></li>
            </ul>
          </div>
          
          <div class="section">
            <p><strong>Have questions?</strong> Contact our onboarding team at <a href="mailto:onboarding@gigitekai.com">onboarding@gigitekai.com</a></p>
          </div>
        </div>
        
        <div class="footer">
          <p>GigitekAI | Microsoft 365 Architect & Managed Services Provider</p>
          <p>Phone: (727) 382-6909 | Email: support@gigitekai.com</p>
        </div>
      </body>
      </html>
    `;

    // client_credentials flow cannot use /me/ - must use /users/{userId}
    const userEmail = "support@gigitekai.com";
    await axios.post(
      `https://graph.microsoft.com/v1.0/users/${userEmail}/sendMail`,
      {
        message: {
          subject: "Welcome to GigitekAI - Your Onboarding Begins!",
          body: {
            contentType: "HTML",
            content: htmlBody,
          },
          toRecipients: [
            {
              emailAddress: {
                address: input.contactEmail,
                name: input.contactName,
              },
            },
          ],
        },
        saveToSentItems: true,
      },
      {
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error sending welcome email:", error.message);
      if (error.response) {
        console.error("Graph Response:", error.response.status, error.response.data);
      }
    }
    throw error;
  }
}

// ============================================================================
// TEAMS NOTIFICATION
// ============================================================================

async function sendTeamsNotification(input: {
  companyName: string;
  contactName: string;
  contactEmail: string;
  serviceType: string;
  annualValue: number;
}) {
  try {
    if (!process.env.TEAMS_WEBHOOK_URL) {
      throw new Error("Teams webhook URL not configured");
    }

    const teamsMessage = {
      type: "message",
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          content: {
            schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.4",
            body: [
              {
                type: "Container",
                style: "emphasis",
                items: [
                  {
                    type: "TextBlock",
                    text: "🎉 NEW CLIENT ONBOARDING STARTED",
                    size: "large",
                    weight: "bolder",
                    color: "good",
                  },
                ],
              },
              {
                type: "FactSet",
                facts: [
                  {
                    name: "Company:",
                    value: input.companyName,
                  },
                  {
                    name: "Contact:",
                    value: input.contactName,
                  },
                  {
                    name: "Email:",
                    value: input.contactEmail,
                  },
                  {
                    name: "Service Type:",
                    value: input.serviceType,
                  },
                  {
                    name: "Annual Value:",
                    value: `$${input.annualValue.toLocaleString()}`,
                  },
                  {
                    name: "Start Date:",
                    value: new Date().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }),
                  },
                ],
              },
              {
                type: "TextBlock",
                text: "Next Steps: Schedule kickoff meeting, begin discovery phase",
                wrap: true,
                spacing: "medium",
                weight: "bolder",
              },
            ],
          },
        },
      ],
    };

    await axios.post(process.env.TEAMS_WEBHOOK_URL, teamsMessage);
  } catch (error) {
    console.error("Error sending Teams notification:", error);
    throw error;
  }
}

// ============================================================================
// TRPC PROCEDURES
// ============================================================================

export const clientOnboardingRouter = router({
  startOnboarding: adminProcedure
    .input(ClientOnboardingInput)
    .mutation(async ({ input }) => {
      try {
        console.log("Starting client onboarding for:", input.companyName);

        // Step 1: Create HubSpot company
        const companyId = await createHubSpotCompany({
          companyName: input.companyName,
          companyEmail: input.companyEmail,
          annualValue: input.annualValue,
          serviceType: input.serviceType,
        });
        console.log("HubSpot company created:", companyId);

        // Step 2: Create HubSpot contact
        const contactId = await createHubSpotContact({
          firstName: input.contactFirstName,
          lastName: input.contactLastName,
          email: input.contactEmail,
          phone: input.contactPhone,
          companyId,
        });
        console.log("HubSpot contact created:", contactId);

        // Step 3: Get Graph access token
        const accessToken = await getGraphAccessToken();
        console.log("Graph access token obtained");

        // Step 4: Create Outlook calendar event
        const eventId = await createOutlookCalendarEvent({
          companyName: input.companyName,
          contactEmail: input.contactEmail,
          accessToken,
        });
        console.log("Calendar event created:", eventId);

        // Step 5: Send welcome email
        await sendWelcomeEmail({
          contactEmail: input.contactEmail,
          contactName: `${input.contactFirstName} ${input.contactLastName}`,
          companyName: input.companyName,
          accessToken,
        });
        console.log("Welcome email sent");

        // Step 6: Send Teams notification
        await sendTeamsNotification({
          companyName: input.companyName,
          contactName: `${input.contactFirstName} ${input.contactLastName}`,
          contactEmail: input.contactEmail,
          serviceType: input.serviceType,
          annualValue: input.annualValue,
        });
        console.log("Teams notification sent");

        // Step 7: Notify owner
        await notifyOwner({
          title: `New Client Onboarding: ${input.companyName}`,
          content: `Client onboarding started for ${input.companyName} (${input.contactEmail}). Service Type: ${input.serviceType}. Annual Value: $${input.annualValue}`,
        });

        return {
          success: true,
          companyId,
          contactId,
          eventId,
          message: `Client onboarding initiated for ${input.companyName}`,
        };
      } catch (error) {
        console.error("Error during client onboarding:", error);
        if (error instanceof Error && error.response) {
          console.error("Full API Response:", error.response.status, error.response.data);
        }
        throw new Error(
          `Onboarding failed: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),
});
