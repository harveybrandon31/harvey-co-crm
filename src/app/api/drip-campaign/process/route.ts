import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/resend";
import { generateCampaignEmail, CampaignType } from "@/lib/email/templates";

// Use service role for cron job
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

interface EnrollmentWithDetails {
  id: string;
  client_id: string;
  campaign_name: string;
  intake_link_id: string | null;
  current_stage: number;
  status: string;
  next_email_due_at: string | null;
  clients: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  intake_links: {
    id: string;
    token: string;
    used_at: string | null;
  } | null;
}

// Campaign stages configuration
const CAMPAIGN_CONFIG: Record<number, { type: CampaignType; daysUntilNext: number | null }> = {
  1: { type: "intro", daysUntilNext: 2 },
  2: { type: "refund_amounts", daysUntilNext: 3 },
  3: { type: "urgency", daysUntilNext: null },
};

// POST - Process follow-up emails (called by cron)
export async function POST(request: NextRequest) {
  // Verify cron secret or admin auth
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://app.harveynco.com";
  const now = new Date().toISOString();

  // Get all active enrollments where next_email_due_at has passed
  const { data: enrollments, error: fetchError } = await supabase
    .from("campaign_enrollments")
    .select(`
      id,
      client_id,
      campaign_name,
      intake_link_id,
      current_stage,
      status,
      next_email_due_at,
      clients (
        id,
        first_name,
        last_name,
        email
      ),
      intake_links (
        id,
        token,
        used_at
      )
    `)
    .eq("status", "active")
    .lte("next_email_due_at", now);

  if (fetchError) {
    console.error("Error fetching enrollments:", fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!enrollments || enrollments.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No follow-ups due",
      processed: 0,
    });
  }

  let processed = 0;
  let completed = 0;
  let advanced = 0;
  let errors = 0;

  for (const enrollment of enrollments as unknown as EnrollmentWithDetails[]) {
    try {
      // Check if intake link was used (client completed form)
      if (enrollment.intake_links?.used_at) {
        // Mark as completed - they took action!
        await supabase
          .from("campaign_enrollments")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            next_email_due_at: null,
          })
          .eq("id", enrollment.id);

        completed++;
        processed++;
        continue;
      }

      // Check if already at final stage
      if (enrollment.current_stage >= 3) {
        // Final stage reached and no action - mark as completed (sequence finished)
        await supabase
          .from("campaign_enrollments")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            next_email_due_at: null,
          })
          .eq("id", enrollment.id);

        completed++;
        processed++;
        continue;
      }

      // Advance to next stage
      const nextStage = enrollment.current_stage + 1;
      const stageConfig = CAMPAIGN_CONFIG[nextStage];

      if (!stageConfig) {
        console.error(`Invalid stage ${nextStage} for enrollment ${enrollment.id}`);
        errors++;
        continue;
      }

      // Get client details
      const client = enrollment.clients;
      if (!client?.email) {
        console.error(`No email for client ${enrollment.client_id}`);
        errors++;
        continue;
      }

      // Get intake link token for personalized URL
      const token = enrollment.intake_links?.token;
      const intakeUrl = token
        ? `${baseUrl}/intake/${token}`
        : `${baseUrl}/intake/new`;

      // Generate and send the next email
      const firstName = client.first_name || "Valued Client";
      const emailContent = generateCampaignEmail(stageConfig.type, firstName, intakeUrl);

      const emailResult = await sendEmail({
        to: client.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      if (!emailResult.success) {
        console.error(`Failed to send email to ${client.email}:`, emailResult.error);
        errors++;
        continue;
      }

      // Calculate next email due date
      let nextEmailDue: string | null = null;
      if (stageConfig.daysUntilNext) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + stageConfig.daysUntilNext);
        nextEmailDue = nextDate.toISOString();
      }

      // Update enrollment
      await supabase
        .from("campaign_enrollments")
        .update({
          current_stage: nextStage,
          last_email_sent_at: new Date().toISOString(),
          next_email_due_at: nextEmailDue,
        })
        .eq("id", enrollment.id);

      advanced++;
      processed++;
    } catch (err) {
      console.error(`Error processing enrollment ${enrollment.id}:`, err);
      errors++;
    }
  }

  return NextResponse.json({
    success: true,
    processed,
    completed,
    advanced,
    errors,
  });
}

// GET - Get processing stats (for manual check)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Allow cron secret or check for user auth
  if (authHeader !== `Bearer ${cronSecret}`) {
    const { createClient: createServerClient } = await import("@/lib/supabase/server");
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  // Get count of enrollments due for processing
  const { count: dueCount } = await supabase
    .from("campaign_enrollments")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .lte("next_email_due_at", now);

  // Get count by stage
  const { data: stageData } = await supabase
    .from("campaign_enrollments")
    .select("current_stage, status")
    .eq("status", "active");

  const byStage = {
    stage1: stageData?.filter((e) => e.current_stage === 1).length || 0,
    stage2: stageData?.filter((e) => e.current_stage === 2).length || 0,
    stage3: stageData?.filter((e) => e.current_stage === 3).length || 0,
  };

  return NextResponse.json({
    dueForProcessing: dueCount || 0,
    activeByStage: byStage,
    checkedAt: now,
  });
}
