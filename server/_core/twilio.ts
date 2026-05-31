/**
 * Twilio API Integration
 * Fetches SMS, call, and voicemail metrics
 * Docs: https://www.twilio.com/docs/api
 */

import { ENV } from "./env";

interface TwilioMessage {
  sid: string;
  from: string;
  to: string;
  body: string;
  status: string;
  date_sent: string;
}

interface TwilioCall {
  sid: string;
  from: string;
  to: string;
  status: string;
  start_time: string;
  end_time: string;
  duration: number;
}

interface TwilioMetrics {
  totalMessages: number;
  totalCalls: number;
  todayMessages: number;
  todayCalls: number;
  failedMessages: number;
}

/**
 * Get Twilio account metrics
 */
export async function getTwilioMetrics(): Promise<TwilioMetrics> {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.warn("[Twilio] Credentials not configured");
      return {
        totalMessages: 0,
        totalCalls: 0,
        todayMessages: 0,
        todayCalls: 0,
        failedMessages: 0,
      };
    }

    const auth = Buffer.from(
      `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
    ).toString("base64");

    // Get all messages
    const messagesRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    let totalMessages = 0;
    let failedMessages = 0;
    let todayMessages = 0;

    if (messagesRes.ok) {
      const messagesData = await messagesRes.json();
      const messages: TwilioMessage[] = messagesData.messages || [];
      totalMessages = messagesData.total;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      messages.forEach((msg) => {
        if (msg.status === "failed") failedMessages++;
        if (msg.date_sent && new Date(msg.date_sent) >= today) todayMessages++;
      });
    }

    // Get all calls
    const callsRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Calls.json`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    let totalCalls = 0;
    let todayCalls = 0;

    if (callsRes.ok) {
      const callsData = await callsRes.json();
      const calls: TwilioCall[] = callsData.calls || [];
      totalCalls = callsData.total;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      calls.forEach((call) => {
        if (call.start_time && new Date(call.start_time) >= today) todayCalls++;
      });
    }

    return {
      totalMessages,
      totalCalls,
      todayMessages,
      todayCalls,
      failedMessages,
    };
  } catch (error) {
    console.error("[Twilio] Failed to get metrics:", error);
    return {
      totalMessages: 0,
      totalCalls: 0,
      todayMessages: 0,
      todayCalls: 0,
      failedMessages: 0,
    };
  }
}

/**
 * Get recent messages
 */
export async function getRecentMessages(limit: number = 10): Promise<TwilioMessage[]> {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return [];
    }

    const auth = Buffer.from(
      `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
    ).toString("base64");

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json?PageSize=${limit}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Twilio API error: ${res.statusText}`);
    }

    const data = await res.json();
    return data.messages || [];
  } catch (error) {
    console.error("[Twilio] Failed to get messages:", error);
    return [];
  }
}

/**
 * Get recent calls
 */
export async function getRecentCalls(limit: number = 10): Promise<TwilioCall[]> {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return [];
    }

    const auth = Buffer.from(
      `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
    ).toString("base64");

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Calls.json?PageSize=${limit}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Twilio API error: ${res.statusText}`);
    }

    const data = await res.json();
    return data.calls || [];
  } catch (error) {
    console.error("[Twilio] Failed to get calls:", error);
    return [];
  }
}

/**
 * Send SMS message
 */
export async function sendSMS(
  to: string,
  message: string
): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      return {
        success: false,
        error: "Twilio credentials not configured",
      };
    }

    const auth = Buffer.from(
      `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
    ).toString("base64");

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: process.env.TWILIO_PHONE_NUMBER,
          To: to,
          Body: message,
        }).toString(),
      }
    );

    if (!res.ok) {
      const error = await res.text();
      return {
        success: false,
        error,
      };
    }

    const data = await res.json();
    return {
      success: true,
      sid: data.sid,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
