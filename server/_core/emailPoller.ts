/**
 * M365 Graph Email Poller
 * Polls support@gigitekai.com mailbox every 5 minutes for new emails
 * Auto-creates support tickets from unread emails
 * Marks emails as read after processing
 */

import { fetchInboxFromMsGraph, markMessageAsRead, fetchAttachmentsFromMessage, downloadAttachmentContent } from "./email";
import { createTicket } from "../db";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { emailMessages } from "../../drizzle/schema";
import { invokeLLM } from "./llm";
import { sendEmail } from "./email";
import { notifyOwner } from "./notification";
import { sendTicketNotificationToTeams } from "../teamsNotifications";
import type { Ticket } from "../../drizzle/schema";

const SUPPORT_EMAIL = "support@gigitekai.com";
const BASE_URL = process.env.BASE_URL || "https://gigitekai.com";

interface PollerStatus {
  isRunning: boolean;
  lastSyncTime: Date | null;
  nextSyncTime: Date | null;
  lastError: string | null;
  emailsProcessedToday: number;
  totalProcessed: number;
  // Circuit breaker for spam detection
  consecutiveErrors: number;
  circuitBreakerOpen: boolean;
  lastCircuitBreakerTrip: Date | null;
  // Rate limiting
  ticketsCreatedInLastHour: number;
  lastTicketCreationTime: Date | null;
}

let pollerStatus: PollerStatus = {
  isRunning: false,
  lastSyncTime: null,
  nextSyncTime: null,
  lastError: null,
  emailsProcessedToday: 0,
  totalProcessed: 0,
  // Circuit breaker
  consecutiveErrors: 0,
  circuitBreakerOpen: false,
  lastCircuitBreakerTrip: null,
  // Rate limiting
  ticketsCreatedInLastHour: 0,
  lastTicketCreationTime: null,
};

// Circuit breaker & rate limiting constants
const MAX_CONSECUTIVE_ERRORS = 3;
const CIRCUIT_BREAKER_RESET_MS = 15 * 60 * 1000; // 15 minutes
const MAX_TICKETS_PER_HOUR = 50;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

let pollerInterval: NodeJS.Timeout | null = null;

/**
 * Check if circuit breaker should be tripped (too many errors = spam detected)
 */
function shouldTripCircuitBreaker(): boolean {
  if (pollerStatus.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
    pollerStatus.circuitBreakerOpen = true;
    pollerStatus.lastCircuitBreakerTrip = new Date();
    console.error('[Email Poller] CIRCUIT BREAKER TRIPPED: Too many errors detected. Pausing email poller for 15 minutes.');
    return true;
  }
  return false;
}

/**
 * Check if circuit breaker should be reset
 */
function shouldResetCircuitBreaker(): boolean {
  if (!pollerStatus.circuitBreakerOpen) return false;
  if (!pollerStatus.lastCircuitBreakerTrip) return false;
  
  const timeSinceTrip = Date.now() - pollerStatus.lastCircuitBreakerTrip.getTime();
  if (timeSinceTrip > CIRCUIT_BREAKER_RESET_MS) {
    pollerStatus.circuitBreakerOpen = false;
    pollerStatus.consecutiveErrors = 0;
    console.log('[Email Poller] Circuit breaker reset. Resuming email poller.');
    return true;
  }
  return false;
}

/**
 * Check if rate limit is exceeded (too many tickets created = spam)
 */
function isRateLimitExceeded(): boolean {
  if (!pollerStatus.lastTicketCreationTime) return false;
  
  const timeSinceLastTicket = Date.now() - pollerStatus.lastTicketCreationTime.getTime();
  if (timeSinceLastTicket > RATE_LIMIT_WINDOW_MS) {
    // Reset counter after 1 hour
    pollerStatus.ticketsCreatedInLastHour = 0;
    return false;
  }
  
  return pollerStatus.ticketsCreatedInLastHour >= MAX_TICKETS_PER_HOUR;
}

/**
 * Record a ticket creation for rate limiting
 */
function recordTicketCreation(): void {
  pollerStatus.ticketsCreatedInLastHour++;
  pollerStatus.lastTicketCreationTime = new Date();
  
  if (pollerStatus.ticketsCreatedInLastHour > MAX_TICKETS_PER_HOUR) {
    console.warn(`[Email Poller] RATE LIMIT WARNING: ${pollerStatus.ticketsCreatedInLastHour} tickets created in the last hour (limit: ${MAX_TICKETS_PER_HOUR})`);
  }
}

/**
 * Classify email using LLM
 */
async function classifyEmail(
  subject: string,
  body: string
): Promise<{
  priority: "critical" | "high" | "medium" | "low";
  category: string;
  confidence: number;
  reasoning: string;
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an email classifier for a managed services provider. Classify emails into priority and category.",
        },
        {
          role: "user",
          content: `Subject: ${subject}\n\nBody: ${body.slice(0, 500)}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "email_classification",
          strict: true,
          schema: {
            type: "object",
            properties: {
              priority: {
                type: "string",
                enum: ["critical", "high", "medium", "low"],
              },
              category: {
                type: "string",
                enum: [
                  "bug_report",
                  "feature_request",
                  "general_support",
                  "billing",
                ],
              },
              confidence: { type: "number", minimum: 0, maximum: 1 },
              reasoning: { type: "string" },
            },
            required: ["priority", "category", "confidence", "reasoning"],
            additionalProperties: false,
          },
        },
      },
    });

    const raw = response.choices?.[0]?.message?.content;
    const txt = typeof raw === "string" ? raw : "";
    if (!txt) throw new Error("No response from LLM");

    const result = JSON.parse(txt);
    return {
      priority: result.priority || "medium",
      category: result.category || "general_support",
      confidence: result.confidence || 0.5,
      reasoning: result.reasoning || "AI classification",
    };
  } catch (error) {
    console.error("[Email Poller] Classification failed:", error);
    return {
      priority: "medium",
      category: "general_support",
      confidence: 0,
      reasoning: "Classification failed, using defaults",
    };
  }
}

/**
 * Find or create user from email sender
 */
async function findOrCreateUser(
  email: string,
  name: string
): Promise<{ id: number; email: string; name: string } | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const { users } = await import("../../drizzle/schema");

    // Try to find existing user by email
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      const existingName: string = (existing[0].name as string | null) || name || email.split("@")[0];
      const existingEmail: string = (existing[0].email as string | null) || email;
      return {
        id: existing[0].id,
        email: existingEmail,
        name: existingName,
      };
    }

    // Create new user
    const displayName = name || email.split("@")[0];
    const openId = `email-poller-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    await db.insert(users).values({
      openId: openId,
      email: email,
      name: displayName,
      role: "user",
      approved: true,
    });

    // Fetch the newly created user
    const newUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (newUser.length > 0) {
      console.log(`[Email Poller] Created new user: ${email}`);
      const newUserName: string = (newUser[0].name as string | null) || displayName;
      const newUserEmail: string = (newUser[0].email as string | null) || email;
      return {
        id: newUser[0].id,
        email: newUserEmail,
        name: newUserName,
      };
    }

    return null;
  } catch (error) {
    console.error("[Email Poller] Error finding/creating user:", error);
    return null;
  }
}

/**
 * Detect if an email is a Non-Delivery Report (NDR) from Exchange
 * NDRs should be skipped to prevent spam loops
 */
function isNDREmail(subject: string, from: string): boolean {
  const subjectLower = subject.toLowerCase();
  const fromLower = from.toLowerCase();
  
  // Check for NDR indicators in subject
  if (subjectLower.includes('undeliverable:') || 
      subjectLower.includes('delivery failed') ||
      subjectLower.includes('mail delivery failed') ||
      subjectLower.includes('returned mail') ||
      subjectLower.includes('failure notice')) {
    return true;
  }
  
  // Check for Exchange system addresses
  if (fromLower.includes('microsoftexchange') ||
      fromLower.includes('mailer-daemon') ||
      fromLower.includes('postmaster') ||
      fromLower.includes('noreply@microsoft') ||
      fromLower.includes('no-reply@microsoft')) {
    return true;
  }
  
  return false;
}

/**
 * Detect if an email is from our own system (confirmation emails, auto-replies)
 * This prevents the email loop where the poller picks up its own confirmation emails
 */
function isOwnSystemEmail(subject: string, senderEmail: string): boolean {
  const subjectLower = subject.toLowerCase();
  const senderLower = senderEmail.toLowerCase();
  
  // Skip emails sent FROM our own support address (confirmation emails land back in inbox)
  if (senderLower === 'support@gigitekai.com' || senderLower === 'support@gigitek.com') {
    return true;
  }
  
  // Skip our own ticket confirmation emails by subject pattern
  if (/^\[ticket #\d+\] we received your request/i.test(subject)) {
    return true;
  }
  
  // Skip auto-reply / out-of-office patterns
  if (subjectLower.startsWith('automatic reply:') ||
      subjectLower.startsWith('auto-reply:') ||
      subjectLower.startsWith('out of office:') ||
      subjectLower.includes('automatic reply') ||
      subjectLower.includes('auto-reply')) {
    return true;
  }
  
  // Skip noreply / no-reply senders
  if (senderLower.includes('noreply@') || senderLower.includes('no-reply@') ||
      senderLower.includes('donotreply@') || senderLower.includes('do-not-reply@')) {
    return true;
  }
  
  return false;
}

/**
 * Detect if an email is a Teams voicemail notification
 * Teams voicemails arrive with subject like "Voice Message from +1 (xxx) xxx-xxxx"
 */
function isVoicemailEmail(subject: string, body: string): boolean {
  const subjectLower = subject.toLowerCase();
  const bodyLower = body.toLowerCase();
  return (
    subjectLower.includes('voice message') ||
    subjectLower.includes('voicemail') ||
    subjectLower.includes('missed call') ||
    (subjectLower.includes('voice') && subjectLower.includes('message')) ||
    bodyLower.includes('transcription:') ||
    bodyLower.includes('voice message from')
  );
}

/**
 * Extract voicemail transcript from email body
 * Teams voicemail emails contain the transcript in the body
 */
function extractVoicemailTranscript(body: string): { transcript: string; callerNumber: string | null; duration: string | null } {
  let transcript = '';
  let callerNumber: string | null = null;
  let duration: string | null = null;

  // Extract caller phone number from subject or body
  const phoneMatch = body.match(/(\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/g);
  if (phoneMatch && phoneMatch.length > 0) {
    callerNumber = phoneMatch[0].replace(/[^\d+]/g, '');
    if (callerNumber.length === 10) callerNumber = '+1' + callerNumber;
  }

  // Extract duration
  const durationMatch = body.match(/(\d+)\s*(?:second|minute|sec|min)/i);
  if (durationMatch) {
    duration = durationMatch[0];
  }

  // Extract transcript — Teams formats it after "Transcription:" label
  const transcriptPatterns = [
    /transcription[:\s]+([\s\S]+?)(?:(?:this message was|to listen|reply|forward|\-{3,})|$)/i,
    /transcript[:\s]+([\s\S]+?)(?:(?:this message was|to listen|reply|forward|\-{3,})|$)/i,
    /message[:\s]+([\s\S]+?)(?:(?:this message was|to listen|reply|forward|\-{3,})|$)/i,
  ];

  for (const pattern of transcriptPatterns) {
    const match = body.match(pattern);
    if (match && match[1]) {
      transcript = match[1].replace(/<[^>]*>/g, '').trim().slice(0, 2000);
      break;
    }
  }

  // If no transcript found, use the cleaned body
  if (!transcript) {
    transcript = body.replace(/<[^>]*>/g, '').trim().slice(0, 1000);
  }

  return { transcript, callerNumber, duration };
}

/**
 * Helper to get audio file extension from MIME type
 */
function getAudioExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/wave': 'wav',
    'audio/ogg': 'ogg',
    'audio/m4a': 'm4a',
    'audio/mp4': 'm4a',
  };
  return mimeToExt[mimeType] || 'audio';
}

/**
 * Analyze voicemail transcript using AI and create a ticket
 */
async function processVoicemailEmail(msgData: any): Promise<boolean> {
  try {
    const { from, subject, bodyPreview, body, id: messageId } = msgData;

    // Deduplication check
    if (messageId) {
      const db = await getDb();
      if (db) {
        const existing = await db
          .select({ id: emailMessages.id })
          .from(emailMessages)
          .where(eq(emailMessages.messageId, messageId))
          .limit(1);
        if (existing.length > 0) return true; // Already processed
      }
    }

    console.log(`[Email Poller] Processing VOICEMAIL: "${subject}"`);

    // Extract body text
    const emailBody = typeof body === 'object' && body?.content
      ? body.content
      : (typeof body === 'string' ? body : (bodyPreview || ''));

    // Extract voicemail details
    let { transcript, callerNumber, duration } = extractVoicemailTranscript(emailBody);

    // If no transcript found, try to extract audio from attachments or URL and transcribe it
    if (!transcript || transcript.length < 10) {
      console.log('[Email Poller] No transcript in email, attempting to extract audio for transcription');
      
      // First, try to get audio from attachments
      if (msgData.hasAttachments) {
        try {
          const attachments = await fetchAttachmentsFromMessage(messageId);
          const audioAttachments = attachments.filter(att => 
            att.contentType?.startsWith('audio/') || 
            /\.(mp3|wav|m4a|webm|ogg)$/i.test(att.name)
          );
          
          if (audioAttachments.length > 0) {
            console.log(`[Email Poller] Found ${audioAttachments.length} audio attachment(s), attempting transcription`);
            const audioAtt = audioAttachments[0];
            const audioBuffer = await downloadAttachmentContent(messageId, audioAtt.id);
            
            if (audioBuffer && audioBuffer.length > 0) {
              try {
                const { transcribeAudio } = await import('./voiceTranscription');
                const { storagePut } = await import('../storage');
                const fileKey = `voicemail-transcriptions/${messageId}-${Date.now()}.${getAudioExtension(audioAtt.contentType)}`;
                const { url: audioUrl } = await storagePut(fileKey, audioBuffer, audioAtt.contentType);
                
                console.log(`[Email Poller] Transcribing voicemail attachment: ${audioAtt.name}`);
                const transcriptionResult = await transcribeAudio({ audioUrl, language: 'en' });
                if ('text' in transcriptionResult && transcriptionResult.text) {
                  transcript = transcriptionResult.text;
                  console.log(`[Email Poller] Successfully transcribed voicemail: ${transcript.substring(0, 100)}...`);
                } else if ('error' in transcriptionResult) {
                  console.warn(`[Email Poller] Transcription failed: ${transcriptionResult.error}`);
                }
              } catch (transcribeError) {
                console.error('[Email Poller] Error during attachment transcription:', transcribeError);
              }
            }
          }
        } catch (attachmentError) {
          console.error('[Email Poller] Error fetching attachments:', attachmentError);
        }
      }
      
      // Fallback: try to extract audio URL from email body
      if (!transcript || transcript.length < 10) {
        const audioUrlMatch = emailBody.match(/https?:\/\/[^\s\"<>]+\.(?:mp3|wav|m4a|webm|ogg)/i);
        if (audioUrlMatch) {
          try {
            const { transcribeAudio } = await import('./voiceTranscription');
            const audioUrl = audioUrlMatch[0];
            console.log(`[Email Poller] Transcribing audio from URL: ${audioUrl}`);
            const transcriptionResult = await transcribeAudio({ audioUrl, language: 'en' });
            if ('text' in transcriptionResult && transcriptionResult.text) {
              transcript = transcriptionResult.text;
              console.log(`[Email Poller] Successfully transcribed voicemail: ${transcript.substring(0, 100)}...`);
            } else if ('error' in transcriptionResult) {
              console.warn(`[Email Poller] Transcription failed: ${transcriptionResult.error}`);
            }
          } catch (transcribeError) {
            console.error('[Email Poller] Error during URL transcription:', transcribeError);
          }
        }
      }
    }

    // Parse sender
    let fromStr = typeof from === 'string' ? from : (from?.emailAddress?.address || from?.email || 'voicemail@teams.microsoft.com');
    const emailMatch = fromStr.match(/<(.+?)>/);
    const senderEmail = emailMatch ? emailMatch[1] : fromStr;

    // Use AI to analyze the voicemail transcript
    const aiAnalysis = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are a helpdesk ticket creator for GigitekAI, a managed services provider. Analyze voicemail transcripts and create support tickets. Extract the issue, urgency, and caller intent.',
        },
        {
          role: 'user',
          content: `Voicemail received from: ${callerNumber || 'Unknown number'}\nDuration: ${duration || 'Unknown'}\n\nTranscript:\n${transcript}\n\nCreate a support ticket from this voicemail.`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'voicemail_ticket',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Concise ticket title summarizing the issue' },
              description: { type: 'string', description: 'Full description including caller info and issue details' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              category: { type: 'string', enum: ['bug_report', 'feature_request', 'general_support', 'billing'] },
              callerIntent: { type: 'string', description: 'What the caller wants or needs' },
              urgency: { type: 'string', description: 'How urgent this appears to be' },
            },
            required: ['title', 'description', 'priority', 'category', 'callerIntent', 'urgency'],
            additionalProperties: false,
          },
        },
      },
    });

    const raw = aiAnalysis.choices?.[0]?.message?.content;
    const txt = typeof raw === 'string' ? raw : '';
    let ticketData = {
      title: `Voicemail from ${callerNumber || 'Unknown'}`,
      description: `Voicemail received.\n\nTranscript:\n${transcript}`,
      priority: 'medium' as 'critical' | 'high' | 'medium' | 'low',
      category: 'general_support',
      callerIntent: 'Support needed',
      urgency: 'Normal',
    };

    if (txt) {
      try {
        const parsed = JSON.parse(txt);
        ticketData = { ...ticketData, ...parsed };
      } catch (_) {}
    }

    // Find or create user from caller number (look up by phone) or use a generic voicemail user
    let userId: number | null = null;
    if (callerNumber) {
      try {
        const db = await getDb();
        if (db) {
          const { users } = await import('../../drizzle/schema');
          // Try to find user by phone number
          // Phone lookup by email pattern (phone field may not exist, skip if error)
          // For now we rely on the guest user fallback
          console.log(`[Email Poller] Caller number: ${callerNumber} - looking up user`);
        }
      } catch (_) {}
    }

    // If no user found, create a guest user for the voicemail
    if (!userId) {
      const guestEmail = callerNumber
        ? `voicemail-${callerNumber.replace(/[^\d]/g, '')}@voicemail.gigitekai.com`
        : `voicemail-${Date.now()}@voicemail.gigitekai.com`;
      const guestUser = await findOrCreateUser(guestEmail, callerNumber ? `Caller ${callerNumber}` : 'Voicemail Caller');
      userId = guestUser?.id || null;
    }

    if (!userId) {
      console.error('[Email Poller] Could not create user for voicemail');
      return false;
    }

    // Create ticket automatically (no manual review needed for voicemails)
    const fullDescription = [
      `**Voicemail received via Teams Phone**`,
      `**Caller:** ${callerNumber || 'Unknown number'}`,
      `**Duration:** ${duration || 'Unknown'}`,
      `**Caller Intent:** ${ticketData.callerIntent}`,
      `**Urgency:** ${ticketData.urgency}`,
      ``,
      `**Transcript:**`,
      transcript || '(No transcript available)',
    ].join('\n');

    const ticket = await createTicket({
      userId,
      title: ticketData.title,
      description: fullDescription,
      priority: ticketData.priority,
      category: (ticketData.category as 'bug_report' | 'feature_request' | 'general_support' | 'billing') || 'general_support',
      status: 'open',
      source: 'email',
      aiCategory: (ticketData.category as string) || 'general_support',
      aiPriority: ticketData.priority,
      aiConfidence: '0.85',
      aiReasoning: `Voicemail auto-ticket: ${ticketData.callerIntent}`,
    });

    const ticketId = ticket?.id || null;
    if (!ticketId) {
      console.error('[Email Poller] Failed to create voicemail ticket');
      return false;
    }

    console.log(`[Email Poller] Created VOICEMAIL ticket #${ticketId} from ${callerNumber || 'unknown'}`);

    // Send Teams notification for voicemail ticket
    try {
      const voicemailTicketObj: Partial<import('../../drizzle/schema').Ticket> = {
        id: ticketId,
        title: ticketData.title,
        description: `Voicemail from ${callerNumber || 'Unknown'}\n\nTranscript:\n${transcript.slice(0, 500)}`,
        priority: (ticketData.priority as 'critical' | 'high' | 'medium' | 'low') || 'medium',
        status: 'open' as any,
        category: (ticketData.category as 'bug_report' | 'feature_request' | 'general_support' | 'billing') || 'general_support',
        createdAt: new Date(),
      };
      await sendTicketNotificationToTeams(voicemailTicketObj, 'created');
      console.log(`[Email Poller] Teams notification sent for voicemail ticket #${ticketId}`);
    } catch (teamsError) {
      console.warn(`[Email Poller] Failed to send Teams notification for voicemail ticket #${ticketId}:`, teamsError);
    }

    // Store in emailMessages for deduplication
    try {
      const db = await getDb();
      if (db) {
        await db.insert(emailMessages).values({
          direction: 'received',
          messageId: messageId || `voicemail-${Date.now()}`,
          from: senderEmail,
          to: SUPPORT_EMAIL,
          subject: subject,
          body: transcript.slice(0, 5000) || 'Voicemail - no transcript',
          linkedTicketId: ticketId,
          status: 'received',
        });
      }
    } catch (dbError) {
      console.warn('[Email Poller] Failed to store voicemail email in DB:', dbError);
    }

    // Notify owner
    try {
      await notifyOwner({
        title: `New Voicemail Ticket #${ticketId}: ${ticketData.title}`,
        content: `Caller: ${callerNumber || 'Unknown'}\nPriority: ${ticketData.priority}\nIntent: ${ticketData.callerIntent}\n\nTranscript:\n${transcript.slice(0, 500)}`,
      });
    } catch (_) {}

    pollerStatus.emailsProcessedToday++;
    pollerStatus.totalProcessed++;
    return true;
  } catch (error) {
    console.error('[Email Poller] Error processing voicemail:', error);
    return false;
  }
}

/**
 * Process a single email and create a ticket
 */
/**
 * Strip HTML tags and decode HTML entities from email body
 */
function cleanEmailBody(html: string): string {
  if (!html) return '';
  
  // Decode HTML entities
  const decoded = html
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
  
  // Remove HTML tags
  const stripped = decoded
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Limit to first 5000 characters
  return stripped.slice(0, 5000);
}

async function processEmail(msgData: any): Promise<boolean> {
  try {
    const { from, subject, bodyPreview, body, id: messageId } = msgData;

    if (!from || !subject) {
      console.warn("[Email Poller] Missing required fields in email");
      return false;
    }

    // Parse sender email and name
    // Handle both string and object formats from Graph API
    let fromStr = typeof from === 'string' ? from : (from?.emailAddress?.address || from?.email || '');
    if (!fromStr) {
      console.warn('[Email Poller] Invalid from field format:', from);
      return false;
    }
    
    const emailMatch = fromStr.match(/<(.+?)>/);
    const senderEmail = emailMatch ? emailMatch[1] : fromStr;
    const senderName = fromStr.replace(/<.+?>/, "").trim() || senderEmail;

    // ── Deduplication: skip if this messageId was already processed ──────────
    if (messageId) {
      const db = await getDb();
      if (db) {
        const existing = await db
          .select({ id: emailMessages.id })
          .from(emailMessages)
          .where(eq(emailMessages.messageId, messageId))
          .limit(1);
        if (existing.length > 0) {
          // Already processed — silently skip
          return true;
        }
      }
    }

    // ── SAFETY NET: Double-check for own system emails inside processEmail ──
    if (isOwnSystemEmail(subject, senderEmail)) {
      console.log(`[Email Poller] SKIPPING OWN SYSTEM EMAIL (safety net) from ${senderEmail}: "${subject}"`);
      return true; // Return true so it counts as "processed" and gets marked as read
    }

    console.log(`[Email Poller] Processing email from ${senderEmail}: "${subject}"`);

    // ── RATE LIMITING: Check if too many tickets created in last hour ──
    if (isRateLimitExceeded()) {
      console.warn(`[Email Poller] RATE LIMIT EXCEEDED: Skipping email to prevent spam. (${pollerStatus.ticketsCreatedInLastHour}/${MAX_TICKETS_PER_HOUR} tickets in last hour)`);
      return false;
    }

    // Find or create user
    const user = await findOrCreateUser(senderEmail, senderName);
    if (!user) {
      console.error("[Email Poller] Could not find or create user");
      return false;
    }

    // Classify the email — body from Graph API can be an object {contentType, content} or a string
    const rawEmailBody = typeof body === 'object' && body?.content
      ? body.content
      : (typeof body === 'string' ? body : (bodyPreview || ""));
    
    // Clean HTML from email body
    const emailBody = cleanEmailBody(rawEmailBody);
    const classification = await classifyEmail(subject, emailBody);

    // Create ticket
    const ticket = await createTicket({
      userId: user.id,
      title: subject,
      description: emailBody,
      priority: classification.priority,
      category: (classification.category as 'bug_report' | 'feature_request' | 'general_support' | 'billing') || 'general_support',
      status: "open",
      source: "email",
      aiCategory: classification.category,
      aiPriority: classification.priority,
      aiConfidence: String(Math.min(1, Math.max(0, classification.confidence))),
      aiReasoning: classification.reasoning,
    });

    const ticketId = ticket?.id || null;
    if (!ticketId) {
      console.error("[Email Poller] Failed to create ticket");
      pollerStatus.consecutiveErrors++;
      return false;
    }

    // Record ticket creation for rate limiting
    recordTicketCreation();
    // Reset error counter on successful ticket creation
    pollerStatus.consecutiveErrors = 0;

    console.log(`[Email Poller] Created ticket #${ticketId} from ${senderEmail}`);

    // Send Teams notification
    try {
      const ticket: Partial<Ticket> = {
        id: ticketId,
        title: subject,
        description: typeof emailBody === 'string' ? emailBody.replace(/<[^>]*>/g, '').slice(0, 1000) : String(emailBody).slice(0, 1000),
        priority: (classification.priority as 'critical' | 'high' | 'medium' | 'low') || 'medium',
        status: 'open' as any,
        category: (classification.category as 'bug_report' | 'feature_request' | 'general_support' | 'billing') || 'general_support',
        createdAt: new Date(),
      };
      await sendTicketNotificationToTeams(ticket, 'created');
      console.log(`[Email Poller] Teams notification sent for ticket #${ticketId}`);
    } catch (teamsError) {
      console.warn(`[Email Poller] Failed to send Teams notification for ticket #${ticketId}:`, teamsError);
    }

    // Send confirmation email to customer
    try {
      const firstName = senderName.split(" ")[0] || senderName || "there";
      const confirmationEmail = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00D4FF;">We received your request</h2>
          <p>Hi ${firstName},</p>
          <p>Thank you for contacting GigitekAI Support. We've received your request and created ticket <strong>#${ticketId}</strong>.</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Priority:</strong> ${classification.priority}</p>
          <p>Our team will review your request and respond within our SLA timeframe. You can track your ticket status at:</p>
          <p><a href="${BASE_URL}/helpdesk/ticket/${ticketId}" style="color: #00D4FF; text-decoration: none;">View Ticket #${ticketId}</a></p>
          <p>— GigitekAI Support Team</p>
        </div>
      `;

      await sendEmail({
        to: senderEmail,
        subject: `[Ticket #${ticketId}] We received your request — ${subject}`,
        html: confirmationEmail,
        replyTo: SUPPORT_EMAIL,
        fromName: "GigitekAI Support",
      });

      console.log(`[Email Poller] Confirmation email sent to ${senderEmail}`);
    } catch (emailError) {
      console.warn("[Email Poller] Failed to send confirmation email:", emailError);
    }

    // Store email in database
    try {
      const db = await getDb();
      if (db) {
        // Strip HTML tags for plain text storage
        const plainBody = typeof emailBody === 'string' ? emailBody.replace(/<[^>]*>/g, '').slice(0, 5000) : '';
        await db.insert(emailMessages).values({
          direction: 'received',
          messageId: messageId || `poller-${Date.now()}`,
          from: senderEmail,
          to: SUPPORT_EMAIL,
          subject: subject,
          body: plainBody || 'No body content',
          linkedTicketId: ticketId,
          status: 'received',
        });
      }
    } catch (dbError) {
      console.warn("[Email Poller] Failed to store email in DB:", dbError);
    }

    // Notify owner
    try {
      await notifyOwner({
        title: `New Support Ticket #${ticketId}: ${subject}`,
        content: `From: ${senderName} (${senderEmail})\n\nCategory: ${classification.category}\nPriority: ${classification.priority}\n\n${typeof emailBody === 'string' ? emailBody.replace(/<[^>]*>/g, '').slice(0, 500) : String(emailBody).slice(0, 500)}`,
      });
    } catch (notifyError) {
      console.warn("[Email Poller] Failed to notify owner:", notifyError);
    }

    pollerStatus.emailsProcessedToday++;
    pollerStatus.totalProcessed++;
    return true;
  } catch (error) {
    console.error("[Email Poller] Error processing email:", error);
    return false;
  }
}

/**
 * Run the email poller
 */
export async function runEmailPoller(): Promise<void> {
  if (pollerStatus.isRunning) {
    console.log("[Email Poller] Poller already running, skipping cycle");
    return;
  }

  // ── CHECK CIRCUIT BREAKER ──
  if (pollerStatus.circuitBreakerOpen) {
    if (shouldResetCircuitBreaker()) {
      console.log('[Email Poller] Circuit breaker reset. Attempting to resume.');
    } else {
      console.warn('[Email Poller] Circuit breaker is OPEN. Skipping this cycle.');
      return;
    }
  }

  pollerStatus.isRunning = true;
  const startTime = Date.now();

  try {
    console.log(`[Email Poller] Starting email poll at ${new Date().toISOString()}`);
    console.log(`[Email Poller] NODE_ENV=${process.env.NODE_ENV}, Polling mailbox: support@gigitekai.com`);

    // Fetch unread emails from mailbox
    const messages = await fetchInboxFromMsGraph(50, 0);
    console.log(`[Email Poller] Fetched ${messages.length} emails from mailbox`);
    if (messages.length === 0) {
      console.log(`[Email Poller] DEBUG: No emails fetched. Checking Graph API credentials...`);
      const { msGraphTenantId, msGraphClientId, msGraphClientSecret } = await import('./env').then(m => ({ msGraphTenantId: m.ENV.msGraphTenantId, msGraphClientId: m.ENV.msGraphClientId, msGraphClientSecret: m.ENV.msGraphClientSecret }));
      console.log(`[Email Poller] DEBUG: Tenant=${msGraphTenantId ? 'SET' : 'MISSING'}, ClientId=${msGraphClientId ? 'SET' : 'MISSING'}, Secret=${msGraphClientSecret ? 'SET' : 'MISSING'}`);
    }

    // Process each email
    let successCount = 0;
    let skippedCount = 0;
    for (const msg of messages) {
      const subject = msg.subject || '';
      const from = msg.from || '';
      const senderAddr = typeof from === 'string' ? from : (from?.emailAddress?.address || '');
      const emailBody = typeof msg.body === 'object' && msg.body?.content
        ? msg.body.content
        : (typeof msg.body === 'string' ? msg.body : (msg.bodyPreview || ''));

      // ── SKIP NDR EMAILS TO PREVENT SPAM LOOPS ──
      if (isNDREmail(subject, senderAddr)) {
        console.log(`[Email Poller] SKIPPING NDR EMAIL: "${subject}"`);
        // Mark as read so we don't fetch it again
        if (msg.id) await markMessageAsRead(msg.id).catch(() => {});
        skippedCount++;
        continue;
      }

      // ── SKIP OWN SYSTEM EMAILS TO PREVENT EMAIL LOOPS ──
      if (isOwnSystemEmail(subject, senderAddr)) {
        console.log(`[Email Poller] SKIPPING OWN SYSTEM EMAIL from ${senderAddr}: "${subject}"`);
        // Mark as read so we don't fetch it again
        if (msg.id) await markMessageAsRead(msg.id).catch(() => {});
        skippedCount++;
        continue;
      }

      // Route voicemails to the voicemail processor
      if (isVoicemailEmail(subject, emailBody)) {
        console.log(`[Email Poller] Detected voicemail email: "${subject}"`);
        const success = await processVoicemailEmail(msg);
        if (success) {
          successCount++;
          // Mark as read after successful processing
          if (msg.id) await markMessageAsRead(msg.id).catch(() => {});
        }
      } else {
        const success = await processEmail(msg);
        if (success) {
          successCount++;
          // Mark as read after successful processing
          if (msg.id) await markMessageAsRead(msg.id).catch(() => {});
        }
      }
    }

    console.log(`[Email Poller] Processed ${successCount}/${messages.length} emails successfully (${skippedCount} skipped as system/NDR)`);

    pollerStatus.lastSyncTime = new Date();
    pollerStatus.lastError = null;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Email Poller] Polling error:", error);
    pollerStatus.lastError = errorMsg;
    pollerStatus.consecutiveErrors++;
    
    // Check if we should trip the circuit breaker
    if (shouldTripCircuitBreaker()) {
      // Circuit breaker is now open, will skip cycles until reset
    }
  } finally {
    pollerStatus.isRunning = false;
    pollerStatus.nextSyncTime = new Date(Date.now() + 5 * 60 * 1000); // Next sync in 5 minutes
    const duration = Date.now() - startTime;
    console.log(`[Email Poller] Polling cycle completed in ${duration}ms`);
  }
}

/**
 * Start the email poller scheduler (runs every 5 minutes)
 */
export function startEmailPoller(): void {
  if (pollerInterval) {
    console.log("[Email Poller] Poller already started");
    return;
  }

  console.log("[Email Poller] Starting email poller (5-minute interval)");

  // Run immediately on startup
  runEmailPoller().catch((error) => {
    console.error("[Email Poller] Initial run failed:", error);
  });

  // Schedule recurring runs every 5 minutes
  pollerInterval = setInterval(() => {
    runEmailPoller().catch((error) => {
      console.error("[Email Poller] Scheduled run failed:", error);
    });
  }, 5 * 60 * 1000); // 5 minutes
}

/**
 * Stop the email poller scheduler
 */
export function stopEmailPoller(): void {
  if (pollerInterval) {
    clearInterval(pollerInterval);
    pollerInterval = null;
    console.log("[Email Poller] Email poller stopped");
  }
}

/**
 * Get current poller status
 */
export function getEmailPollerStatus(): PollerStatus {
  return { ...pollerStatus };
}

/**
 * Manually trigger a poller run
 */
export async function triggerEmailPollerRun(): Promise<{ success: boolean; message: string }> {
  try {
    await runEmailPoller();
    return {
      success: true,
      message: `Email poll completed. Processed ${pollerStatus.emailsProcessedToday} emails today.`,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Email poll failed: ${errorMsg}`,
    };
  }
}

/**
 * Reset daily counter (call at midnight)
 */
export function resetDailyCounter(): void {
  pollerStatus.emailsProcessedToday = 0;
  console.log("[Email Poller] Daily counter reset");
}
