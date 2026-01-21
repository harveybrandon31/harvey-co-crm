import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import {
  generateDeadlineReminderEmail,
  type DeadlineReminder,
} from "@/lib/email/templates";
import { mockTaxReturns, mockClients, DEMO_MODE } from "@/lib/mock-data";

interface TaxReturnWithClient {
  id: string;
  tax_year: number;
  return_type: string;
  due_date: string | null;
  extended_due_date: string | null;
  status: string;
  clients: {
    first_name: string;
    last_name: string;
  };
}

function getDaysUntil(dateString: string | null): number | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = date.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getRemindersFromData(data: TaxReturnWithClient[]): DeadlineReminder[] {
  return data
    .map((r) => {
      const effectiveDate = r.extended_due_date || r.due_date;
      const daysUntil = getDaysUntil(effectiveDate);

      if (daysUntil === null) return null;

      return {
        clientName: `${r.clients.first_name} ${r.clients.last_name}`,
        taxYear: r.tax_year,
        returnType: r.return_type,
        dueDate: effectiveDate ? new Date(effectiveDate).toLocaleDateString() : "Not set",
        daysUntil,
        status: r.status,
        returnId: r.id,
      };
    })
    .filter((r): r is DeadlineReminder => r !== null)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

// GET - Fetch upcoming deadlines (for manual check)
export async function GET(request: NextRequest) {
  // In demo mode, skip auth and return mock data
  if (DEMO_MODE) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);

    const pendingStatuses = ["not_started", "in_progress", "pending_review", "pending_client", "ready_to_file"];

    const mockData: TaxReturnWithClient[] = mockTaxReturns
      .filter((r) => pendingStatuses.includes(r.status) && r.due_date)
      .map((r) => {
        const client = mockClients.find((c) => c.id === r.client_id);
        return {
          id: r.id,
          tax_year: r.tax_year,
          return_type: r.return_type,
          due_date: r.due_date,
          extended_due_date: r.extended_due_date,
          status: r.status,
          clients: {
            first_name: client?.first_name || "",
            last_name: client?.last_name || "",
          },
        };
      });

    const reminders = getRemindersFromData(mockData);
    return NextResponse.json({ reminders, count: reminders.length });
  }

  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Check for cron secret or user authentication
  if (authHeader !== `Bearer ${cronSecret}`) {
    // Try user authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = await createClient();

  // Get returns due within 30 days
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + 30);

  const { data, error } = await supabase
    .from("tax_returns")
    .select("id, tax_year, return_type, due_date, extended_due_date, status, clients(first_name, last_name)")
    .in("status", ["not_started", "in_progress", "pending_review", "pending_client", "ready_to_file"])
    .or(`due_date.lte.${futureDate.toISOString()},extended_due_date.lte.${futureDate.toISOString()}`)
    .order("due_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const reminders = getRemindersFromData((data || []) as unknown as TaxReturnWithClient[]);
  return NextResponse.json({ reminders, count: reminders.length });
}

// POST - Send reminder emails
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Check for cron secret or user authentication
  let isAuthenticated = false;

  if (authHeader === `Bearer ${cronSecret}`) {
    isAuthenticated = true;
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      isAuthenticated = true;
    }
  }

  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recipientEmail = process.env.REMINDER_EMAIL_TO;
  if (!recipientEmail) {
    return NextResponse.json(
      { error: "REMINDER_EMAIL_TO not configured" },
      { status: 500 }
    );
  }

  // Parse request body for options
  let daysThreshold = 30;
  try {
    const body = await request.json();
    if (body.daysThreshold) {
      daysThreshold = body.daysThreshold;
    }
  } catch {
    // Use default if no body
  }

  const supabase = await createClient();

  // Get returns due within threshold
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysThreshold);

  const { data, error } = await supabase
    .from("tax_returns")
    .select("id, tax_year, return_type, due_date, extended_due_date, status, clients(first_name, last_name)")
    .in("status", ["not_started", "in_progress", "pending_review", "pending_client", "ready_to_file"])
    .or(`due_date.lte.${futureDate.toISOString()},extended_due_date.lte.${futureDate.toISOString()}`)
    .order("due_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const reminders: DeadlineReminder[] = ((data || []) as unknown as TaxReturnWithClient[])
    .map((r) => {
      const effectiveDate = r.extended_due_date || r.due_date;
      const daysUntil = getDaysUntil(effectiveDate);

      if (daysUntil === null) return null;

      return {
        clientName: `${r.clients.first_name} ${r.clients.last_name}`,
        taxYear: r.tax_year,
        returnType: r.return_type,
        dueDate: effectiveDate ? new Date(effectiveDate).toLocaleDateString() : "Not set",
        daysUntil,
        status: r.status,
        returnId: r.id,
      };
    })
    .filter((r): r is DeadlineReminder => r !== null)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  if (reminders.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No upcoming deadlines to remind about",
      sent: false,
    });
  }

  // Generate and send email
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const emailContent = generateDeadlineReminderEmail(reminders, baseUrl);

  const result = await sendEmail({
    to: recipientEmail,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error, sent: false },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    sent: true,
    emailId: result.id,
    reminderCount: reminders.length,
    urgentCount: reminders.filter((r) => r.daysUntil <= 7).length,
  });
}
