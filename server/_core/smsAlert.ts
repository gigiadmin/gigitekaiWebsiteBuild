import { sendSMS } from "./sms";

/**
 * Send SMS alert to admin when email delivery fails
 * Uses Twilio SMS service for reliable alerting
 */
export async function sendSMSAlert(message: string): Promise<boolean> {
  try {
    // Get admin phone number from environment
    const adminPhone = process.env.ADMIN_PHONE_NUMBER;
    
    if (!adminPhone) {
      console.warn("[SMS Alert] Admin phone number not configured. Skipping SMS alert.");
      return false;
    }

    const alertMessage = `🚨 GigitekAI Email Alert: ${message}`;
    
    console.log(`[SMS Alert] Sending alert to ${adminPhone}: ${alertMessage}`);
    
    const result = await sendSMS({
      to: adminPhone,
      message: alertMessage,
    });

    if (result) {
      console.log(`[SMS Alert] SMS alert sent successfully to ${adminPhone}`);
      return true;
    } else {
      console.error(`[SMS Alert] Failed to send SMS alert to ${adminPhone}`);
      return false;
    }
  } catch (error) {
    console.error("[SMS Alert] Error sending SMS alert:", error);
    return false;
  }
}

/**
 * Send SMS alert for email delivery failure with retry logic
 */
export async function sendEmailFailureAlert(
  recipientEmail: string,
  errorMessage: string,
  retryCount: number = 0
): Promise<boolean> {
  const maxRetries = 2;
  
  try {
    const adminPhone = process.env.ADMIN_PHONE_NUMBER;
    
    if (!adminPhone) {
      console.warn("[SMS Alert] Admin phone number not configured");
      return false;
    }

    const alertMessage = `🚨 Email Delivery Failed\nTo: ${recipientEmail}\nError: ${errorMessage.substring(0, 50)}...`;
    
    const result = await sendSMS({
      to: adminPhone,
      message: alertMessage,
    });

    if (result) {
      console.log(`[SMS Alert] Email failure alert sent to ${adminPhone}`);
      return true;
    } else if (retryCount < maxRetries) {
      console.log(`[SMS Alert] Retrying SMS alert (attempt ${retryCount + 2}/${maxRetries + 1})...`);
      // Wait 2 seconds before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
      return sendEmailFailureAlert(recipientEmail, errorMessage, retryCount + 1);
    } else {
      console.error(`[SMS Alert] Failed to send email failure alert after ${maxRetries + 1} attempts`);
      return false;
    }
  } catch (error) {
    console.error("[SMS Alert] Error in sendEmailFailureAlert:", error);
    if (retryCount < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return sendEmailFailureAlert(recipientEmail, errorMessage, retryCount + 1);
    }
    return false;
  }
}
