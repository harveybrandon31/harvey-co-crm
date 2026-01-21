import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { generateCampaignEmail, CampaignType } from "@/lib/email/templates";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the client
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, first_name, last_name, email")
    .eq("id", id)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  if (!client.email) {
    return NextResponse.json(
      { error: "Client does not have an email address" },
      { status: 400 }
    );
  }

  // Parse request body
  let campaignType: CampaignType = "intro";
  try {
    const body = await request.json();
    campaignType = body.campaignType || "intro";
  } catch {
    // Use default
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://app.harveynco.com";
  const intakeUrl = `${baseUrl}/intake/new`;

  // Generate and send email
  const firstName = client.first_name || "Valued Client";
  const emailContent = generateCampaignEmail(campaignType, firstName, intakeUrl);

  const result = await sendEmail({
    to: client.email,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Failed to send email" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    emailId: result.id,
    sentTo: client.email,
    campaignType,
  });
}
