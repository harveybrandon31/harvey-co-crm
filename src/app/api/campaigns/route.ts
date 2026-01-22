import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { generateCampaignEmail, CAMPAIGN_TYPES, CampaignType } from "@/lib/email/templates";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
}

// GET - Get campaign stats (clients with email addresses)
export async function GET() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get count of clients with valid email addresses
  const { count: totalClients } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true });

  const { count: clientsWithEmail } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .not("email", "is", null)
    .neq("email", "");

  return NextResponse.json({
    totalClients: totalClients || 0,
    clientsWithEmail: clientsWithEmail || 0,
    clientsWithoutEmail: (totalClients || 0) - (clientsWithEmail || 0),
    campaignTypes: CAMPAIGN_TYPES,
  });
}

// POST - Send campaign emails
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse request body for options
  let testMode = false;
  let testEmail = "";
  let batchSize = 10; // Send in batches to avoid rate limits
  let campaignType: CampaignType = "intro";

  try {
    const body = await request.json();
    testMode = body.testMode || false;
    testEmail = body.testEmail || "";
    batchSize = body.batchSize || 10;
    campaignType = body.campaignType || "intro";
  } catch {
    // Use defaults
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://app.harveynco.com";
  const intakeUrl = `${baseUrl}/intake/new`;

  // Test mode - send single test email
  if (testMode) {
    if (!testEmail) {
      return NextResponse.json(
        { error: "Test email address required in test mode" },
        { status: 400 }
      );
    }

    // Debug: log API key info
    const apiKey = process.env.RESEND_API_KEY;
    const apiKeyPrefix = apiKey ? apiKey.substring(0, 12) : "NOT SET";
    const emailFrom = process.env.EMAIL_FROM || "not set";
    console.log("Test email - API Key prefix:", apiKeyPrefix, "EMAIL_FROM:", emailFrom);

    const emailContent = generateCampaignEmail(campaignType, "Test User", intakeUrl);
    const result = await sendEmail({
      to: testEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          sent: false,
          debug: { apiKeyPrefix, emailFrom, to: testEmail }
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      testMode: true,
      sent: 1,
      campaignType,
      message: `Test email (${campaignType}) sent to ${testEmail}`,
    });
  }

  // Production mode - send to all clients with email addresses
  const { data: clients, error } = await supabase
    .from("clients")
    .select("id, first_name, last_name, email")
    .not("email", "is", null)
    .neq("email", "");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!clients || clients.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No clients with email addresses found",
      sent: 0,
      failed: 0,
    });
  }

  let sent = 0;
  let failed = 0;
  const errors: { email: string; error: string }[] = [];

  // Send emails in batches
  for (let i = 0; i < clients.length; i += batchSize) {
    const batch = clients.slice(i, i + batchSize);

    const results = await Promise.all(
      batch.map(async (client: Client) => {
        if (!client.email) return { success: false, email: "", error: "No email" };

        const firstName = client.first_name || "Valued Client";
        const emailContent = generateCampaignEmail(campaignType, firstName, intakeUrl);

        try {
          const result = await sendEmail({
            to: client.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
          });

          return {
            success: result.success,
            email: client.email,
            error: result.error || null,
          };
        } catch (err) {
          return {
            success: false,
            email: client.email,
            error: err instanceof Error ? err.message : "Unknown error",
          };
        }
      })
    );

    for (const result of results) {
      if (result.success) {
        sent++;
      } else {
        failed++;
        if (result.error) {
          errors.push({ email: result.email, error: result.error });
        }
      }
    }

    // Small delay between batches to avoid rate limits
    if (i + batchSize < clients.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return NextResponse.json({
    success: true,
    sent,
    failed,
    total: clients.length,
    campaignType,
    errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Only return first 10 errors
  });
}
