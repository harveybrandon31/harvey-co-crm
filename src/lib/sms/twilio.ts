// Twilio SMS Integration for Harvey & Co CRM

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

export interface SMSOptions {
  to: string;
  body: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Format phone number to E.164 format
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const digits = phone.replace(/\D/g, "");

  // If it starts with 1 and has 11 digits, it's already US format
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // If it has 10 digits, assume US and add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // Return as-is with + prefix if it looks like an international number
  if (digits.length > 10) {
    return `+${digits}`;
  }

  // Return original if we can't parse it
  return phone;
}

// Validate phone number
export function isValidPhoneNumber(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

// Send SMS via Twilio
export async function sendSMS(options: SMSOptions): Promise<SMSResult> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.error("Twilio credentials not configured");
    return {
      success: false,
      error: "SMS service not configured. Please set up Twilio credentials.",
    };
  }

  const formattedTo = formatPhoneNumber(options.to);

  if (!isValidPhoneNumber(options.to)) {
    return {
      success: false,
      error: "Invalid phone number format",
    };
  }

  try {
    // Twilio API endpoint
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    // Create the request body
    const body = new URLSearchParams({
      To: formattedTo,
      From: TWILIO_PHONE_NUMBER,
      Body: options.body,
    });

    // Make the API request
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Twilio API error:", data);
      return {
        success: false,
        error: data.message || "Failed to send SMS",
      };
    }

    return {
      success: true,
      messageId: data.sid,
    };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error sending SMS",
    };
  }
}

// Get Twilio phone number (for display)
export function getTwilioPhoneNumber(): string | null {
  return TWILIO_PHONE_NUMBER || null;
}
