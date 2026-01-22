import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { generateCampaignEmail } from "@/lib/email/templates";
import { randomBytes } from "crypto";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
}

// GET - Get campaign stats and enrollments
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const campaignName = request.nextUrl.searchParams.get("campaign") || "tax_season_2025";

  // Get enrollment stats
  const { data: enrollments } = await supabase
    .from("campaign_enrollments")
    .select("status, current_stage")
    .eq("campaign_name", campaignName);

  const stats = {
    total: enrollments?.length || 0,
    active: enrollments?.filter((e) => e.status === "active").length || 0,
    completed: enrollments?.filter((e) => e.status === "completed").length || 0,
    unsubscribed: enrollments?.filter((e) => e.status === "unsubscribed").length || 0,
    stage1: enrollments?.filter((e) => e.current_stage === 1 && e.status === "active").length || 0,
    stage2: enrollments?.filter((e) => e.current_stage === 2 && e.status === "active").length || 0,
    stage3: enrollments?.filter((e) => e.current_stage === 3 && e.status === "active").length || 0,
  };

  // Get clients with email who are NOT enrolled yet
  const { count: clientsWithEmail } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .not("email", "is", null)
    .neq("email", "");

  const { count: enrolledCount } = await supabase
    .from("campaign_enrollments")
    .select("*", { count: "exact", head: true })
    .eq("campaign_name", campaignName);

  return NextResponse.json({
    campaignName,
    stats,
    clientsWithEmail: clientsWithEmail || 0,
    notEnrolled: (clientsWithEmail || 0) - (enrolledCount || 0),
  });
}

// POST - Start drip campaign or process action
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let action = "start";
  let campaignName = "tax_season_2025";
  let clientIds: string[] | null = null;

  try {
    const body = await request.json();
    action = body.action || "start";
    campaignName = body.campaignName || "tax_season_2025";
    clientIds = body.clientIds || null;
  } catch {
    // Use defaults
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://app.harveynco.com";

  if (action === "start") {
    // Get all clients with email who are NOT already enrolled in this campaign
    let query = supabase
      .from("clients")
      .select("id, first_name, last_name, email")
      .not("email", "is", null)
      .neq("email", "");

    if (clientIds && clientIds.length > 0) {
      query = query.in("id", clientIds);
    }

    const { data: clients, error: clientsError } = await query;

    if (clientsError) {
      return NextResponse.json({ error: clientsError.message }, { status: 500 });
    }

    if (!clients || clients.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No clients to enroll",
        enrolled: 0,
      });
    }

    // Get already enrolled client IDs
    const { data: existingEnrollments } = await supabase
      .from("campaign_enrollments")
      .select("client_id")
      .eq("campaign_name", campaignName);

    const enrolledIds = new Set(existingEnrollments?.map((e) => e.client_id) || []);

    // Filter out already enrolled clients
    const clientsToEnroll = clients.filter((c: Client) => !enrolledIds.has(c.id));

    if (clientsToEnroll.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All clients are already enrolled",
        enrolled: 0,
      });
    }

    // Limit batch size to avoid Vercel timeout (50 emails * 600ms = 30 seconds)
    const maxPerRequest = 50;
    const clientsThisBatch = clientsToEnroll.slice(0, maxPerRequest);
    const remaining = clientsToEnroll.length - clientsThisBatch.length;

    let enrolled = 0;
    let failed = 0;
    const errors: { email: string; error: string }[] = [];

    // Process one at a time to respect Resend's 2/second rate limit
    for (const client of clientsThisBatch) {
      // Add delay between emails (600ms = ~1.6 emails/second, safely under 2/second limit)
      await new Promise((resolve) => setTimeout(resolve, 600));

      const result = await (async (client: Client) => {
          if (!client.email) return { success: false, error: "No email" };

          try {
            // Create personalized intake link
            const token = randomBytes(16).toString("hex");
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);

            const { data: intakeLink, error: linkError } = await supabase
              .from("intake_links")
              .insert({
                client_id: client.id,
                token,
                email: client.email,
                expires_at: expiresAt.toISOString(),
                created_by: user.id,
                prefill_first_name: client.first_name,
                prefill_last_name: client.last_name,
              })
              .select()
              .single();

            if (linkError) {
              return { success: false, email: client.email, error: linkError.message };
            }

            // Generate intake URL with personalized token
            const intakeUrl = `${baseUrl}/intake/${token}`;

            // Send Email 1 (intro)
            const firstName = client.first_name || "Valued Client";
            const emailContent = generateCampaignEmail("intro", firstName, intakeUrl);

            const emailResult = await sendEmail({
              to: client.email,
              subject: emailContent.subject,
              html: emailContent.html,
              text: emailContent.text,
            });

            if (!emailResult.success) {
              return { success: false, email: client.email, error: emailResult.error || "Email failed" };
            }

            // Create enrollment record
            const nextEmailDue = new Date();
            nextEmailDue.setDate(nextEmailDue.getDate() + 2); // 2 days until Email 2

            const { error: enrollError } = await supabase.from("campaign_enrollments").insert({
              client_id: client.id,
              campaign_name: campaignName,
              intake_link_id: intakeLink.id,
              current_stage: 1,
              status: "active",
              last_email_sent_at: new Date().toISOString(),
              next_email_due_at: nextEmailDue.toISOString(),
            });

            if (enrollError) {
              return { success: false, email: client.email, error: enrollError.message };
            }

            return { success: true, email: client.email };
          } catch (err) {
            return {
              success: false,
              email: client.email,
              error: err instanceof Error ? err.message : "Unknown error",
            };
          }
      })(client);

      if (result.success) {
        enrolled++;
      } else {
        failed++;
        if (result.error && result.email) {
          errors.push({ email: result.email, error: result.error });
        }
      }
    }

    return NextResponse.json({
      success: true,
      enrolled,
      failed,
      total: clientsThisBatch.length,
      remaining,
      message: remaining > 0 ? `${remaining} clients remaining - click Start Campaign again to continue` : undefined,
      errors: errors.slice(0, 10),
    });
  }

  if (action === "unsubscribe") {
    const { clientId } = await request.json().catch(() => ({}));

    if (!clientId) {
      return NextResponse.json({ error: "Client ID required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("campaign_enrollments")
      .update({
        status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("client_id", clientId)
      .eq("campaign_name", campaignName);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Client unsubscribed" });
  }

  if (action === "pause") {
    const { error } = await supabase
      .from("campaign_enrollments")
      .update({ status: "paused" })
      .eq("campaign_name", campaignName)
      .eq("status", "active");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Campaign paused" });
  }

  if (action === "resume") {
    const { error } = await supabase
      .from("campaign_enrollments")
      .update({ status: "active" })
      .eq("campaign_name", campaignName)
      .eq("status", "paused");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Campaign resumed" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
