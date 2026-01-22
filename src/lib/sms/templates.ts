// SMS Templates for Harvey & Co CRM

export type SMSTemplateType =
  | "intake_reminder"
  | "document_reminder"
  | "appointment_reminder"
  | "return_ready"
  | "welcome"
  | "custom";

export interface SMSTemplate {
  id: SMSTemplateType;
  name: string;
  description: string;
  template: string;
  variables: string[];
}

export const SMS_TEMPLATES: SMSTemplate[] = [
  {
    id: "intake_reminder",
    name: "Intake Form Reminder",
    description: "Remind client to complete their intake form",
    template:
      "Hi {firstName}! This is Brandon from Harvey & Co. Just a friendly reminder to complete your tax intake form when you get a chance: {intakeUrl} - Questions? Text me back!",
    variables: ["firstName", "intakeUrl"],
  },
  {
    id: "document_reminder",
    name: "Document Reminder",
    description: "Remind client to send missing documents",
    template:
      "Hi {firstName}! Brandon here from Harvey & Co. We're working on your taxes but still need a few documents from you. Can you send those over when you get a chance? Reply if you have questions!",
    variables: ["firstName"],
  },
  {
    id: "appointment_reminder",
    name: "Appointment Reminder",
    description: "Remind client of upcoming appointment",
    template:
      "Hi {firstName}! Just a reminder about your appointment with Harvey & Co on {date} at {time}. Reply if you need to reschedule. See you soon!",
    variables: ["firstName", "date", "time"],
  },
  {
    id: "return_ready",
    name: "Return Ready for Review",
    description: "Notify client their return is ready",
    template:
      "Great news, {firstName}! Your tax return is ready for review. Your estimated refund is {refundAmount}. Give me a call when you're ready to go over it: (717) 319-2858 - Brandon",
    variables: ["firstName", "refundAmount"],
  },
  {
    id: "welcome",
    name: "Welcome Message",
    description: "Welcome new client",
    template:
      "Hi {firstName}! This is Brandon from Harvey & Co Financial Services. Thanks for choosing us for your tax needs! I'll be personally handling your return. Feel free to text me anytime with questions.",
    variables: ["firstName"],
  },
  {
    id: "custom",
    name: "Custom Message",
    description: "Write your own message",
    template: "",
    variables: [],
  },
];

// Replace template variables with actual values
export function fillTemplate(
  template: string,
  values: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}

// Get template by ID
export function getTemplate(id: SMSTemplateType): SMSTemplate | undefined {
  return SMS_TEMPLATES.find((t) => t.id === id);
}
