import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSMS, isValidPhoneNumber } from "@/lib/sms/twilio";
import { fillTemplate, getTemplate, SMSTemplateType } from "@/lib/sms/templates";

interface SendSMSRequest {
  clientId: string;
  clientPhone: string;
  clientName: string;
  templateId?: SMSTemplateType;
  customMessage?: string;
  templateValues?: Record<string, string>;
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

    const body: SendSMSRequest = await request.json();
    const { clientId, clientPhone, clientName, templateId, customMessage, templateValues } = body;

    // Validate phone number
    if (!clientPhone || !isValidPhoneNumber(clientPhone)) {
      return NextResponse.json(
        { error: "Invalid or missing phone number" },
        { status: 400 }
      );
    }

    // Determine the message to send
    let messageBody: string;

    if (customMessage) {
      messageBody = customMessage;
    } else if (templateId) {
      const template = getTemplate(templateId);
      if (!template) {
        return NextResponse.json(
          { error: "Invalid template ID" },
          { status: 400 }
        );
      }

      // Get first name from client name
      const firstName = clientName.split(" ")[0];
      const values = {
        firstName,
        ...templateValues,
      };

      messageBody = fillTemplate(template.template, values);
    } else {
      return NextResponse.json(
        { error: "Either templateId or customMessage is required" },
        { status: 400 }
      );
    }

    // Send the SMS
    const result = await sendSMS({
      to: clientPhone,
      body: messageBody,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send SMS" },
        { status: 500 }
      );
    }

    // Log the activity
    await supabase.from("activity_log").insert({
      user_id: user.id,
      client_id: clientId,
      action: "sms_sent",
      description: `SMS sent to ${clientPhone}`,
      metadata: {
        messageId: result.messageId,
        templateId: templateId || "custom",
        messagePreview: messageBody.substring(0, 100),
      },
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: "SMS sent successfully",
    });
  } catch (error) {
    console.error("Error sending SMS:", error);
    return NextResponse.json(
      { error: "Failed to send SMS" },
      { status: 500 }
    );
  }
}
