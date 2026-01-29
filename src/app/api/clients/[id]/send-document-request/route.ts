import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { generateDocumentRequestEmail } from "@/lib/email/templates";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";

const resend = new Resend(process.env.RESEND_API_KEY);

interface DocumentItem {
  name: string;
  description?: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const body = await request.json();
    const { documents } = body as { documents: DocumentItem[] };

    if (!documents || documents.length === 0) {
      return NextResponse.json(
        { error: "No documents specified" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Get client info
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, first_name, last_name, email")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    if (!client.email) {
      return NextResponse.json(
        { error: "Client has no email address" },
        { status: 400 }
      );
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Generate upload token
    const token = randomBytes(16).toString("hex");

    // Create task (with id returned for linking)
    const { data: task } = await adminSupabase
      .from("tasks")
      .insert({
        client_id: clientId,
        title: `Collect ${documents.length} document${documents.length > 1 ? "s" : ""} from ${client.first_name}`,
        description: `Documents requested:\n${documents.map((d) => `- ${d.name}`).join("\n")}`,
        priority: "high",
        status: "pending",
        created_by: null,
      })
      .select("id")
      .single();

    // Create document request record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data: docRequest, error: reqError } = await adminSupabase
      .from("document_requests")
      .insert({
        client_id: clientId,
        token,
        status: "pending",
        expires_at: expiresAt.toISOString(),
        created_by: user?.id || null,
        task_id: task?.id || null,
      })
      .select("id")
      .single();

    if (reqError || !docRequest) {
      console.error("Error creating document request:", reqError);
      return NextResponse.json(
        { error: "Failed to create document request" },
        { status: 500 }
      );
    }

    // Create document request items
    const itemRows = documents.map((doc) => ({
      document_request_id: docRequest.id,
      name: doc.name,
      description: doc.description || null,
    }));

    const { error: itemsError } = await adminSupabase
      .from("document_request_items")
      .insert(itemRows);

    if (itemsError) {
      console.error("Error creating document request items:", itemsError);
    }

    // Build upload URL
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = headersList.get("x-forwarded-proto") || "https";
    const baseUrl = `${protocol}://${host}`;
    const uploadUrl = `${baseUrl}/upload/${token}`;

    // Generate email with upload URL
    const email = generateDocumentRequestEmail(
      client.first_name,
      documents,
      uploadUrl
    );

    // Send email
    const { error: sendError } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Harvey & Co <team@harveynco.com>",
      to: client.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });

    if (sendError) {
      console.error("Error sending document request email:", sendError);
      return NextResponse.json(
        { error: "Failed to send email", details: sendError.message },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from("activity_log").insert({
      client_id: clientId,
      activity_type: "email_sent",
      description: `Document request email sent (${documents.length} documents)`,
      metadata: {
        email_type: "document_request",
        documents: documents.map((d) => d.name),
        sent_to: client.email,
        upload_url: uploadUrl,
        document_request_id: docRequest.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Document request sent to ${client.email}`,
      documentsRequested: documents.length,
      uploadUrl,
    });
  } catch (error) {
    console.error("Error in document request API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
