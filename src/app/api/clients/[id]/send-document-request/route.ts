import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { generateDocumentRequestEmail } from "@/lib/email/templates";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { sendSMS, isValidPhoneNumber } from "@/lib/sms/twilio";

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
    const { documents, sendViaSMS, clientPhone } = body as {
      documents: DocumentItem[];
      sendViaSMS?: boolean;
      clientPhone?: string;
    };

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

    // Log email activity
    await supabase.from("activity_log").insert({
      client_id: clientId,
      user_id: user?.id,
      action: "email_sent",
      description: `Document request email sent (${documents.length} documents)`,
      metadata: {
        email_type: "document_request",
        documents: documents.map((d) => d.name),
        sent_to: client.email,
        upload_url: uploadUrl,
        document_request_id: docRequest.id,
      },
    });

    // Send SMS if requested
    let smsSentOk = false;
    if (sendViaSMS && clientPhone && isValidPhoneNumber(clientPhone)) {
      const docNames = documents.map((d) => d.name).join(", ");
      const smsBody = `Hi ${client.first_name}! Brandon here from Harvey & Co. We need a few documents from you: ${docNames}. Please upload them here: ${uploadUrl} - Reply if you have questions!`;

      const smsResult = await sendSMS({ to: clientPhone, body: smsBody });
      smsSentOk = smsResult.success;

      if (smsResult.success) {
        await supabase.from("activity_log").insert({
          client_id: clientId,
          user_id: user?.id,
          action: "sms_sent",
          description: `Document request SMS sent to ${clientPhone}`,
          metadata: {
            messageId: smsResult.messageId,
            templateId: "document_request",
            messagePreview: smsBody.substring(0, 100),
            document_request_id: docRequest.id,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Document request sent to ${client.email}${smsSentOk ? " and via SMS" : ""}`,
      documentsRequested: documents.length,
      uploadUrl,
      smsSent: smsSentOk,
    });
  } catch (error) {
    console.error("Error in document request API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
