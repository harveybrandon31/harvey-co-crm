import { Resend } from "resend";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("RESEND_API_KEY is not set");
    return { success: false, error: "Email service not configured" };
  }

  // Debug: log key prefix to verify correct key is loaded
  console.log("Using Resend API key starting with:", apiKey.substring(0, 10) + "...");

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM || "Harvey & Co <onboarding@resend.dev>";

  console.log("Sending email from:", from, "to:", options.to);

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error("Email send error:", JSON.stringify(error, null, 2));
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error("Email send exception:", err);
    return { success: false, error: "Failed to send email" };
  }
}
