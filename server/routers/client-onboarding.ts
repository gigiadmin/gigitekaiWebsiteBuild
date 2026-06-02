import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { ENV } from "../_core/env";
import { notifyOwner } from "../_core/notification";
import { sendEmail } from "../_core/email";
import { getDb } from "../db";
import { clients, clientTimeline } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import axios from "axios";

// ============================================================================
// TYPES & VALIDATION
// ============================================================================

const ClientOnboardingInput = z.object({
  companyName: z.string().min(1, "Company name required"),
  companyEmail: z.string().min(1, "Company email domain required"),
  contactFirstName: z.string().min(1, "First name required"),
  contactLastName: z.string().min(1, "Last name required"),
  contactEmail: z.string().email("Valid email required"),
  contactPhone: z.string().min(10, "Valid phone required"),
  serviceType: z.string().min(1, "Service type required"),
  annualValue: z.number().min(0, "Annual value must be positive"),
});

// ============================================================================
// LOCAL DATABASE HELPERS
// ============================================================================

async function createClientRecord(input: {
  companyName: string;
  companyEmail: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
  serviceType: string;
  annualValue: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  // Extract domain from email or use as-is if it's already a domain
  const domain = input.companyEmail.includes("@")
    ? input.companyEmail.split("@")[1]
    : input.companyEmail;

  const result = await db.insert(clients).values({
    companyName: input.companyName,
    companyDomain: domain,
    serviceType: input.serviceType,
    annualContractValue: input.annualValue.toFixed(2),
    contactFirstName: input.contactFirstName,
    contactLastName: input.contactLastName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    status: "onboarding",
    onboardingStep: "submitted",
  });

  return result[0].insertId;
}

async function addTimelineEvent(clientId: number, event: string, description: string, metadata?: Record<string, any>) {
  const db = await getDb();
  if (!db) return;

  await db.insert(clientTimeline).values({
    clientId,
    event,
    description,
    metadata: metadata || null,
  });
}

// ============================================================================
// MICROSOFT GRAPH INTEGRATION
// ============================================================================

async function getGraphAccessToken(): Promise<string> {
  try {
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
          <h1>Welcome to GigitekAI!</h1>
        </div>
        
        <div class="content">
          <p>Hi ${input.contactName},</p>
          
          <p>Thank you for choosing GigitekAI as your Managed Services Provider. We're excited to partner with ${input.companyName} and help you achieve your IT goals.</p>
          
          <div class="section">
            <h2>What's Next?</h2>
            <p>Your onboarding journey has begun! Here's what to expect:</p>
            <ul>
              <li><strong>Kickoff Meeting:</strong> Scheduled for 2 days from now — check your calendar</li>
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
              <li><a href="https://gigitekai.com/knowledge-base">Knowledge Base</a></li>
              <li><a href="https://gigitekai.com/contact">Contact Us</a></li>
            </ul>
          </div>
          
          <div class="section">
            <p><strong>Have questions?</strong> Contact our onboarding team at <a href="mailto:support@gigitekai.com">support@gigitekai.com</a> or call (727) 382-6909.</p>
          </div>
        </div>
        
        <div class="footer">
          <p>GigitekAI | Microsoft 365 Architect & Managed Services Provider</p>
          <p>Phone: (727) 382-6909 | Email: support@gigitekai.com</p>
        </div>
      </body>
      </html>
    `;

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
  } catch (error: any) {
    if (error instanceof Error) {
      console.error("Error sending welcome email:", error.message);
      if ((error as any).response) {
        console.error("Graph Response:", (error as any).response.status, (error as any).response.data);
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
      console.warn("Teams webhook URL not configured — skipping Teams notification");
      return;
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
                    text: "NEW CLIENT ONBOARDING STARTED",
                    size: "large",
                    weight: "bolder",
                    color: "good",
                  },
                ],
              },
              {
                type: "FactSet",
                facts: [
                  { name: "Company:", value: input.companyName },
                  { name: "Contact:", value: input.contactName },
                  { name: "Email:", value: input.contactEmail },
                  { name: "Service Type:", value: input.serviceType },
                  { name: "Annual Value:", value: `$${input.annualValue.toLocaleString()}` },
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
                text: "Next Steps: Kickoff meeting scheduled, begin discovery phase",
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
    // Non-blocking — don't throw, just log
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

        // Step 1: Save client to local database
        const clientId = await createClientRecord(input);
        console.log("Client record created in DB, id:", clientId);

        await addTimelineEvent(clientId, "onboarding_started", `Client onboarding initiated for ${input.companyName}`);

        // Step 2: Get Graph access token for calendar + email
        const accessToken = await getGraphAccessToken();
        console.log("Graph access token obtained");

        // Step 3: Create Outlook calendar kickoff event
        let eventId: string | null = null;
        try {
          eventId = await createOutlookCalendarEvent({
            companyName: input.companyName,
            contactEmail: input.contactEmail,
            accessToken,
          });
          console.log("Calendar event created:", eventId);

          // Update client record with kickoff date
          const db = await getDb();
          if (db) {
            const kickoffDate = new Date();
            kickoffDate.setDate(kickoffDate.getDate() + 2);
            kickoffDate.setHours(10, 0, 0, 0);
            await db.update(clients)
              .set({ onboardingStep: "kickoff_scheduled", kickoffMeetingDate: kickoffDate.toISOString().slice(0, 19).replace("T", " ") })
              .where(eq(clients.id, clientId));
          }

          await addTimelineEvent(clientId, "kickoff_scheduled", "Kickoff meeting scheduled for 2 days from now", { eventId });
        } catch (calErr: any) {
          console.error("Calendar event creation failed (non-blocking):", calErr?.message);
          await addTimelineEvent(clientId, "calendar_failed", `Calendar event creation failed: ${calErr?.message}`);
        }

        // Step 4: Send welcome email via MS Graph
        try {
          await sendWelcomeEmail({
            contactEmail: input.contactEmail,
            contactName: `${input.contactFirstName} ${input.contactLastName}`,
            companyName: input.companyName,
            accessToken,
          });
          console.log("Welcome email sent");
          await addTimelineEvent(clientId, "welcome_email_sent", `Welcome email sent to ${input.contactEmail}`);
        } catch (emailErr: any) {
          console.error("Welcome email failed (non-blocking):", emailErr?.message);
          await addTimelineEvent(clientId, "email_failed", `Welcome email failed: ${emailErr?.message}`);
        }

        // Step 5: Send Teams notification (non-blocking)
        try {
          await sendTeamsNotification({
            companyName: input.companyName,
            contactName: `${input.contactFirstName} ${input.contactLastName}`,
            contactEmail: input.contactEmail,
            serviceType: input.serviceType,
            annualValue: input.annualValue,
          });
          console.log("Teams notification sent");
          await addTimelineEvent(clientId, "teams_notified", "Teams onboarding channel notified");
        } catch (teamsErr: any) {
          console.error("Teams notification failed (non-blocking):", teamsErr?.message);
        }

        // Step 6: Notify owner in Manus (non-blocking)
        try {
          await notifyOwner({
            title: `New Client Onboarding: ${input.companyName}`,
            content: `Client onboarding started for ${input.companyName} (${input.contactEmail}). Service Type: ${input.serviceType}. Annual Value: $${input.annualValue}. Client ID: ${clientId}`,
          });
        } catch (notifyErr: any) {
          console.error("Owner notification failed:", notifyErr?.message);
        }

        return {
          success: true,
          clientId,
          eventId,
          message: `Client onboarding initiated for ${input.companyName}. Record saved to database.`,
        };
      } catch (error: any) {
        console.error("Error during client onboarding:", error);
        throw new Error(
          `Onboarding failed: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  // List all clients
  listClients: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const allClients = await db
      .select()
      .from(clients)
      .orderBy(desc(clients.createdAt));

    return allClients;
  }),

  // Get single client with timeline
  getClient: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, input.id))
        .limit(1);

      if (!client) throw new Error("Client not found");

      const timeline = await db
        .select()
        .from(clientTimeline)
        .where(eq(clientTimeline.clientId, input.id))
        .orderBy(desc(clientTimeline.createdAt));

      return { ...client, timeline };
    }),

  // Update client status
  updateStatus: adminProcedure
    .input(z.object({
      id: z.number().int().positive(),
      status: z.enum(["pending", "onboarding", "active", "paused", "churned"]),
      onboardingStep: z.enum(["submitted", "kickoff_scheduled", "discovery", "implementation", "training", "completed"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const updateData: Record<string, any> = { status: input.status };
      if (input.onboardingStep) updateData.onboardingStep = input.onboardingStep;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.status === "active") updateData.onboardingCompletedAt = new Date().toISOString().slice(0, 19).replace("T", " ");

      await db.update(clients).set(updateData).where(eq(clients.id, input.id));

      await addTimelineEvent(input.id, "status_updated", `Status changed to ${input.status}${input.onboardingStep ? `, step: ${input.onboardingStep}` : ""}`);

      return { success: true };
    }),
});
