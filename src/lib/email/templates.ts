// Harvey & Co Brand Colors
const BRAND_PRIMARY = "#2D4A43";
const BRAND_ACCENT = "#C9A962";
const BRAND_BACKGROUND = "#F5F3EF";

export interface DeadlineReminder {
  clientName: string;
  taxYear: number;
  returnType: string;
  dueDate: string;
  daysUntil: number;
  status: string;
  returnId: string;
}

export interface IntakeSubmissionData {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  filingStatus?: string;
  hasDependents: boolean;
  dependentCount: number;
  incomeTypes: string[];
  submittedAt: string;
  clientId?: string;
}

// Email wrapper with Harvey branding
function wrapEmailTemplate(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${preheader ? `<span style="display:none !important;visibility:hidden;mso-hide:all;font-size:1px;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>` : ""}
</head>
<body style="font-family: 'Georgia', serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1A1A1A; max-width: 600px; margin: 0 auto; padding: 0; background: ${BRAND_BACKGROUND};">
  <!-- Header -->
  <div style="background: ${BRAND_PRIMARY}; color: white; padding: 32px 30px; text-align: center;">
    <h1 style="margin: 0; font-family: 'Georgia', serif; font-size: 28px; font-weight: 400; letter-spacing: 1px;">
      Harvey <span style="font-weight: 300;">&</span> Co
    </h1>
    <p style="margin: 8px 0 0 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; opacity: 0.8;">Financial Services</p>
  </div>

  <!-- Content -->
  <div style="background: white; padding: 32px 30px; border: 1px solid #E5E5E5; border-top: none;">
    ${content}
  </div>

  <!-- Footer -->
  <div style="text-align: center; padding: 24px 30px; color: #6B7280; font-size: 12px; background: ${BRAND_BACKGROUND};">
    <p style="margin: 0; font-family: 'Georgia', serif;">Harvey & Co Financial Services</p>
    <p style="margin: 8px 0 0 0; font-size: 11px;">This is an automated message from your CRM system.</p>
  </div>
</body>
</html>
  `.trim();
}

// New Intake Submission Notification (sent to staff)
export function generateIntakeNotificationEmail(
  data: IntakeSubmissionData,
  baseUrl: string
): { subject: string; html: string; text: string } {
  const subject = `New Intake Submission: ${data.clientName}`;

  const incomeList = data.incomeTypes.length > 0
    ? data.incomeTypes.map(t => `<li style="margin: 4px 0;">${t}</li>`).join("")
    : '<li style="margin: 4px 0; color: #6B7280;">None specified</li>';

  const phoneRow = data.clientPhone ? `
        <tr>
          <td style="padding: 8px 0; color: #6B7280;">Phone:</td>
          <td style="padding: 8px 0;">${data.clientPhone}</td>
        </tr>` : "";

  const viewButton = data.clientId
    ? `<a href="${baseUrl}/dashboard/clients/${data.clientId}"
         style="display: inline-block; background: ${BRAND_PRIMARY}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">
        View Client Profile
      </a>`
    : `<a href="${baseUrl}/dashboard/clients"
         style="display: inline-block; background: ${BRAND_PRIMARY}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">
        View All Clients
      </a>`;

  const content = `
    <h2 style="margin: 0 0 20px 0; font-family: 'Georgia', serif; font-size: 22px; font-weight: 500; color: #1A1A1A;">
      New Client Intake Received
    </h2>

    <p style="margin: 0 0 24px 0; color: #4B5563;">
      A new client has submitted their tax intake form. Please review the details below.
    </p>

    <div style="background: ${BRAND_BACKGROUND}; border: 1px solid #E5E5E5; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: ${BRAND_PRIMARY}; text-transform: uppercase; letter-spacing: 1px;">
        Client Information
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6B7280; width: 120px;">Name:</td>
          <td style="padding: 8px 0; font-weight: 500;">${data.clientName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6B7280;">Email:</td>
          <td style="padding: 8px 0;"><a href="mailto:${data.clientEmail}" style="color: ${BRAND_PRIMARY};">${data.clientEmail}</a></td>
        </tr>
        ${phoneRow}
        <tr>
          <td style="padding: 8px 0; color: #6B7280;">Filing Status:</td>
          <td style="padding: 8px 0;">${data.filingStatus || "Not specified"}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6B7280;">Dependents:</td>
          <td style="padding: 8px 0;">${data.hasDependents ? `Yes (${data.dependentCount})` : "No"}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6B7280;">Submitted:</td>
          <td style="padding: 8px 0;">${new Date(data.submittedAt).toLocaleString()}</td>
        </tr>
      </table>
    </div>

    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: ${BRAND_PRIMARY}; text-transform: uppercase; letter-spacing: 1px;">
        Income Sources
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: #1A1A1A;">
        ${incomeList}
      </ul>
    </div>

    <div style="text-align: center; margin-top: 32px;">
      ${viewButton}
    </div>
  `;

  const html = wrapEmailTemplate(content, `New intake from ${data.clientName}`);

  const incomeText = data.incomeTypes.length > 0
    ? data.incomeTypes.map(t => `- ${t}`).join("\n")
    : "- None specified";

  const text = `
Harvey & Co Financial Services
New Client Intake Received

A new client has submitted their tax intake form.

CLIENT INFORMATION
Name: ${data.clientName}
Email: ${data.clientEmail}
${data.clientPhone ? `Phone: ${data.clientPhone}` : ""}
Filing Status: ${data.filingStatus || "Not specified"}
Dependents: ${data.hasDependents ? `Yes (${data.dependentCount})` : "No"}
Submitted: ${new Date(data.submittedAt).toLocaleString()}

INCOME SOURCES
${incomeText}

View in dashboard: ${baseUrl}/dashboard/clients${data.clientId ? `/${data.clientId}` : ""}
  `.trim();

  return { subject, html, text };
}

// Client Welcome Email (sent to client after intake)
export function generateClientWelcomeEmail(
  clientName: string
): { subject: string; html: string; text: string } {
  const subject = "Welcome to Harvey & Co Financial Services";

  const content = `
    <h2 style="margin: 0 0 20px 0; font-family: 'Georgia', serif; font-size: 22px; font-weight: 500; color: #1A1A1A;">
      Welcome, ${clientName}!
    </h2>

    <p style="margin: 0 0 16px 0; color: #4B5563;">
      Thank you for choosing Harvey & Co Financial Services for your tax preparation needs.
      We've received your intake form and our team will review your information shortly.
    </p>

    <div style="background: ${BRAND_BACKGROUND}; border-left: 4px solid ${BRAND_ACCENT}; padding: 20px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: ${BRAND_PRIMARY};">
        What Happens Next?
      </h3>
      <ol style="margin: 0; padding-left: 20px; color: #4B5563;">
        <li style="margin: 8px 0;">Our team will review your submitted information</li>
        <li style="margin: 8px 0;">We'll reach out if we need any additional documents</li>
        <li style="margin: 8px 0;">You'll receive updates as we prepare your return</li>
        <li style="margin: 8px 0;">We'll schedule a review call before filing</li>
      </ol>
    </div>

    <p style="margin: 24px 0 0 0; color: #4B5563;">
      If you have any questions in the meantime, please don't hesitate to reach out.
    </p>

    <p style="margin: 24px 0 0 0; color: #1A1A1A;">
      Best regards,<br>
      <strong>The Harvey & Co Team</strong>
    </p>
  `;

  const html = wrapEmailTemplate(content, "Thank you for submitting your tax information");

  const text = `
Harvey & Co Financial Services

Welcome, ${clientName}!

Thank you for choosing Harvey & Co Financial Services for your tax preparation needs.
We've received your intake form and our team will review your information shortly.

WHAT HAPPENS NEXT?
1. Our team will review your submitted information
2. We'll reach out if we need any additional documents
3. You'll receive updates as we prepare your return
4. We'll schedule a review call before filing

If you have any questions in the meantime, please don't hesitate to reach out.

Best regards,
The Harvey & Co Team
  `.trim();

  return { subject, html, text };
}

export function generateDeadlineReminderEmail(
  reminders: DeadlineReminder[],
  baseUrl: string
): { subject: string; html: string; text: string } {
  const urgentCount = reminders.filter((r) => r.daysUntil <= 7).length;
  const subject =
    urgentCount > 0
      ? `[URGENT] ${urgentCount} tax return${urgentCount > 1 ? "s" : ""} due within 7 days`
      : `${reminders.length} upcoming tax return deadline${reminders.length > 1 ? "s" : ""}`;

  const reminderItems = reminders
    .map((r) => {
      const urgencyColor =
        r.daysUntil < 0
          ? "#dc2626"
          : r.daysUntil <= 7
          ? "#ea580c"
          : r.daysUntil <= 14
          ? "#ca8a04"
          : "#059669";
      const urgencyBg =
        r.daysUntil < 0
          ? "#fef2f2"
          : r.daysUntil <= 7
          ? "#fff7ed"
          : r.daysUntil <= 14
          ? "#fefce8"
          : "#f0fdf4";
      const urgencyText =
        r.daysUntil < 0
          ? `${Math.abs(r.daysUntil)} days overdue`
          : r.daysUntil === 0
          ? "Due today"
          : r.daysUntil === 1
          ? "Due tomorrow"
          : `${r.daysUntil} days remaining`;

      return `
    <div style="background: white; border: 1px solid #E5E5E5; border-left: 4px solid ${urgencyColor}; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <h3 style="margin: 0 0 4px 0; font-size: 16px; color: #1A1A1A; font-family: 'Georgia', serif;">${r.clientName}</h3>
          <p style="margin: 0; font-size: 14px; color: #6B7280;">${r.taxYear} ${r.returnType} &bull; ${r.status.replace(/_/g, " ")}</p>
        </div>
        <div style="text-align: right;">
          <span style="background: ${urgencyBg}; color: ${urgencyColor}; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${urgencyText}</span>
          <p style="margin: 8px 0 0 0; font-size: 13px; color: #6B7280;">Due: ${r.dueDate}</p>
        </div>
      </div>
      <a href="${baseUrl}/dashboard/returns/${r.returnId}" style="display: inline-block; margin-top: 12px; color: ${BRAND_PRIMARY}; font-size: 13px; text-decoration: none; font-weight: 500;">View Return &rarr;</a>
    </div>
      `;
    })
    .join("");

  const content = `
    <h2 style="margin: 0 0 20px 0; font-family: 'Georgia', serif; font-size: 22px; font-weight: 500; color: #1A1A1A;">
      Deadline Reminder
    </h2>

    <p style="margin: 0 0 24px 0; color: #4B5563;">
      You have <strong>${reminders.length}</strong> tax return${reminders.length > 1 ? "s" : ""} with upcoming deadlines:
    </p>

    ${reminderItems}

    <div style="margin-top: 32px; text-align: center;">
      <a href="${baseUrl}/dashboard" style="display: inline-block; background: ${BRAND_PRIMARY}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">Go to Dashboard</a>
    </div>
  `;

  const html = wrapEmailTemplate(content, `${reminders.length} tax return deadline${reminders.length > 1 ? "s" : ""} approaching`);

  const text = `
Harvey & Co Financial Services - Deadline Reminder

You have ${reminders.length} tax return${reminders.length > 1 ? "s" : ""} with upcoming deadlines:

${reminders
  .map((r) => {
    const urgencyText =
      r.daysUntil < 0
        ? `${Math.abs(r.daysUntil)} days overdue`
        : r.daysUntil === 0
        ? "Due today"
        : r.daysUntil === 1
        ? "Due tomorrow"
        : `${r.daysUntil} days remaining`;

    return `- ${r.clientName}
  ${r.taxYear} ${r.returnType} (${r.status.replace(/_/g, " ")})
  Due: ${r.dueDate} (${urgencyText})
  View: ${baseUrl}/dashboard/returns/${r.returnId}
`;
  })
  .join("\n")}

View all in dashboard: ${baseUrl}/dashboard
  `.trim();

  return { subject, html, text };
}

export function generateSingleReminderEmail(
  reminder: DeadlineReminder,
  baseUrl: string
): { subject: string; html: string; text: string } {
  const urgencyText =
    reminder.daysUntil < 0
      ? `${Math.abs(reminder.daysUntil)} days overdue`
      : reminder.daysUntil === 0
      ? "due today"
      : reminder.daysUntil === 1
      ? "due tomorrow"
      : `due in ${reminder.daysUntil} days`;

  const subject = `Reminder: ${reminder.clientName} - ${reminder.taxYear} ${reminder.returnType} ${urgencyText}`;

  const content = `
    <h2 style="margin: 0 0 20px 0; font-family: 'Georgia', serif; font-size: 22px; font-weight: 500; color: #1A1A1A;">
      Tax Return Reminder
    </h2>

    <div style="background: ${BRAND_BACKGROUND}; border: 1px solid #E5E5E5; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6B7280; width: 100px;">Client:</td>
          <td style="padding: 8px 0; font-weight: 500;">${reminder.clientName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6B7280;">Return:</td>
          <td style="padding: 8px 0;">${reminder.taxYear} ${reminder.returnType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6B7280;">Status:</td>
          <td style="padding: 8px 0;">${reminder.status.replace(/_/g, " ")}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6B7280;">Due Date:</td>
          <td style="padding: 8px 0;">${reminder.dueDate}</td>
        </tr>
      </table>
      <p style="margin: 16px 0 0 0; font-weight: 600; color: ${reminder.daysUntil <= 7 ? "#dc2626" : "#059669"};">
        ${urgencyText.charAt(0).toUpperCase() + urgencyText.slice(1)}
      </p>
    </div>

    <div style="text-align: center;">
      <a href="${baseUrl}/dashboard/returns/${reminder.returnId}" style="display: inline-block; background: ${BRAND_PRIMARY}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">View Return</a>
    </div>
  `;

  const html = wrapEmailTemplate(content, `${reminder.clientName} tax return ${urgencyText}`);

  const text = `
Harvey & Co Financial Services - Tax Return Reminder

Client: ${reminder.clientName}
Return: ${reminder.taxYear} ${reminder.returnType}
Status: ${reminder.status.replace(/_/g, " ")}
Due Date: ${reminder.dueDate}
${urgencyText.charAt(0).toUpperCase() + urgencyText.slice(1)}

View Return: ${baseUrl}/dashboard/returns/${reminder.returnId}
  `.trim();

  return { subject, html, text };
}

// Email signature for campaign emails
const BRANDON_PHOTO_URL = "https://www.dropbox.com/scl/fi/ijjswkfn81jd90cxpxsef/brandon-new-photo-2.png?rlkey=lb3xnmidlbiyclr0ujtsabol2&raw=1";

// Office phone number (Twilio) - set via environment variable
const OFFICE_PHONE = process.env.OFFICE_PHONE_NUMBER || "(XXX) XXX-XXXX";
const CELL_PHONE = "(717) 319-2858";

function getEmailSignature(): string {
  return `
    <table style="border-top: 2px solid ${BRAND_ACCENT}; padding-top: 20px; margin-top: 32px; width: 100%;">
      <tr>
        <td style="vertical-align: top; padding-right: 16px; width: 80px;">
          <img src="${BRANDON_PHOTO_URL}" alt="Brandon Harvey" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 2px solid ${BRAND_ACCENT};" />
        </td>
        <td style="vertical-align: top;">
          <p style="margin: 0 0 2px 0; font-family: 'Georgia', serif; font-size: 16px; font-weight: 600; color: #1A1A1A;">
            Brandon Harvey
          </p>
          <p style="margin: 0 0 10px 0; font-size: 13px; color: ${BRAND_PRIMARY}; font-weight: 500;">
            Harvey & Co Financial Services
          </p>
          <p style="margin: 0 0 3px 0; font-size: 13px; color: #4B5563;">
            <a href="mailto:team@harveynco.com" style="color: ${BRAND_PRIMARY}; text-decoration: none;">team@harveynco.com</a>
          </p>
          <p style="margin: 0 0 3px 0; font-size: 13px; color: #4B5563;">
            <strong>Office:</strong> <a href="tel:${OFFICE_PHONE.replace(/[^0-9+]/g, '')}" style="color: ${BRAND_PRIMARY}; text-decoration: none;">${OFFICE_PHONE}</a>
          </p>
          <p style="margin: 0 0 3px 0; font-size: 13px; color: #4B5563;">
            <strong>Cell:</strong> <a href="tel:+17173192858" style="color: ${BRAND_PRIMARY}; text-decoration: none;">${CELL_PHONE}</a>
          </p>
          <p style="margin: 0; font-size: 12px; color: #6B7280;">
            4331 N 12th St. Suite 103, Phoenix, AZ 85014
          </p>
        </td>
      </tr>
    </table>
  `;
}

function getEmailSignatureText(): string {
  return `
--
Brandon Harvey
Harvey & Co Financial Services
team@harveynco.com
Office: ${OFFICE_PHONE}
Cell: ${CELL_PHONE}
4331 N 12th St. Suite 103, Phoenix, AZ 85014
  `.trim();
}

// Campaign Email Types
export type CampaignType = "intro" | "refund_amounts" | "urgency" | "intake_link";

export interface CampaignEmailConfig {
  type: CampaignType;
  name: string;
  description: string;
  subject: string;
}

export const CAMPAIGN_TYPES: CampaignEmailConfig[] = [
  {
    type: "intake_link",
    name: "Intake Form Link",
    description: "Simple email with link to complete their tax intake form",
    subject: "Complete Your Tax Information - Harvey & Co",
  },
  {
    type: "intro",
    name: "Introduction Email",
    description: "Introduce yourself and your background in financial services",
    subject: "A New Approach to Tax Preparation",
  },
  {
    type: "refund_amounts",
    name: "Refund Amounts",
    description: "Highlight potential refund amounts based on number of children",
    subject: "Get Your Maximum Tax Refund - Start Now!",
  },
  {
    type: "urgency",
    name: "Urgency/Deadline",
    description: "Create urgency around tax filing deadlines",
    subject: "Don't Miss Out on Your Tax Refund",
  },
];

// Introduction Email - Brandon's Story
export function generateIntroEmail(
  clientFirstName: string,
  intakeUrl: string
): { subject: string; html: string; text: string } {
  const subject = "A New Approach to Tax Preparation";

  const content = `
    <h2 style="margin: 0 0 20px 0; font-family: 'Georgia', serif; font-size: 24px; font-weight: 500; color: #1A1A1A;">
      ${clientFirstName}, I Want to Share Something With You
    </h2>

    <p style="margin: 0 0 16px 0; font-size: 16px; color: #4B5563; line-height: 1.7;">
      You may know me as your mortgage loan officer, but I wanted to reach out about something
      that's been on my mind for a while now.
    </p>

    <p style="margin: 0 0 16px 0; font-size: 16px; color: #4B5563; line-height: 1.7;">
      After <strong>10+ years in the financial industry</strong>, I've had a front-row seat to
      hundreds of tax returns. Being in the middle of my clients and their tax preparers, I've
      seen it all - the good, the bad, and unfortunately, a lot of returns done incorrectly.
    </p>

    <div style="background: ${BRAND_BACKGROUND}; border-left: 4px solid ${BRAND_ACCENT}; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #4B5563; line-height: 1.7; font-style: italic;">
        "I've been ghosted by tax preparers more times than I can count. I've watched my clients
        get left hanging with slow turnaround times and inexperience. I've seen money left on
        the table that should have been in my clients' pockets."
      </p>
    </div>

    <p style="margin: 0 0 16px 0; font-size: 16px; color: #4B5563; line-height: 1.7;">
      <strong>I decided enough was enough.</strong>
    </p>

    <p style="margin: 0 0 16px 0; font-size: 16px; color: #4B5563; line-height: 1.7;">
      I'm now taking everything I've learned - my decade of experience in financial services,
      my creative approach that's helped countless clients with their loans - and applying
      those same strategies to tax preparation.
    </p>

    <div style="background: ${BRAND_PRIMARY}; border-radius: 12px; padding: 24px; margin: 28px 0; text-align: center;">
      <h3 style="margin: 0 0 16px 0; font-family: 'Georgia', serif; font-size: 20px; color: white;">
        What Makes Harvey & Co Different?
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px; text-align: left; color: white; border-bottom: 1px solid rgba(255,255,255,0.2);">
            <strong style="color: ${BRAND_ACCENT};">✓</strong> &nbsp; Fast turnaround - no more waiting weeks
          </td>
        </tr>
        <tr>
          <td style="padding: 12px; text-align: left; color: white; border-bottom: 1px solid rgba(255,255,255,0.2);">
            <strong style="color: ${BRAND_ACCENT};">✓</strong> &nbsp; Direct communication - I actually respond
          </td>
        </tr>
        <tr>
          <td style="padding: 12px; text-align: left; color: white; border-bottom: 1px solid rgba(255,255,255,0.2);">
            <strong style="color: ${BRAND_ACCENT};">✓</strong> &nbsp; Creative strategies to maximize your refund
          </td>
        </tr>
        <tr>
          <td style="padding: 12px; text-align: left; color: white;">
            <strong style="color: ${BRAND_ACCENT};">✓</strong> &nbsp; 10+ years of financial industry experience
          </td>
        </tr>
      </table>
    </div>

    <p style="margin: 24px 0; font-size: 16px; color: #4B5563; line-height: 1.7;">
      I'd love the opportunity to show you what a different experience looks like.
      Click below to get started - it only takes a few minutes.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${intakeUrl}"
         style="display: inline-block; background: ${BRAND_PRIMARY}; color: white; padding: 18px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(45, 74, 67, 0.3);">
        Let's Get Started &rarr;
      </a>
    </div>

    <p style="margin: 24px 0 0 0; font-size: 14px; color: #6B7280; text-align: center;">
      Have questions? Just reply to this email - I personally read every response.
    </p>

    ${getEmailSignature()}
  `;

  const html = wrapEmailTemplate(content, `${clientFirstName}, I want to share my story with you`);

  const text = `
${clientFirstName}, I Want to Share Something With You

You may know me as your mortgage loan officer, but I wanted to reach out about something that's been on my mind for a while now.

After 10+ years in the financial industry, I've had a front-row seat to hundreds of tax returns. Being in the middle of my clients and their tax preparers, I've seen it all - the good, the bad, and unfortunately, a lot of returns done incorrectly.

"I've been ghosted by tax preparers more times than I can count. I've watched my clients get left hanging with slow turnaround times and inexperience. I've seen money left on the table that should have been in my clients' pockets."

I decided enough was enough.

I'm now taking everything I've learned - my decade of experience in financial services, my creative approach that's helped countless clients with their loans - and applying those same strategies to tax preparation.

WHAT MAKES HARVEY & CO DIFFERENT?
✓ Fast turnaround - no more waiting weeks
✓ Direct communication - I actually respond
✓ Creative strategies to maximize your refund
✓ 10+ years of financial industry experience

I'd love the opportunity to show you what a different experience looks like. Click below to get started - it only takes a few minutes.

${intakeUrl}

Have questions? Just reply to this email - I personally read every response.

${getEmailSignatureText()}
  `.trim();

  return { subject, html, text };
}

// Tax Season Campaign Email - Refund Amounts (sent to clients)
export function generateTaxSeasonCampaignEmail(
  clientFirstName: string,
  intakeUrl: string
): { subject: string; html: string; text: string } {
  const subject = "Get Your Maximum Tax Refund - Start Now!";

  const content = `
    <h2 style="margin: 0 0 20px 0; font-family: 'Georgia', serif; font-size: 24px; font-weight: 500; color: #1A1A1A;">
      ${clientFirstName}, Your Tax Refund is Waiting!
    </h2>

    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4B5563; line-height: 1.7;">
      Tax season is here, and we want to make sure you get every dollar you deserve. At Harvey & Co,
      we specialize in maximizing your refund with our extremely creative approach to tax preparation.
    </p>

    <div style="background: ${BRAND_PRIMARY}; border-radius: 12px; padding: 28px; margin: 28px 0;">
      <h3 style="margin: 0 0 8px 0; font-family: 'Georgia', serif; font-size: 20px; color: white; text-align: center;">
        See What You Could Get Back
      </h3>
      <p style="margin: 0 0 20px 0; font-size: 14px; color: rgba(255,255,255,0.8); text-align: center;">
        Based on qualifying tax credits for families
      </p>
      <table style="width: 100%; border-collapse: separate; border-spacing: 8px;">
        <tr>
          <td style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 20px; text-align: center; width: 33%;">
            <p style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: ${BRAND_ACCENT};">$5,000+</p>
            <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.9);">1 Child</p>
          </td>
          <td style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 20px; text-align: center; width: 33%;">
            <p style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: ${BRAND_ACCENT};">$9,000+</p>
            <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.9);">2 Children</p>
          </td>
          <td style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 20px; text-align: center; width: 33%;">
            <p style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: ${BRAND_ACCENT};">$10,000+</p>
            <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.9);">3+ Children</p>
          </td>
        </tr>
      </table>
    </div>

    <div style="background: ${BRAND_BACKGROUND}; border-left: 4px solid ${BRAND_ACCENT}; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
      <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: ${BRAND_PRIMARY};">
        No Job? No Problem!
      </h3>
      <p style="margin: 0; color: #4B5563; line-height: 1.6;">
        We welcome <strong>all income types</strong> - whether you're self-employed, work gig jobs,
        receive benefits, or have any other source of income. Our team has the experience and creativity
        to find every deduction and credit you qualify for.
      </p>
    </div>

    <p style="margin: 24px 0; font-size: 16px; color: #4B5563; line-height: 1.7;">
      Don't leave money on the table. Click below to get started with your free consultation and
      let us show you what you could be getting back this tax season.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${intakeUrl}"
         style="display: inline-block; background: ${BRAND_PRIMARY}; color: white; padding: 18px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(45, 74, 67, 0.3);">
        Get Started Now &rarr;
      </a>
    </div>

    <p style="margin: 24px 0 0 0; font-size: 14px; color: #6B7280; text-align: center;">
      Questions? Reply to this email or give us a call - we're here to help!
    </p>

    ${getEmailSignature()}
  `;

  const html = wrapEmailTemplate(content, `${clientFirstName}, see how much you could get back this tax season`);

  const text = `
${clientFirstName}, Your Tax Refund is Waiting!

Tax season is here, and we want to make sure you get every dollar you deserve. At Harvey & Co, we specialize in maximizing your refund with our extremely creative approach to tax preparation.

SEE WHAT YOU COULD GET BACK
(Based on qualifying tax credits for families)

- 1 Child: $5,000+
- 2 Children: $9,000+
- 3+ Children: $10,000+

NO JOB? NO PROBLEM!
We welcome all income types - whether you're self-employed, work gig jobs, receive benefits, or have any other source of income. Our team has the experience and creativity to find every deduction and credit you qualify for.

Don't leave money on the table. Click the link below to get started with your free consultation:
${intakeUrl}

Questions? Reply to this email or give us a call - we're here to help!

${getEmailSignatureText()}
  `.trim();

  return { subject, html, text };
}

// Urgency Email - Deadline focused
export function generateUrgencyEmail(
  clientFirstName: string,
  intakeUrl: string
): { subject: string; html: string; text: string } {
  const subject = "Don't Miss Out on Your Tax Refund";

  const content = `
    <h2 style="margin: 0 0 20px 0; font-family: 'Georgia', serif; font-size: 24px; font-weight: 500; color: #1A1A1A;">
      ${clientFirstName}, Time is Running Out
    </h2>

    <p style="margin: 0 0 16px 0; font-size: 16px; color: #4B5563; line-height: 1.7;">
      Tax season is in full swing, and every day you wait is another day your refund sits unclaimed.
      I wanted to reach out one more time because I don't want you to miss out.
    </p>

    <div style="background: #FEF3C7; border: 2px solid #F59E0B; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #92400E; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
        Important Reminder
      </p>
      <p style="margin: 0; font-size: 18px; color: #78350F; font-weight: 500;">
        The sooner you file, the sooner you get your money
      </p>
    </div>

    <p style="margin: 0 0 16px 0; font-size: 16px; color: #4B5563; line-height: 1.7;">
      At Harvey & Co, we pride ourselves on <strong>fast turnaround times</strong>. While other
      preparers leave you waiting for weeks, we get your return done quickly and accurately -
      so you can get your refund deposited ASAP.
    </p>

    <div style="background: ${BRAND_PRIMARY}; border-radius: 12px; padding: 24px; margin: 28px 0;">
      <h3 style="margin: 0 0 16px 0; font-family: 'Georgia', serif; font-size: 18px; color: white; text-align: center;">
        What Are You Waiting For?
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 12px; text-align: left; color: white; border-bottom: 1px solid rgba(255,255,255,0.2);">
            <strong style="color: ${BRAND_ACCENT};">✓</strong> &nbsp; Get up to $5,000+ with 1 child
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; text-align: left; color: white; border-bottom: 1px solid rgba(255,255,255,0.2);">
            <strong style="color: ${BRAND_ACCENT};">✓</strong> &nbsp; Get up to $9,000+ with 2 children
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; text-align: left; color: white; border-bottom: 1px solid rgba(255,255,255,0.2);">
            <strong style="color: ${BRAND_ACCENT};">✓</strong> &nbsp; Get up to $10,000+ with 3+ children
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; text-align: left; color: white;">
            <strong style="color: ${BRAND_ACCENT};">✓</strong> &nbsp; All income types welcome - no job, no problem!
          </td>
        </tr>
      </table>
    </div>

    <p style="margin: 24px 0; font-size: 16px; color: #4B5563; line-height: 1.7;">
      It takes just a few minutes to get started. Don't let another day go by -
      click below and let's get your refund on its way.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${intakeUrl}"
         style="display: inline-block; background: #F59E0B; color: white; padding: 18px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);">
        Claim Your Refund Now &rarr;
      </a>
    </div>

    <p style="margin: 24px 0 0 0; font-size: 14px; color: #6B7280; text-align: center;">
      Questions? Reply to this email or call me directly - I'm here to help!
    </p>

    ${getEmailSignature()}
  `;

  const html = wrapEmailTemplate(content, `${clientFirstName}, don't miss out on your tax refund`);

  const text = `
${clientFirstName}, Time is Running Out

Tax season is in full swing, and every day you wait is another day your refund sits unclaimed. I wanted to reach out one more time because I don't want you to miss out.

IMPORTANT REMINDER
The sooner you file, the sooner you get your money

At Harvey & Co, we pride ourselves on fast turnaround times. While other preparers leave you waiting for weeks, we get your return done quickly and accurately - so you can get your refund deposited ASAP.

WHAT ARE YOU WAITING FOR?
✓ Get up to $5,000+ with 1 child
✓ Get up to $9,000+ with 2 children
✓ Get up to $10,000+ with 3+ children
✓ All income types welcome - no job, no problem!

It takes just a few minutes to get started. Don't let another day go by - click below and let's get your refund on its way.

${intakeUrl}

Questions? Reply to this email or call me directly - I'm here to help!

${getEmailSignatureText()}
  `.trim();

  return { subject, html, text };
}

// Simple Intake Link Email - Just sends the form link
export function generateIntakeLinkEmail(
  clientFirstName: string,
  intakeUrl: string
): { subject: string; html: string; text: string } {
  const subject = "Complete Your Tax Information - Harvey & Co";

  const content = `
    <h2 style="margin: 0 0 20px 0; font-family: 'Georgia', serif; font-size: 24px; font-weight: 500; color: #1A1A1A;">
      Hi ${clientFirstName},
    </h2>

    <p style="margin: 0 0 16px 0; font-size: 16px; color: #4B5563; line-height: 1.7;">
      Please complete your tax intake form using the secure link below. This will help us gather
      the information we need to prepare your tax return.
    </p>

    <p style="margin: 0 0 24px 0; font-size: 16px; color: #4B5563; line-height: 1.7;">
      The form takes about <strong>5-10 minutes</strong> to complete and covers your personal
      information, income sources, and potential deductions.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${intakeUrl}"
         style="display: inline-block; background: ${BRAND_PRIMARY}; color: white; padding: 18px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(45, 74, 67, 0.3);">
        Complete Intake Form &rarr;
      </a>
    </div>

    <div style="background: ${BRAND_BACKGROUND}; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: ${BRAND_PRIMARY}; text-transform: uppercase; letter-spacing: 1px;">
        What You'll Need
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: #4B5563; line-height: 1.8;">
        <li>Social Security Numbers (you and dependents)</li>
        <li>Date of birth for you and family members</li>
        <li>General idea of your income sources</li>
        <li>Basic information about deductions</li>
      </ul>
    </div>

    <p style="margin: 24px 0 0 0; font-size: 14px; color: #6B7280;">
      This link is personalized for you and will expire in 30 days. If you have any questions,
      just reply to this email or give me a call.
    </p>

    ${getEmailSignature()}
  `;

  const html = wrapEmailTemplate(content, `${clientFirstName}, please complete your tax intake form`);

  const text = `
Hi ${clientFirstName},

Please complete your tax intake form using the secure link below. This will help us gather the information we need to prepare your tax return.

The form takes about 5-10 minutes to complete and covers your personal information, income sources, and potential deductions.

COMPLETE YOUR INTAKE FORM:
${intakeUrl}

WHAT YOU'LL NEED:
- Social Security Numbers (you and dependents)
- Date of birth for you and family members
- General idea of your income sources
- Basic information about deductions

This link is personalized for you and will expire in 30 days. If you have any questions, just reply to this email or give me a call.

${getEmailSignatureText()}
  `.trim();

  return { subject, html, text };
}

// Document Request Email - Custom list of documents
export interface DocumentRequestItem {
  name: string;
  description?: string;
}

export function generateDocumentRequestEmail(
  clientFirstName: string,
  documents: DocumentRequestItem[],
  uploadUrl?: string
): { subject: string; html: string; text: string } {
  const subject = "Documents Needed for Your Tax Return - Harvey & Co";

  const documentList = documents
    .map(
      (doc) => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E5E5E5;">
          <div style="display: flex; align-items: flex-start; gap: 12px;">
            <span style="color: ${BRAND_ACCENT}; font-size: 18px; line-height: 1;">&#9744;</span>
            <div>
              <p style="margin: 0; font-weight: 500; color: #1A1A1A;">${doc.name}</p>
              ${doc.description ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #6B7280;">${doc.description}</p>` : ""}
            </div>
          </div>
        </td>
      </tr>
    `
    )
    .join("");

  const content = `
    <h2 style="margin: 0 0 20px 0; font-family: 'Georgia', serif; font-size: 24px; font-weight: 500; color: #1A1A1A;">
      Hi ${clientFirstName},
    </h2>

    <p style="margin: 0 0 16px 0; font-size: 16px; color: #4B5563; line-height: 1.7;">
      We're making great progress on your tax return! To complete your filing, we'll need the following documents from you:
    </p>

    <div style="background: ${BRAND_BACKGROUND}; border-radius: 12px; overflow: hidden; margin: 24px 0;">
      <div style="background: ${BRAND_PRIMARY}; padding: 16px 20px;">
        <h3 style="margin: 0; font-family: 'Georgia', serif; font-size: 18px; color: white;">
          Documents Needed (${documents.length})
        </h3>
      </div>
      <table style="width: 100%; border-collapse: collapse; background: white;">
        ${documentList}
      </table>
    </div>

    ${uploadUrl ? `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${uploadUrl}"
         style="display: inline-block; background: #059669; color: white; padding: 18px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.3);">
        Upload Your Documents &rarr;
      </a>
    </div>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #6B7280; text-align: center;">
      Use the secure link above to upload each document. You can also reply to this email with photos or scans.
    </p>
    ` : `
    <div style="background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; font-size: 14px; color: #92400E;">
        <strong>Tip:</strong> You can reply to this email with photos or scans of your documents,
        or upload them through our secure portal. Clear, readable images work best!
      </p>
    </div>
    `}

    <p style="margin: 24px 0; font-size: 16px; color: #4B5563; line-height: 1.7;">
      If you have any questions about what's needed or where to find these documents,
      don't hesitate to reach out. I'm happy to help!
    </p>

    <p style="margin: 24px 0 0 0; font-size: 14px; color: #6B7280;">
      The sooner we receive these documents, the sooner we can complete your return and get your refund on its way.
    </p>

    ${getEmailSignature()}
  `;

  const html = wrapEmailTemplate(content, `${clientFirstName}, we need ${documents.length} document${documents.length > 1 ? "s" : ""} from you`);

  const documentListText = documents
    .map((doc) => `- ${doc.name}${doc.description ? ` (${doc.description})` : ""}`)
    .join("\n");

  const text = `
Hi ${clientFirstName},

We're making great progress on your tax return! To complete your filing, we'll need the following documents from you:

DOCUMENTS NEEDED (${documents.length}):
${documentListText}

${uploadUrl ? `UPLOAD YOUR DOCUMENTS:\n${uploadUrl}\n\nUse the secure link above to upload each document. You can also reply to this email with photos or scans.` : `TIP: You can reply to this email with photos or scans of your documents, or upload them through our secure portal. Clear, readable images work best!`}

If you have any questions about what's needed or where to find these documents, don't hesitate to reach out. I'm happy to help!

The sooner we receive these documents, the sooner we can complete your return and get your refund on its way.

${getEmailSignatureText()}
  `.trim();

  return { subject, html, text };
}

// Helper function to generate campaign email by type
export function generateCampaignEmail(
  type: CampaignType,
  clientFirstName: string,
  intakeUrl: string
): { subject: string; html: string; text: string } {
  switch (type) {
    case "intake_link":
      return generateIntakeLinkEmail(clientFirstName, intakeUrl);
    case "intro":
      return generateIntroEmail(clientFirstName, intakeUrl);
    case "refund_amounts":
      return generateTaxSeasonCampaignEmail(clientFirstName, intakeUrl);
    case "urgency":
      return generateUrgencyEmail(clientFirstName, intakeUrl);
    default:
      return generateTaxSeasonCampaignEmail(clientFirstName, intakeUrl);
  }
}
