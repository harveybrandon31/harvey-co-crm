import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash, createCipheriv, randomBytes } from "crypto";
import { sendEmail } from "@/lib/email/resend";
import {
  generateIntakeNotificationEmail,
  generateClientWelcomeEmail,
} from "@/lib/email/templates";

// Use service role for public intake submissions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

// Simple encryption for SSN (in production, use a proper KMS)
function encryptSSN(ssn: string): string {
  const key = process.env.SSN_ENCRYPTION_KEY || "default-key-change-in-production-32";
  const keyBuffer = createHash("sha256").update(key).digest();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", keyBuffer, iv);
  let encrypted = cipher.update(ssn.replace(/-/g, ""), "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

interface IntakeSubmission {
  token: string;
  linkId: string;
  clientId: string | null;
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    ssn: string;
    addressStreet: string;
    addressCity: string;
    addressState: string;
    addressZip: string;
    filingStatus: string;
    hasSpouse: boolean;
    spouseFirstName: string;
    spouseLastName: string;
    spouseDob: string;
    spouseSsn: string;
    dependents: Array<{
      id: string;
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      ssn: string;
      relationship: string;
      monthsLivedWith: number;
    }>;
    hasW2Income: boolean;
    w2EmployerCount: number;
    has1099Income: boolean;
    incomeTypes: string[];
    hasCryptoTransactions: boolean;
    hasStockSales: boolean;
    hasRentalIncome: boolean;
    hasForeignIncome: boolean;
    itemizeDeductions: boolean;
    hasMortgageInterest: boolean;
    hasCharitableDonations: boolean;
    hasStudentLoanInterest: boolean;
    hasMedicalExpenses: boolean;
    hasBusinessExpenses: boolean;
    hasChildcare: boolean;
    hasEducationExpenses: boolean;
    otherDeductions: string;
    uploadedDocuments: Array<{
      id: string;
      name: string;
      category: string;
      filePath?: string;
      fileType?: string;
      fileSize?: number;
    }>;
    additionalNotes: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: IntakeSubmission = await request.json();
    const { token, linkId, formData } = body;

    const supabase = getSupabaseAdmin();

    // Check if this is a self-service submission (no pre-generated link)
    const isSelfService = token === "self-service" || linkId === "self-service";

    let link = null;
    let userId = null;

    if (!isSelfService) {
      // Validate the intake link
      const { data: linkData, error: linkError } = await supabase
        .from("intake_links")
        .select("*")
        .eq("id", linkId)
        .eq("token", token)
        .single();

      if (linkError || !linkData) {
        return NextResponse.json(
          { error: "Invalid intake link" },
          { status: 400 }
        );
      }

      if (new Date(linkData.expires_at) < new Date()) {
        return NextResponse.json(
          { error: "This link has expired" },
          { status: 400 }
        );
      }

      if (linkData.used_at) {
        return NextResponse.json(
          { error: "This link has already been used" },
          { status: 400 }
        );
      }

      link = linkData;
      userId = link.created_by;
    }

    // For self-service, we need a default user ID or handle it differently
    // In production, you'd want to assign to a default preparer or leave unassigned

    // Create or update the client record
    const clientData: Record<string, unknown> = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email || null,
      phone: formData.phone || null,
      date_of_birth: formData.dateOfBirth || null,
      ssn_encrypted: formData.ssn ? encryptSSN(formData.ssn) : null,
      ssn_last_four: formData.ssn ? formData.ssn.slice(-4) : null,
      address_street: formData.addressStreet || null,
      address_city: formData.addressCity || null,
      address_state: formData.addressState || null,
      address_zip: formData.addressZip || null,
      filing_status: formData.filingStatus || null,
      has_spouse: formData.hasSpouse,
      spouse_first_name: formData.hasSpouse ? formData.spouseFirstName : null,
      spouse_last_name: formData.hasSpouse ? formData.spouseLastName : null,
      spouse_dob: formData.hasSpouse && formData.spouseDob ? formData.spouseDob : null,
      spouse_ssn_encrypted:
        formData.hasSpouse && formData.spouseSsn
          ? encryptSSN(formData.spouseSsn)
          : null,
      status: isSelfService ? "prospect" : "active",
      intake_completed: true,
      intake_completed_at: new Date().toISOString(),
      pipeline_status: "new_intake",
    };

    // Only set user_id if we have one (from a link)
    if (userId) {
      clientData.user_id = userId;
    }

    let clientId = link?.client_id || null;

    if (clientId) {
      // Update existing client
      const { error: updateError } = await supabase
        .from("clients")
        .update(clientData)
        .eq("id", clientId);

      if (updateError) {
        console.error("Error updating client:", updateError);
        return NextResponse.json(
          { error: `Failed to update client record: ${updateError.message}` },
          { status: 500 }
        );
      }
    } else {
      // Create new client
      const { data: newClient, error: createError } = await supabase
        .from("clients")
        .insert(clientData)
        .select()
        .single();

      if (createError || !newClient) {
        console.error("Error creating client:", createError);
        return NextResponse.json(
          { error: `Failed to create client record: ${createError?.message || 'Unknown error'}` },
          { status: 500 }
        );
      }

      clientId = newClient.id;
    }

    // Save dependents
    if (formData.dependents.length > 0) {
      // First delete existing dependents for this client
      await supabase.from("dependents").delete().eq("client_id", clientId);

      // Insert new dependents
      const dependentsData = formData.dependents.map((dep) => ({
        client_id: clientId,
        first_name: dep.firstName,
        last_name: dep.lastName,
        date_of_birth: dep.dateOfBirth || null,
        ssn_encrypted: dep.ssn ? encryptSSN(dep.ssn) : null,
        relationship: dep.relationship || null,
        months_lived_with: dep.monthsLivedWith,
      }));

      console.log("Attempting to save dependents:", JSON.stringify(dependentsData, null, 2));

      const { data: depData, error: depError } = await supabase
        .from("dependents")
        .insert(dependentsData)
        .select();

      if (depError) {
        console.error("Error saving dependents:", depError);
        console.error("Dependents data attempted:", JSON.stringify(dependentsData));
        // Return error to user so they know dependents weren't saved
        return NextResponse.json(
          {
            error: `Failed to save dependents: ${depError.message}`,
            details: depError,
            clientId
          },
          { status: 500 }
        );
      }

      console.log("Successfully saved dependents:", depData?.length, "records");
    }

    // Save uploaded documents
    if (formData.uploadedDocuments.length > 0) {
      const docsWithPaths = formData.uploadedDocuments.filter(doc => doc.filePath);

      if (docsWithPaths.length > 0) {
        const documentsData = docsWithPaths.map((doc) => ({
          client_id: clientId,
          name: doc.name,
          file_path: doc.filePath,
          file_type: doc.fileType || null,
          file_size: doc.fileSize || null,
          category: doc.category || "other",
          tax_year: new Date().getFullYear(),
        }));

        console.log("Attempting to save documents:", JSON.stringify(documentsData, null, 2));

        const { data: docData, error: docError } = await supabase
          .from("documents")
          .insert(documentsData)
          .select();

        if (docError) {
          console.error("Error saving documents:", docError);
          console.error("Documents data attempted:", JSON.stringify(documentsData));
          // Don't fail submission for document errors, just log
        } else {
          console.log("Successfully saved documents:", docData?.length, "records");
        }
      }
    }

    // Save intake responses
    const taxYear = new Date().getFullYear();
    const intakeResponses = [
      // Income
      { step: 5, key: "has_w2_income", value: formData.hasW2Income, type: "boolean" },
      { step: 5, key: "w2_employer_count", value: formData.w2EmployerCount, type: "number" },
      { step: 5, key: "has_1099_income", value: formData.has1099Income, type: "boolean" },
      { step: 5, key: "income_types", value: formData.incomeTypes, type: "array" },
      { step: 5, key: "has_crypto", value: formData.hasCryptoTransactions, type: "boolean" },
      { step: 5, key: "has_stock_sales", value: formData.hasStockSales, type: "boolean" },
      { step: 5, key: "has_rental_income", value: formData.hasRentalIncome, type: "boolean" },
      { step: 5, key: "has_foreign_income", value: formData.hasForeignIncome, type: "boolean" },
      // Deductions
      { step: 6, key: "itemize_deductions", value: formData.itemizeDeductions, type: "boolean" },
      { step: 6, key: "has_mortgage_interest", value: formData.hasMortgageInterest, type: "boolean" },
      { step: 6, key: "has_charitable", value: formData.hasCharitableDonations, type: "boolean" },
      { step: 6, key: "has_student_loan", value: formData.hasStudentLoanInterest, type: "boolean" },
      { step: 6, key: "has_medical", value: formData.hasMedicalExpenses, type: "boolean" },
      { step: 6, key: "has_business", value: formData.hasBusinessExpenses, type: "boolean" },
      { step: 6, key: "has_childcare", value: formData.hasChildcare, type: "boolean" },
      { step: 6, key: "has_education", value: formData.hasEducationExpenses, type: "boolean" },
      { step: 6, key: "other_deductions", value: formData.otherDeductions, type: "text" },
      // Notes
      { step: 8, key: "additional_notes", value: formData.additionalNotes, type: "text" },
    ];

    const responsesData = intakeResponses.map((r) => ({
      client_id: clientId,
      tax_year: taxYear,
      step_number: r.step,
      question_key: r.key,
      // Ensure response_value is properly serialized for JSONB
      response_value: r.value === undefined ? null : r.value,
      response_type: r.type,
    }));

    console.log("Attempting to save intake responses:", JSON.stringify(responsesData, null, 2));

    const { data: responseData, error: responseError } = await supabase
      .from("intake_responses")
      .insert(responsesData)
      .select();

    if (responseError) {
      console.error("Error saving intake responses:", responseError);
      console.error("Response data attempted:", JSON.stringify(responsesData));
      // Return error to user so they know responses weren't saved
      return NextResponse.json(
        {
          error: `Failed to save intake responses: ${responseError.message}`,
          details: responseError,
          clientId // Still return clientId so they can retry
        },
        { status: 500 }
      );
    }

    console.log("Successfully saved intake responses:", responseData?.length, "records");

    // Mark the intake link as used (only if not self-service)
    if (!isSelfService && link) {
      const { error: markUsedError } = await supabase
        .from("intake_links")
        .update({
          used_at: new Date().toISOString(),
          client_id: clientId,
        })
        .eq("id", linkId);

      if (markUsedError) {
        console.error("Error marking link as used:", markUsedError);
      }
    }

    // Create a task for the preparer to review the intake
    const taskData: Record<string, unknown> = {
      client_id: clientId,
      title: `Review intake for ${formData.firstName} ${formData.lastName}`,
      description: isSelfService
        ? "New self-service intake form submitted. Review information and reach out to client."
        : "New client intake form submitted. Review information and request any missing documents.",
      status: "pending",
      priority: isSelfService ? "medium" : "high",
    };
    if (userId) {
      taskData.assigned_to = userId;
      taskData.created_by = userId;
    }
    const { error: taskError } = await supabase.from("tasks").insert(taskData);
    if (taskError) {
      console.error("Error creating review task:", taskError);
      console.error("Task data attempted:", JSON.stringify(taskData));
    }

    // Log the activity
    const activityData: Record<string, unknown> = {
      client_id: clientId,
      action: "intake_completed",
      description: isSelfService
        ? "Client intake completed via self-service form"
        : "Client intake completed via secure link",
    };
    if (userId) {
      activityData.user_id = userId;
    }
    await supabase.from("activity_log").insert(activityData);

    // Send email notifications (non-blocking)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const staffEmail = process.env.STAFF_NOTIFICATION_EMAIL;

    // Build income types list for email
    const incomeTypes: string[] = [];
    if (formData.hasW2Income) incomeTypes.push(`W-2 Income (${formData.w2EmployerCount} employer${formData.w2EmployerCount > 1 ? "s" : ""})`);
    if (formData.has1099Income) incomeTypes.push("1099/Self-Employment Income");
    if (formData.hasStockSales) incomeTypes.push("Stock/Investment Sales");
    if (formData.hasCryptoTransactions) incomeTypes.push("Cryptocurrency Transactions");
    if (formData.hasRentalIncome) incomeTypes.push("Rental Income");
    if (formData.hasForeignIncome) incomeTypes.push("Foreign Income/Accounts");
    incomeTypes.push(...formData.incomeTypes);

    // Send staff notification email
    if (staffEmail) {
      try {
        const { subject, html, text } = generateIntakeNotificationEmail(
          {
            clientName: `${formData.firstName} ${formData.lastName}`,
            clientEmail: formData.email,
            clientPhone: formData.phone || undefined,
            filingStatus: formData.filingStatus,
            hasDependents: formData.dependents.length > 0,
            dependentCount: formData.dependents.length,
            incomeTypes,
            submittedAt: new Date().toISOString(),
            clientId: clientId || undefined,
          },
          baseUrl
        );

        await sendEmail({
          to: staffEmail,
          subject,
          html,
          text,
        });
      } catch (emailError) {
        console.error("Error sending staff notification email:", emailError);
        // Don't fail the submission for email errors
      }
    }

    // Send welcome email to client
    if (formData.email) {
      try {
        const { subject, html, text } = generateClientWelcomeEmail(
          formData.firstName
        );

        await sendEmail({
          to: formData.email,
          subject,
          html,
          text,
        });
      } catch (emailError) {
        console.error("Error sending client welcome email:", emailError);
        // Don't fail the submission for email errors
      }
    }

    return NextResponse.json({
      success: true,
      clientId,
      message: "Intake form submitted successfully",
    });
  } catch (error) {
    console.error("Error processing intake submission:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `An unexpected error occurred: ${errorMessage}` },
      { status: 500 }
    );
  }
}
