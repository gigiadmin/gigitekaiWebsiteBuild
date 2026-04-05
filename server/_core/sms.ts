import { ENV } from "./env";

export type SMSPayload = {
  to: string;
  message: string;
};

/**
 * Sends an SMS using Twilio
 * Returns true if successful, false if failed
 */
export async function sendSMS(payload: SMSPayload): Promise<boolean> {
  if (!ENV.twilioAccountSid || !ENV.twilioAuthToken || !ENV.twilioPhoneNumber) {
    console.warn("[SMS] Twilio not configured - SMS notifications disabled");
    return false;
  }

  try {
    const auth = Buffer.from(
      `${ENV.twilioAccountSid}:${ENV.twilioAuthToken}`
    ).toString("base64");

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${ENV.twilioAccountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: ENV.twilioPhoneNumber,
          To: payload.to,
          Body: payload.message,
        }).toString(),
      }
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(
        `[SMS] Failed to send SMS (${response.status} ${response.statusText})${
          detail ? `: ${detail}` : ""
        }`
      );
      return false;
    }

    console.log(`[SMS] Successfully sent SMS to ${payload.to}`);
    return true;
  } catch (error) {
    console.error("[SMS] Error sending SMS:", error);
    return false;
  }
}
