export interface DeadlineReminder {
  clientName: string;
  taxYear: number;
  returnType: string;
  dueDate: string;
  daysUntil: number;
  status: string;
  returnId: string;
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

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deadline Reminders</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 24px;">Harvey & Co Financial Services</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">Deadline Reminder</p>
  </div>

  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="margin: 0 0 20px 0;">You have <strong>${reminders.length}</strong> tax return${reminders.length > 1 ? "s" : ""} with upcoming deadlines:</p>

    ${reminders
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
    <div style="background: white; border: 1px solid #e2e8f0; border-left: 4px solid ${urgencyColor}; border-radius: 6px; padding: 16px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <h3 style="margin: 0 0 4px 0; font-size: 16px; color: #1e293b;">${r.clientName}</h3>
          <p style="margin: 0; font-size: 14px; color: #64748b;">${r.taxYear} ${r.returnType} &bull; ${r.status.replace(/_/g, " ")}</p>
        </div>
        <div style="text-align: right;">
          <span style="background: ${urgencyBg}; color: ${urgencyColor}; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${urgencyText}</span>
          <p style="margin: 8px 0 0 0; font-size: 13px; color: #64748b;">Due: ${r.dueDate}</p>
        </div>
      </div>
      <a href="${baseUrl}/dashboard/returns/${r.returnId}" style="display: inline-block; margin-top: 12px; color: #2563eb; font-size: 13px; text-decoration: none;">View Return &rarr;</a>
    </div>
        `;
      })
      .join("")}

    <div style="margin-top: 24px; text-align: center;">
      <a href="${baseUrl}/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">Go to Dashboard</a>
    </div>
  </div>

  <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
    <p style="margin: 0;">Harvey & Co Financial Services</p>
    <p style="margin: 4px 0 0 0;">This is an automated reminder from your CRM system.</p>
  </div>
</body>
</html>
  `.trim();

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

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 24px;">Harvey & Co Financial Services</h1>
  </div>

  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
    <h2 style="margin: 0 0 16px 0; font-size: 20px;">Tax Return Reminder</h2>

    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px;">
      <p style="margin: 0 0 8px 0;"><strong>Client:</strong> ${reminder.clientName}</p>
      <p style="margin: 0 0 8px 0;"><strong>Return:</strong> ${reminder.taxYear} ${reminder.returnType}</p>
      <p style="margin: 0 0 8px 0;"><strong>Status:</strong> ${reminder.status.replace(/_/g, " ")}</p>
      <p style="margin: 0 0 8px 0;"><strong>Due Date:</strong> ${reminder.dueDate}</p>
      <p style="margin: 0; font-weight: 600; color: ${reminder.daysUntil <= 7 ? "#dc2626" : "#059669"};">
        ${urgencyText.charAt(0).toUpperCase() + urgencyText.slice(1)}
      </p>
    </div>

    <div style="margin-top: 24px; text-align: center;">
      <a href="${baseUrl}/dashboard/returns/${reminder.returnId}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">View Return</a>
    </div>
  </div>

  <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
    <p style="margin: 0;">Harvey & Co Financial Services</p>
  </div>
</body>
</html>
  `.trim();

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
