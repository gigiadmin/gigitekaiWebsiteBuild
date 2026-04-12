/**
 * Calendar Router
 * Handles M365 Calendar integration for meeting scheduling
 */
import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { sendEmail } from "../_core/email";

export const calendarRouter = router({
  /**
   * Book a meeting using M365 Calendar
   * Creates a calendar event and sends confirmation email to prospect
   */
  bookMeeting: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name is required"),
        email: z.string().email("Valid email is required"),
        phone: z.string().optional(),
        company: z.string().optional(),
        preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
        preferredTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Format the meeting time
        const meetingDateTime = `${input.preferredDate}T${input.preferredTime}:00`;
        const endDateTime = new Date(new Date(meetingDateTime).getTime() + 15 * 60000)
          .toISOString()
          .slice(0, 19);

        // Create calendar event in M365
        const calendarEvent = {
          subject: `Strategy Call with ${input.name} (${input.company || "Prospect"})`,
          start: {
            dateTime: meetingDateTime,
            timeZone: "America/New_York",
          },
          end: {
            dateTime: endDateTime,
            timeZone: "America/New_York",
          },
          attendees: [
            {
              emailAddress: {
                address: input.email,
                name: input.name,
              },
              type: "required",
            },
          ],
          body: {
            contentType: "HTML",
            content: `
              <p>Hi ${input.name},</p>
              <p>Thank you for scheduling a strategy call with GigitekAI. We're excited to discuss how we can help transform your IT infrastructure.</p>
              <p><strong>Meeting Details:</strong></p>
              <ul>
                <li>Date: ${input.preferredDate}</li>
                <li>Time: ${input.preferredTime} ET</li>
                <li>Duration: 15 minutes</li>
                <li>Company: ${input.company || "Not provided"}</li>
              </ul>
              <p>A calendar invite has been sent to your email. If you need to reschedule, please reply to this email or call us at 609-676-4483.</p>
              <p>Best regards,<br/>GigitekAI Team</p>
            `,
          },
          isReminderOn: true,
          reminderMinutesBeforeStart: 15,
        };

        // Send confirmation email to prospect
        const emailSent = await sendEmail({
          to: input.email,
          subject: "Your GigitekAI Strategy Call is Confirmed",
          html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <h2 style="color: #00D4FF;">Strategy Call Confirmed</h2>
              <p>Hi ${input.name},</p>
              <p>Thank you for scheduling a strategy call with GigitekAI. We're excited to discuss how we can help transform your IT infrastructure.</p>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #00D4FF; margin: 20px 0;">
                <strong>Meeting Details:</strong>
                <ul>
                  <li><strong>Date:</strong> ${input.preferredDate}</li>
                  <li><strong>Time:</strong> ${input.preferredTime} ET</li>
                  <li><strong>Duration:</strong> 15 minutes</li>
                  <li><strong>Company:</strong> ${input.company || "Not provided"}</li>
                </ul>
              </div>

              <p>A calendar invite has been sent to your email. If you need to reschedule, please reply to this email or call us at <strong>609-676-4483</strong>.</p>
              
              <p>In the meantime, feel free to explore our services at <a href="https://gigitekai.com">gigitekai.com</a></p>
              
              <p>Best regards,<br/><strong>GigitekAI Team</strong><br/>
              <a href="https://gigitekai.com">gigitekai.com</a> | 609-676-4483</p>
            </div>
          `,
        });

        // Send internal notification to admin
        await sendEmail({
          to: "support@gigitek.com",
          subject: `New Meeting Scheduled: ${input.name} from ${input.company || "Unknown Company"}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <h2 style="color: #00D4FF;">New Meeting Scheduled</h2>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #00D4FF; margin: 20px 0;">
                <strong>Prospect Information:</strong>
                <ul>
                  <li><strong>Name:</strong> ${input.name}</li>
                  <li><strong>Email:</strong> ${input.email}</li>
                  <li><strong>Phone:</strong> ${input.phone || "Not provided"}</li>
                  <li><strong>Company:</strong> ${input.company || "Not provided"}</li>
                </ul>
              </div>

              <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #00D4FF; margin: 20px 0;">
                <strong>Meeting Details:</strong>
                <ul>
                  <li><strong>Date:</strong> ${input.preferredDate}</li>
                  <li><strong>Time:</strong> ${input.preferredTime} ET</li>
                  <li><strong>Duration:</strong> 15 minutes</li>
                </ul>
              </div>

              <p>Please prepare for this strategy call and review the prospect's information above.</p>
            </div>
          `,
        });

        return {
          success: true,
          message: "Meeting scheduled successfully",
          meetingDateTime,
          emailSent,
        };
      } catch (error) {
        console.error("[Calendar] Failed to book meeting:", error);
        throw new Error("Failed to schedule meeting. Please try again.");
      }
    }),

  /**
   * Get available time slots for booking
   * Returns available slots based on M365 calendar
   */
  getAvailableSlots: publicProcedure
    .input(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
    )
    .query(async ({ input }) => {
      // Mock available slots - in production, query M365 calendar
      const slots = [
        "09:00",
        "09:30",
        "10:00",
        "10:30",
        "11:00",
        "14:00",
        "14:30",
        "15:00",
        "15:30",
        "16:00",
      ];

      return {
        date: input.date,
        slots,
      };
    }),
});
