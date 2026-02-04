"use client";

interface SMSRecord {
  id: string;
  created_at: string;
  description: string;
  metadata: {
    messagePreview?: string;
    templateId?: string;
    messageId?: string;
  } | null;
}

interface SMSHistoryProps {
  messages: SMSRecord[];
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const templateLabels: Record<string, string> = {
  intake_reminder: "Intake Reminder",
  document_reminder: "Document Reminder",
  appointment_reminder: "Appointment Reminder",
  return_ready: "Return Ready",
  welcome: "Welcome",
  document_request: "Document Request",
  custom: "Custom Message",
};

export default function SMSHistory({ messages }: SMSHistoryProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-6">
        <svg className="mx-auto h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <p className="mt-2 text-sm text-gray-500">No SMS messages sent yet.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {messages.map((msg) => (
        <li key={msg.id} className="flex items-start gap-3">
          <div className="mt-0.5 h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {msg.metadata?.templateId
                  ? templateLabels[msg.metadata.templateId] || msg.metadata.templateId
                  : "SMS"}
              </span>
              <span className="text-xs text-gray-400">{formatTimeAgo(msg.created_at)}</span>
            </div>
            {msg.metadata?.messagePreview && (
              <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                {msg.metadata.messagePreview}
                {msg.metadata.messagePreview.length >= 100 && "..."}
              </p>
            )}
            {!msg.metadata?.messagePreview && msg.description && (
              <p className="text-sm text-gray-500 mt-0.5">{msg.description}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
