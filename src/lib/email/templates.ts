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
            <a href="tel:+17173192858" style="color: ${BRAND_PRIMARY}; text-decoration: none;">(717) 319-2858</a>
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
(717) 319-2858
4331 N 12th St. Suite 103, Phoenix, AZ 85014
  `.trim();
}

// Tax Season Campaign Email (sent to clients)
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

    <div style="background: linear-gradient(135deg, ${BRAND_PRIMARY} 0%, #3D5A53 100%); border-radius: 12px; padding: 28px; margin: 28px 0; text-align: center;">
      <h3 style="margin: 0 0 20px 0; font-family: 'Georgia', serif; font-size: 20px; color: white;">
        See What You Could Get Back
      </h3>
      <div style="display: table; width: 100%; margin-bottom: 8px;">
        <div style="display: table-row;">
          <div style="display: table-cell; padding: 12px; text-align: center; width: 33%;">
            <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 16px;">
              <p style="margin: 0 0 8px 0; font-size: 32px; font-weight: 700; color: ${BRAND_ACCENT};">$5,000+</p>
              <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.9);">1 Child</p>
            </div>
          </div>
          <div style="display: table-cell; padding: 12px; text-align: center; width: 33%;">
            <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 16px;">
              <p style="margin: 0 0 8px 0; font-size: 32px; font-weight: 700; color: ${BRAND_ACCENT};">$9,000+</p>
              <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.9);">2 Children</p>
            </div>
          </div>
          <div style="display: table-cell; padding: 12px; text-align: center; width: 33%;">
            <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 16px;">
              <p style="margin: 0 0 8px 0; font-size: 32px; font-weight: 700; color: ${BRAND_ACCENT};">$10,000+</p>
              <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.9);">3+ Children</p>
            </div>
          </div>
        </div>
      </div>
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

SEE WHAT YOU COULD GET BACK:
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
