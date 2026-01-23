import { NextResponse } from "next/server";
import { Resend } from "resend";
import { generateDocumentRequestEmail } from "@/lib/email/templates";
import { createClient } from "@/lib/supabase/server";

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

    // Generate email
    const email = generateDocumentRequestEmail(client.first_name, documents);

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
      },
    });

    // Create a task to track document receipt
    await supabase.from("tasks").insert({
      client_id: clientId,
      title: `Collect ${documents.length} document${documents.length > 1 ? "s" : ""} from ${client.first_name}`,
      description: `Documents requested:\n${documents.map((d) => `- ${d.name}`).join("\n")}`,
      priority: "high",
      status: "pending",
      created_by: null,
    });

    return NextResponse.json({
      success: true,
      message: `Document request sent to ${client.email}`,
      documentsRequested: documents.length,
    });
  } catch (error) {
    console.error("Error in document request API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
