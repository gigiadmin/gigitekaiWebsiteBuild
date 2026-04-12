/**
 * Seed script to populate default email templates
 * Run with: npx tsx seed-email-templates.mjs
 */
import { getDb } from "./server/db.ts";
import { emailTemplates } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";

const DEFAULT_TEMPLATES = [
  {
    name: "Ticket Response",
    subject: "Re: [TICKET #{{ticketId}}] {{ticketSubject}}",
    body: `<p>Hi {{customerName}},</p>
<p>Thank you for reaching out. We've received your support request and are looking into it.</p>
<p><strong>Ticket #{{ticketId}}</strong><br>
Subject: {{ticketSubject}}<br>
Priority: {{priority}}</p>
<p>Our team will get back to you shortly with an update.</p>
<p>Best regards,<br>
GigitekAI Support Team<br>
support@gigitekai.com</p>`,
    category: "ticket_response",
  },
  {
    name: "Follow-up",
    subject: "Follow-up: [TICKET #{{ticketId}}]",
    body: `<p>Hi {{customerName}},</p>
<p>We wanted to follow up on your support ticket to ensure we're on the right track.</p>
<p><strong>Ticket #{{ticketId}}</strong><br>
Subject: {{ticketSubject}}</p>
<p>If you have any additional information or questions, please reply to this email.</p>
<p>Best regards,<br>
GigitekAI Support Team<br>
support@gigitekai.com</p>`,
    category: "follow_up",
  },
  {
    name: "Resolution",
    subject: "Resolved: [TICKET #{{ticketId}}] {{ticketSubject}}",
    body: `<p>Hi {{customerName}},</p>
<p>Great news! We've successfully resolved your support ticket.</p>
<p><strong>Ticket #{{ticketId}}</strong><br>
Subject: {{ticketSubject}}<br>
Resolution: {{resolution}}</p>
<p>If you have any follow-up questions or need further assistance, please don't hesitate to reach out.</p>
<p>Best regards,<br>
GigitekAI Support Team<br>
support@gigitekai.com</p>`,
    category: "resolution",
  },
  {
    name: "General Inquiry",
    subject: "Re: Your Inquiry",
    body: `<p>Hi {{recipientName}},</p>
<p>Thank you for contacting GigitekAI. We appreciate your interest in our services.</p>
<p>{{customMessage}}</p>
<p>If you have any questions, feel free to reach out to us at support@gigitekai.com or call 609-676-4483.</p>
<p>Best regards,<br>
GigitekAI Support Team<br>
support@gigitekai.com</p>`,
    category: "general",
  },
];

async function seedTemplates() {
  try {
    const db = await getDb();
    if (!db) {
      console.error("Database connection failed");
      process.exit(1);
    }

    console.log("🌱 Seeding email templates...");

    for (const template of DEFAULT_TEMPLATES) {
      // Check if template already exists
      const existing = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.name, template.name))
        .limit(1);

      if (existing.length > 0) {
        console.log(`✓ Template "${template.name}" already exists, skipping`);
        continue;
      }

      // Insert template
      await db.insert(emailTemplates).values({
        name: template.name,
        subject: template.subject,
        body: template.body,
        category: template.category,
        createdBy: null,
      });

      console.log(`✓ Created template: "${template.name}"`);
    }

    console.log("✅ Email templates seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedTemplates();
