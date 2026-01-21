import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { generateCampaignEmail, CampaignType } from "@/lib/email/templates";
import { randomBytes } from "crypto";

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

  // Check if client has an active intake link, or create one
  const { data: existingLinks } = await supabase
    .from("intake_links")
    .select("id, token, used_at, expires_at")
    .eq("client_id", id)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1);

  let intakeToken: string;

  if (existingLinks && existingLinks.length > 0) {
    // Use existing active link
    intakeToken = existingLinks[0].token;
  } else {
    // Create new personalized intake link
    intakeToken = randomBytes(16).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { error: linkError } = await supabase.from("intake_links").insert({
      client_id: id,
      token: intakeToken,
      email: client.email,
      expires_at: expiresAt.toISOString(),
      created_by: user.id,
      prefill_first_name: client.first_name,
      prefill_last_name: client.last_name,
    });

    if (linkError) {
      console.error("Error creating intake link:", linkError);
      // Fall back to generic link if intake link creation fails
      intakeToken = "new";
    }
  }

  const intakeUrl = `${baseUrl}/intake/${intakeToken}`;

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
    personalizedLink: intakeToken !== "new",
  });
}
