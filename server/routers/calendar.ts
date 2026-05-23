/**
 * Calendar Router
 * Handles M365 Calendar integration for meeting scheduling
 */
import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { sendEmail } from "../_core/email";
import { getMsGraphToken } from "../_core/email";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { meetingBookings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

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
        timezone: z.string().optional().default("America/New_York"),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const timezone = input.timezone || "America/New_York";
        // Format the meeting time
        // Keep local time format (no UTC conversion) since timeZone is specified separately in the event
        const meetingDateTime = `${input.preferredDate}T${input.preferredTime}:00`;
        const [hours, minutes] = input.preferredTime.split(":").map(Number);
        const endMinutes = minutes + 15;
        const endHours = hours + Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        const endTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;
        const endDateTime = `${input.preferredDate}T${endTime}:00`;

        // Friendly timezone abbreviation for display
        const tzAbbr: Record<string, string> = {
          "America/New_York": "ET",
          "America/Chicago": "CT",
          "America/Denver": "MT",
          "America/Los_Angeles": "PT",
          "America/Anchorage": "AKT",
          "Pacific/Honolulu": "HT",
        };
        const tzLabel = tzAbbr[timezone] || timezone;

        // Create calendar event in M365
        const calendarEvent = {
          subject: `Strategy Call with ${input.name} (${input.company || "Prospect"})`,
          start: {
            dateTime: meetingDateTime,
            timeZone: timezone,
          },
          end: {
            dateTime: endDateTime,
            timeZone: timezone,
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
                <li>Time: ${input.preferredTime} ${tzLabel}</li>
                <li>Duration: 15 minutes</li>
                <li>Company: ${input.company || "Not provided"}</li>
              </ul>
              ${input.notes ? `<p><strong>Your Notes:</strong></p><p>${input.notes.replace(/\n/g, "<br/>")}</p>` : ""}
              <p>A calendar invite has been sent to your email. If you need to reschedule, please reply to this email or call us at (727) 382-5776.</p>
              <p>Best regards,<br/>GigitekAI Team</p>
            `,
          },
          isReminderOn: true,
          reminderMinutesBeforeStart: 15,
        };

        // Create event in M365 calendar using Microsoft Graph API
        console.log(`[Calendar] Attempting to create calendar event for ${input.name} (${input.email}) on ${meetingDateTime}`);
        const token = await getMsGraphToken();
        if (token) {
          console.log(`[Calendar] Got MS Graph token (length: ${token.length}), calling Calendar API...`);
          try {
            const calendarPayload = JSON.stringify(calendarEvent);
            console.log(`[Calendar] Event payload: ${calendarPayload.substring(0, 200)}...`);
            
            const calendarResponse = await fetch(
              `https://graph.microsoft.com/v1.0/users/harry@gigitekai.com/calendar/events`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: calendarPayload,
              }
            );

            const responseText = await calendarResponse.text();
            console.log(`[Calendar] Graph API response status: ${calendarResponse.status} ${calendarResponse.statusText}`);
            console.log(`[Calendar] Graph API response body: ${responseText.substring(0, 500)}`);

            if (calendarResponse.ok) {
              const createdEvent = JSON.parse(responseText);
              console.log(`[Calendar] ✅ Successfully created event in M365 calendar. Event ID: ${createdEvent.id}`);
            } else {
              console.error(
                `[Calendar] ❌ Failed to create M365 calendar event (${calendarResponse.status} ${calendarResponse.statusText}): ${responseText}`
              );
              // Check for common permission errors
              if (calendarResponse.status === 403) {
                console.error(`[Calendar] 403 Forbidden - Check that Calendars.ReadWrite application permission is granted in Azure App Registration (portal.azure.com)`);
              } else if (calendarResponse.status === 404) {
                console.error(`[Calendar] 404 Not Found - User harry@gigitekai.com may not exist or have a mailbox`);
              } else if (calendarResponse.status === 401) {
                console.error(`[Calendar] 401 Unauthorized - MS Graph token may be invalid or missing Calendar permissions`);
              }
            }
          } catch (error) {
            console.error("[Calendar] Error creating M365 calendar event:", error);
          }
        } else {
          console.warn(
            "[Calendar] ⚠️ Could not obtain MS Graph token - calendar event not created. Check MS_GRAPH_CLIENT_ID, MS_GRAPH_CLIENT_SECRET, MS_GRAPH_TENANT_ID environment variables."
          );
        }


        // Format time for display (e.g. "11:00" -> "11:00 AM")
        const [h, m] = input.preferredTime.split(":").map(Number);
        const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
        const displayAmPm = h >= 12 ? "PM" : "AM";
        const displayTime = `${displayHour}:${String(m).padStart(2, "0")} ${displayAmPm} ${tzLabel}`;

        // Format date for display (e.g. "2026-04-23" -> "Thursday, April 23, 2026")
        const dateObj = new Date(input.preferredDate + "T12:00:00");
        const displayDate = dateObj.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

        // Send confirmation email to prospect
        const emailSent = await sendEmail({
          to: input.email,
          subject: "Your GigitekAI Strategy Call is Confirmed ✓",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #0a0e1a 0%, #1a1f3a 100%); padding: 32px 30px; border-radius: 8px 8px 0 0; text-align: center;">
                <div style="color: #00d4ff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">GigitekAI</div>
                <div style="color: #8892a4; font-size: 13px; margin-top: 4px;">Powering the Next Generation of Enterprise Technology</div>
                <div style="color: #00d4ff; font-size: 36px; margin-top: 16px;">✓</div>
                <div style="color: white; font-size: 20px; font-weight: 600; margin-top: 8px;">Meeting Confirmed!</div>
              </div>
              <!-- Body -->
              <div style="background: #f8f9fa; padding: 32px 30px;">
                <p style="color: #333; font-size: 16px; margin-top: 0;">Hi ${input.name},</p>
                <p style="color: #333; font-size: 15px; line-height: 1.6;">Your 15-minute strategy call with GigitekAI has been confirmed. We look forward to discussing how we can help transform your IT infrastructure.</p>
                <!-- Meeting Details Box -->
                <div style="background: white; border-left: 4px solid #00d4ff; padding: 20px 24px; margin: 24px 0; border-radius: 0 6px 6px 0; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
                  <div style="font-weight: 700; color: #0a0e1a; font-size: 15px; margin-bottom: 14px;">📅 Your Meeting Details</div>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 7px 0; color: #666; font-size: 14px; width: 40%;">Date</td><td style="padding: 7px 0; color: #333; font-size: 14px; font-weight: 600;">${displayDate}</td></tr>
                    <tr style="border-top: 1px solid #f0f0f0;"><td style="padding: 7px 0; color: #666; font-size: 14px;">Time</td><td style="padding: 7px 0; color: #333; font-size: 14px; font-weight: 600;">${displayTime}</td></tr>
                    <tr style="border-top: 1px solid #f0f0f0;"><td style="padding: 7px 0; color: #666; font-size: 14px;">Duration</td><td style="padding: 7px 0; color: #333; font-size: 14px; font-weight: 600;">15 minutes</td></tr>
                    <tr style="border-top: 1px solid #f0f0f0;"><td style="padding: 7px 0; color: #666; font-size: 14px;">Company</td><td style="padding: 7px 0; color: #333; font-size: 14px; font-weight: 600;">${input.company || "Not provided"}</td></tr>
                  </table>
                </div>
                ${input.notes ? `
                <div style="background: #e8f7fb; border-radius: 6px; padding: 16px 20px; margin: 0 0 24px;">
                  <div style="font-weight: 700; color: #0a0e1a; font-size: 14px; margin-bottom: 6px;">💡 Your Interest Areas</div>
                  <div style="color: #333; font-size: 14px; line-height: 1.6;">${input.notes.replace(/\n/g, "<br/>")}</div>
                </div>
                ` : ""}
                <p style="color: #333; font-size: 15px; line-height: 1.6;"><strong>What to expect:</strong> We'll review your current IT environment, discuss your goals, and share tailored recommendations — all in 15 minutes.</p>
                <p style="color: #555; font-size: 14px; line-height: 1.6;">Need to reschedule? Simply reply to this email or call us at <strong>(727) 382-5776</strong>. We're happy to find a time that works for you.</p>
              </div>
              <!-- Footer -->
              <div style="background: #0a0e1a; padding: 20px 30px; border-radius: 0 0 8px 8px; text-align: center;">
                <p style="color: #8892a4; font-size: 12px; margin: 0;">GigitekAI LLC &nbsp;|&nbsp; (727) 382-5776 &nbsp;|&nbsp; support@gigitekai.com</p>
                <p style="margin: 6px 0 0;"><a href="https://gigitekai.com" style="color: #00d4ff; font-size: 12px; text-decoration: none;">gigitekai.com</a></p>
              </div>
            </div>
          `,
        });

        // Send internal notification to admin
        await sendEmail({
          to: "support@gigitekai.com",
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
                  <li><strong>Time:</strong> ${input.preferredTime} ${tzLabel}</li>
                  <li><strong>Duration:</strong> 15 minutes</li>
                </ul>
              </div>

              <p>Please prepare for this strategy call and review the prospect's information above.</p>
            </div>
          `,
        });

        // Generate a unique cancel token for this booking
        const cancelToken = randomBytes(32).toString("hex");

        // Store booking in database
        let bookingId: number | undefined;
        try {
          const dbConn = await getDb();
          if (!dbConn) throw new Error("DB not available");
          const result = await dbConn.insert(meetingBookings).values({
            name: input.name,
            email: input.email,
            phone: input.phone,
            company: input.company,
            meetingDate: input.preferredDate,
            meetingTime: input.preferredTime,
            notes: input.notes,
            status: "confirmed",
            cancelToken,
            m365EventId: undefined,
          }).$returningId();
          bookingId = (result[0] as any)?.id;
          console.log(`[Calendar] Booking saved to DB with ID: ${bookingId}`);
        } catch (dbError) {
          console.error("[Calendar] Failed to save booking to DB:", dbError);
          // Don't throw — still proceed with email/calendar even if DB fails
        }

        // Build cancel/reschedule URL
        const baseUrl = "https://gigitekai.com";
        const cancelUrl = `${baseUrl}/cancel-meeting?token=${cancelToken}`;
        const rescheduleUrl = `${baseUrl}/reschedule-meeting?token=${cancelToken}`;

        // Re-send confirmation email with cancel/reschedule links
        await sendEmail({
          to: input.email,
          subject: "Your GigitekAI Strategy Call is Confirmed ✓",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #0a0e1a 0%, #1a1f3a 100%); padding: 32px 30px; border-radius: 8px 8px 0 0; text-align: center;">
                <div style="color: #00d4ff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">GigitekAI</div>
                <div style="color: #8892a4; font-size: 13px; margin-top: 4px;">Powering the Next Generation of Enterprise Technology</div>
                <div style="color: #00d4ff; font-size: 36px; margin-top: 16px;">✓</div>
                <div style="color: white; font-size: 20px; font-weight: 600; margin-top: 8px;">Meeting Confirmed!</div>
              </div>
              <!-- Body -->
              <div style="background: #f8f9fa; padding: 32px 30px;">
                <p style="color: #333; font-size: 16px; margin-top: 0;">Hi ${input.name},</p>
                <p style="color: #333; font-size: 15px; line-height: 1.6;">Your 15-minute strategy call with GigitekAI has been confirmed. We look forward to discussing how we can help transform your IT infrastructure.</p>
                <!-- Meeting Details Box -->
                <div style="background: white; border-left: 4px solid #00d4ff; padding: 20px 24px; margin: 24px 0; border-radius: 0 6px 6px 0; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
                  <div style="font-weight: 700; color: #0a0e1a; font-size: 15px; margin-bottom: 14px;">📅 Your Meeting Details</div>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 7px 0; color: #666; font-size: 14px; width: 40%;">Date</td><td style="padding: 7px 0; color: #333; font-size: 14px; font-weight: 600;">${displayDate}</td></tr>
                    <tr style="border-top: 1px solid #f0f0f0;"><td style="padding: 7px 0; color: #666; font-size: 14px;">Time</td><td style="padding: 7px 0; color: #333; font-size: 14px; font-weight: 600;">${displayTime}</td></tr>
                    <tr style="border-top: 1px solid #f0f0f0;"><td style="padding: 7px 0; color: #666; font-size: 14px;">Duration</td><td style="padding: 7px 0; color: #333; font-size: 14px; font-weight: 600;">15 minutes</td></tr>
                    <tr style="border-top: 1px solid #f0f0f0;"><td style="padding: 7px 0; color: #666; font-size: 14px;">Company</td><td style="padding: 7px 0; color: #333; font-size: 14px; font-weight: 600;">${input.company || "Not provided"}</td></tr>
                  </table>
                </div>
                ${input.notes ? `
                <div style="background: #e8f7fb; border-radius: 6px; padding: 16px 20px; margin: 0 0 24px;">
                  <div style="font-weight: 700; color: #0a0e1a; font-size: 14px; margin-bottom: 6px;">💡 Your Interest Areas</div>
                  <div style="color: #333; font-size: 14px; line-height: 1.6;">${input.notes.replace(/\n/g, "<br/>")}</div>
                </div>
                ` : ""}
                <p style="color: #333; font-size: 15px; line-height: 1.6;"><strong>What to expect:</strong> We'll review your current IT environment, discuss your goals, and share tailored recommendations — all in 15 minutes.</p>
                <!-- Cancel/Reschedule Links -->
                <div style="background: white; border: 1px solid #e0e0e0; border-radius: 6px; padding: 16px 20px; margin: 20px 0; text-align: center;">
                  <p style="color: #555; font-size: 13px; margin: 0 0 12px;">Need to make a change?</p>
                  <a href="${rescheduleUrl}" style="background: #00d4ff; color: #0a0e1a; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 13px; margin-right: 8px; display: inline-block;">Reschedule</a>
                  <a href="${cancelUrl}" style="background: transparent; color: #e53e3e; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 13px; border: 1px solid #e53e3e; display: inline-block;">Cancel Meeting</a>
                </div>
                <p style="color: #555; font-size: 14px; line-height: 1.6;">Questions? Reply to this email or call us at <strong>(727) 382-5776</strong>.</p>
              </div>
              <!-- Footer -->
              <div style="background: #0a0e1a; padding: 20px 30px; border-radius: 0 0 8px 8px; text-align: center;">
                <p style="color: #8892a4; font-size: 12px; margin: 0;">GigitekAI LLC &nbsp;|&nbsp; (727) 382-5776 &nbsp;|&nbsp; support@gigitekai.com</p>
                <p style="margin: 6px 0 0;"><a href="https://gigitekai.com" style="color: #00d4ff; font-size: 12px; text-decoration: none;">gigitekai.com</a></p>
              </div>
            </div>
          `,
        });

        return {
          success: true,
          message: "Meeting scheduled successfully",
          meetingDateTime,
          emailSent,
          bookingId,
        };
      } catch (error) {
        console.error("[Calendar] Failed to book meeting:", error);
        throw new Error("Failed to schedule meeting. Please try again.");
      }
    }),

  /**
   * Cancel a meeting using a cancel token
   */
  cancelMeeting: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const dbConn = await getDb();
      if (!dbConn) throw new Error("Database not available.");
      const booking = await dbConn
        .select()
        .from(meetingBookings)
        .where(eq(meetingBookings.cancelToken, input.token))
        .limit(1);

      if (!booking.length) throw new Error("Invalid or expired cancel link.");
      const b = booking[0];
      if (b.status === "cancelled") throw new Error("This meeting has already been cancelled.");

      // Cancel M365 calendar event if we have the event ID
      if (b.m365EventId) {
        try {
          const token = await getMsGraphToken();
          if (token) {
            await fetch(
              `https://graph.microsoft.com/v1.0/users/harry@gigitekai.com/calendar/events/${b.m365EventId}`,
              { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
            );
            console.log(`[Calendar] Deleted M365 event ${b.m365EventId}`);
          }
        } catch (err) {
          console.error("[Calendar] Failed to delete M365 event:", err);
        }
      }

      // Update DB status
      await dbConn
        .update(meetingBookings)
        .set({ status: "cancelled", cancelledAt: new Date() })
        .where(eq(meetingBookings.id, b.id));

      // Send cancellation confirmation email
      await sendEmail({
        to: b.email,
        subject: "Your GigitekAI Strategy Call Has Been Cancelled",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0a0e1a 0%, #1a1f3a 100%); padding: 32px 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <div style="color: #00d4ff; font-size: 28px; font-weight: 700;">GigitekAI</div>
              <div style="color: #8892a4; font-size: 13px; margin-top: 4px;">Powering the Next Generation of Enterprise Technology</div>
            </div>
            <div style="background: #f8f9fa; padding: 32px 30px;">
              <p style="color: #333; font-size: 16px;">Hi ${b.name},</p>
              <p style="color: #333; font-size: 15px; line-height: 1.6;">Your strategy call scheduled for <strong>${b.meetingDate} at ${b.meetingTime} EST</strong> has been cancelled.</p>
              <p style="color: #555; font-size: 14px; line-height: 1.6;">We hope to connect with you in the future. To book a new call, visit <a href="https://gigitekai.com" style="color: #00d4ff;">gigitekai.com</a>.</p>
              <p style="color: #555; font-size: 14px;">Questions? Call us at <strong>(727) 382-5776</strong> or email support@gigitekai.com.</p>
            </div>
            <div style="background: #0a0e1a; padding: 20px 30px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="color: #8892a4; font-size: 12px; margin: 0;">GigitekAI LLC &nbsp;|&nbsp; (727) 382-5776 &nbsp;|&nbsp; support@gigitekai.com</p>
            </div>
          </div>
        `,
      });

      // Notify admin
      await sendEmail({
        to: "support@gigitekai.com",
        subject: `Meeting Cancelled: ${b.name} (${b.meetingDate} ${b.meetingTime})`,
        html: `<p><strong>${b.name}</strong> (${b.email}) cancelled their strategy call scheduled for ${b.meetingDate} at ${b.meetingTime} EST.</p>`,
      });

      return { success: true, message: "Meeting cancelled successfully." };
    }),

  /**
   * Get booking details by cancel token (for reschedule page)
   */
  getBookingByToken: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ input }) => {
      const dbConn = await getDb();
      if (!dbConn) throw new Error("Database not available.");
      const booking = await dbConn
        .select()
        .from(meetingBookings)
        .where(eq(meetingBookings.cancelToken, input.token))
        .limit(1);

      if (!booking.length) throw new Error("Invalid or expired link.");
      const b = booking[0];
      return {
        id: b.id,
        name: b.name,
        email: b.email,
        company: b.company,
        meetingDate: b.meetingDate,
        meetingTime: b.meetingTime,
        status: b.status,
      };
    }),

  /**
   * Reschedule a meeting using a cancel token
   */
  rescheduleMeeting: publicProcedure
    .input(
      z.object({
        token: z.string().min(1),
        newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        newTime: z.string().regex(/^\d{2}:\d{2}$/),
      })
    )
    .mutation(async ({ input }) => {
      const dbConn2 = await getDb();
      if (!dbConn2) throw new Error("Database not available.");
      const booking = await dbConn2
        .select()
        .from(meetingBookings)
        .where(eq(meetingBookings.cancelToken, input.token))
        .limit(1);

      if (!booking.length) throw new Error("Invalid or expired reschedule link.");
      const b = booking[0];
      if (b.status === "cancelled") throw new Error("This meeting has been cancelled and cannot be rescheduled.");

      // Cancel old M365 event
      if (b.m365EventId) {
        try {
          const token = await getMsGraphToken();
          if (token) {
            await fetch(
              `https://graph.microsoft.com/v1.0/users/harry@gigitekai.com/calendar/events/${b.m365EventId}`,
              { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
            );
          }
        } catch (err) {
          console.error("[Calendar] Failed to delete old M365 event during reschedule:", err);
        }
      }

      // Create new M365 event
      const meetingDateTime = `${input.newDate}T${input.newTime}:00`;
      const [hours, minutes] = input.newTime.split(":").map(Number);
      const endMinutes = minutes + 15;
      const endHours = hours + Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;
      const endDateTime = `${input.newDate}T${endTime}:00`;

      let newM365EventId: string | undefined;
      try {
        const msToken = await getMsGraphToken();
        if (msToken) {
          const resp = await fetch(
            `https://graph.microsoft.com/v1.0/users/harry@gigitekai.com/calendar/events`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${msToken}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                subject: `Strategy Call with ${b.name} (${b.company || "Prospect"}) [Rescheduled]`,
                start: { dateTime: meetingDateTime, timeZone: "America/New_York" },
                end: { dateTime: endDateTime, timeZone: "America/New_York" },
                attendees: [{ emailAddress: { address: b.email, name: b.name }, type: "required" }],
                isReminderOn: true,
                reminderMinutesBeforeStart: 15,
              }),
            }
          );
          if (resp.ok) {
            const ev = await resp.json();
            newM365EventId = ev.id;
          }
        }
      } catch (err) {
        console.error("[Calendar] Failed to create new M365 event during reschedule:", err);
      }

      // Update DB
      await dbConn2
        .update(meetingBookings)
        .set({
          meetingDate: input.newDate,
          meetingTime: input.newTime,
          status: "rescheduled",
          m365EventId: newM365EventId,
        })
        .where(eq(meetingBookings.id, b.id));

      // Format new time for display
      const [h2, m2] = input.newTime.split(":").map(Number);
      const dh = h2 > 12 ? h2 - 12 : h2 === 0 ? 12 : h2;
      const ampm = h2 >= 12 ? "PM" : "AM";
      const newDisplayTime = `${dh}:${String(m2).padStart(2, "0")} ${ampm} EST`;
      const newDateObj = new Date(input.newDate + "T12:00:00");
      const newDisplayDate = newDateObj.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

      // Send reschedule confirmation email
      await sendEmail({
        to: b.email,
        subject: "Your GigitekAI Strategy Call Has Been Rescheduled ✓",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0a0e1a 0%, #1a1f3a 100%); padding: 32px 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <div style="color: #00d4ff; font-size: 28px; font-weight: 700;">GigitekAI</div>
              <div style="color: #8892a4; font-size: 13px; margin-top: 4px;">Powering the Next Generation of Enterprise Technology</div>
              <div style="color: #00d4ff; font-size: 36px; margin-top: 16px;">✓</div>
              <div style="color: white; font-size: 20px; font-weight: 600; margin-top: 8px;">Meeting Rescheduled!</div>
            </div>
            <div style="background: #f8f9fa; padding: 32px 30px;">
              <p style="color: #333; font-size: 16px;">Hi ${b.name},</p>
              <p style="color: #333; font-size: 15px; line-height: 1.6;">Your strategy call has been successfully rescheduled.</p>
              <div style="background: white; border-left: 4px solid #00d4ff; padding: 20px 24px; margin: 24px 0; border-radius: 0 6px 6px 0;">
                <div style="font-weight: 700; color: #0a0e1a; font-size: 15px; margin-bottom: 14px;">📅 New Meeting Details</div>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 7px 0; color: #666; font-size: 14px; width: 40%;">Date</td><td style="padding: 7px 0; color: #333; font-size: 14px; font-weight: 600;">${newDisplayDate}</td></tr>
                  <tr style="border-top: 1px solid #f0f0f0;"><td style="padding: 7px 0; color: #666; font-size: 14px;">Time</td><td style="padding: 7px 0; color: #333; font-size: 14px; font-weight: 600;">${newDisplayTime}</td></tr>
                  <tr style="border-top: 1px solid #f0f0f0;"><td style="padding: 7px 0; color: #666; font-size: 14px;">Duration</td><td style="padding: 7px 0; color: #333; font-size: 14px; font-weight: 600;">15 minutes</td></tr>
                </table>
              </div>
              <p style="color: #555; font-size: 14px;">Questions? Call us at <strong>(727) 382-5776</strong> or email support@gigitekai.com.</p>
            </div>
            <div style="background: #0a0e1a; padding: 20px 30px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="color: #8892a4; font-size: 12px; margin: 0;">GigitekAI LLC &nbsp;|&nbsp; (727) 382-5776 &nbsp;|&nbsp; support@gigitekai.com</p>
            </div>
          </div>
        `,
      });

      // Notify admin
      await sendEmail({
        to: "support@gigitekai.com",
        subject: `Meeting Rescheduled: ${b.name} → ${input.newDate} ${input.newTime}`,
        html: `<p><strong>${b.name}</strong> (${b.email}) rescheduled their strategy call to <strong>${input.newDate} at ${input.newTime} EST</strong>.</p>`,
      });

      return { success: true, message: "Meeting rescheduled successfully.", newDate: input.newDate, newTime: input.newTime };
    }),

  /**
   * Get available dates for booking (Mon/Wed/Fri only, up to 3 months out)
   */
  getAvailableDates: publicProcedure.query(() => {
    const availableDates: string[] = [];
    const today = new Date();
    // Start from tomorrow
    const start = new Date(today);
    start.setDate(today.getDate() + 1);
    // 3 months out
    const end = new Date(today);
    end.setMonth(today.getMonth() + 3);

    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay(); // 0=Sun, 1=Mon, 3=Wed, 5=Fri
      if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
        availableDates.push(current.toISOString().slice(0, 10));
      }
      current.setDate(current.getDate() + 1);
    }
    return { dates: availableDates };
  }),

  getAvailableSlots: publicProcedure
    .input(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
    )
    .query(async ({ input }) => {
      // Validate the requested date is a Mon/Wed/Fri
      const requestedDate = new Date(input.date + "T00:00:00");
      const dayOfWeek = requestedDate.getDay();
      const isValidDay = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;

      if (!isValidDay) {
        return { date: input.date, slots: [] };
      }

      // Available slots: 11:00 AM – 3:00 PM EST (every 30 minutes)
      // Last slot starts at 2:30 PM so meeting ends by 2:45 PM (15-min meetings)
      const slots = [
        "11:00",
        "11:30",
        "12:00",
        "12:30",
        "13:00",
        "13:30",
        "14:00",
        "14:30",
      ];

      return {
        date: input.date,
        slots,
      };
    }),
});
