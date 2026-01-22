import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";

interface MissingDocument {
  name: string;
  description: string;
}

interface ReminderRequest {
  clientId: string;
  clientName: string;
  clientEmail: string;
  missingDocuments: MissingDocument[];
}

function generateDocumentReminderEmail(
  clientName: string,
  missingDocuments: MissingDocument[]
): { subject: string; html: string; text: string } {
  const firstName = clientName.split(" ")[0];
  const documentList = missingDocuments
    .map((doc) => `<li style="margin-bottom: 8px;"><strong>${doc.name}</strong><br/><span style="color: #666; font-size: 14px;">${doc.description}</span></li>`)
    .join("");
  const textDocumentList = missingDocuments
    .map((doc) => `- ${doc.name}: ${doc.description}`)
    .join("\n");

  const subject = `Reminder: Documents needed for your tax return`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Georgia, 'Times New Roman', serif; background-color: #F5F3EF; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F3EF; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #2D4A43; padding: 30px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: normal;">
                Harvey & Co<span style="color: #C9A962;">.</span>
              </h1>
              <p style="color: #C9A962; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
                Financial Services
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #2D4A43; margin: 0 0 20px 0; font-size: 22px;">
                Hi ${firstName},
              </h2>

              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We're making great progress on your tax return! To keep things moving, we still need the following documents from you:
              </p>

              <div style="background-color: #FEF3C7; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #92400E; margin: 0 0 12px 0; font-size: 16px;">
                  Documents Still Needed:
                </h3>
                <ul style="color: #333; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  ${documentList}
                </ul>
              </div>

              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                You can upload these documents by replying to this email with attachments, or by logging into your client portal.
              </p>

              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                If you have any questions about what's needed, please don't hesitate to reach out.
              </p>

              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                Thank you!<br/>
                <strong style="color: #2D4A43;">The Harvey & Co Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F5F3EF; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="color: #666; font-size: 12px; margin: 0;">
                Harvey & Co Financial Services<br/>
                Tax Preparation with a Personal Touch
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Hi ${firstName},

We're making great progress on your tax return! To keep things moving, we still need the following documents from you:

DOCUMENTS STILL NEEDED:
${textDocumentList}

You can upload these documents by replying to this email with attachments, or by logging into your client portal.

If you have any questions about what's needed, please don't hesitate to reach out.

Thank you!
The Harvey & Co Team
  `;

  return { subject, html, text };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify the user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ReminderRequest = await request.json();
    const { clientId, clientName, clientEmail, missingDocuments } = body;

    if (!clientEmail) {
      return NextResponse.json(
        { error: "Client email is required" },
        { status: 400 }
      );
    }

    if (!missingDocuments || missingDocuments.length === 0) {
      return NextResponse.json(
        { error: "No missing documents specified" },
        { status: 400 }
      );
    }

    // Generate and send the email
    const { subject, html, text } = generateDocumentReminderEmail(
      clientName,
      missingDocuments
    );

    const emailResult = await sendEmail({
      to: clientEmail,
      subject,
      html,
      text,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || "Failed to send email" },
        { status: 500 }
      );
    }

    // Log the activity
    await supabase.from("activity_log").insert({
      user_id: user.id,
      client_id: clientId,
      action: "document_reminder_sent",
      description: `Document reminder email sent for ${missingDocuments.length} missing document(s)`,
      metadata: {
        missing_documents: missingDocuments.map((d) => d.name),
      },
    });

    // Create a task to follow up if documents aren't received
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 3); // 3 days from now

    await supabase.from("tasks").insert({
      client_id: clientId,
      title: `Follow up on document request - ${clientName}`,
      description: `Check if documents have been received: ${missingDocuments.map((d) => d.name).join(", ")}`,
      status: "pending",
      priority: "normal",
      due_date: followUpDate.toISOString().split("T")[0],
      assigned_to: user.id,
      created_by: user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Reminder email sent successfully",
    });
  } catch (error) {
    console.error("Error sending document reminder:", error);
    return NextResponse.json(
      { error: "Failed to send reminder" },
      { status: 500 }
    );
  }
}
