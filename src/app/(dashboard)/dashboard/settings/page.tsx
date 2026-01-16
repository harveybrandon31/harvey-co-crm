"use client";

import { useState, useEffect } from "react";

interface DeadlineReminder {
  clientName: string;
  taxYear: number;
  returnType: string;
  dueDate: string;
  daysUntil: number;
  status: string;
  returnId: string;
}

interface SendResult {
  success: boolean;
  sent?: boolean;
  reminderCount?: number;
  urgentCount?: number;
  message?: string;
  error?: string;
}

export default function SettingsPage() {
  const [reminders, setReminders] = useState<DeadlineReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);
  const [daysThreshold, setDaysThreshold] = useState(30);

  useEffect(() => {
    fetchReminders();
  }, []);

  async function fetchReminders() {
    setLoading(true);
    try {
      const response = await fetch("/api/reminders");
      const data = await response.json();
      if (data.reminders) {
        setReminders(data.reminders);
      }
    } catch (error) {
      console.error("Failed to fetch reminders:", error);
    }
    setLoading(false);
  }

  async function handleSendReminders() {
    setSending(true);
    setSendResult(null);

    try {
      const response = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daysThreshold }),
      });

      const data = await response.json();
      setSendResult(data);
    } catch (error) {
      setSendResult({
        success: false,
        error: "Failed to send reminders",
      });
      console.error("Failed to send reminders:", error);
    }

    setSending(false);
  }

  const urgentReminders = reminders.filter((r) => r.daysUntil <= 7);
  const upcomingReminders = reminders.filter((r) => r.daysUntil > 7 && r.daysUntil <= 14);
  const laterReminders = reminders.filter((r) => r.daysUntil > 14);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Email Reminders Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Email Reminders
        </h2>

        <div className="space-y-6">
          {/* Configuration Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Configuration
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Reminders are sent to the email configured in{" "}
              <code className="bg-gray-200 px-1 rounded">REMINDER_EMAIL_TO</code>{" "}
              environment variable.
            </p>
            <p className="text-sm text-gray-600">
              For automated daily reminders, set up a cron job to call{" "}
              <code className="bg-gray-200 px-1 rounded">POST /api/reminders</code>{" "}
              with the{" "}
              <code className="bg-gray-200 px-1 rounded">CRON_SECRET</code> as a Bearer token.
            </p>
          </div>

          {/* Manual Send Section */}
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Send Reminder Email Now
            </h3>

            <div className="flex items-end gap-4 mb-4">
              <div>
                <label
                  htmlFor="daysThreshold"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Include deadlines within
                </label>
                <select
                  id="daysThreshold"
                  value={daysThreshold}
                  onChange={(e) => setDaysThreshold(parseInt(e.target.value))}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                </select>
              </div>

              <button
                onClick={handleSendReminders}
                disabled={sending || reminders.length === 0}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? "Sending..." : "Send Reminder Email"}
              </button>
            </div>

            {/* Send Result */}
            {sendResult && (
              <div
                className={`rounded-lg p-3 text-sm ${
                  sendResult.success
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {sendResult.success ? (
                  sendResult.sent ? (
                    <>
                      Email sent successfully with {sendResult.reminderCount} reminder
                      {sendResult.reminderCount !== 1 ? "s" : ""}
                      {sendResult.urgentCount
                        ? ` (${sendResult.urgentCount} urgent)`
                        : ""}
                      .
                    </>
                  ) : (
                    sendResult.message || "No reminders to send."
                  )
                ) : (
                  <>Error: {sendResult.error}</>
                )}
              </div>
            )}
          </div>

          {/* Upcoming Deadlines Preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">
                Upcoming Deadlines ({reminders.length})
              </h3>
              <button
                onClick={fetchReminders}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : reminders.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                No upcoming deadlines within 30 days
              </div>
            ) : (
              <div className="space-y-4">
                {/* Urgent (within 7 days) */}
                {urgentReminders.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-red-600 uppercase tracking-wide mb-2">
                      Urgent - Within 7 Days ({urgentReminders.length})
                    </h4>
                    <div className="space-y-2">
                      {urgentReminders.map((r) => (
                        <ReminderRow key={r.returnId} reminder={r} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming (8-14 days) */}
                {upcomingReminders.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-yellow-600 uppercase tracking-wide mb-2">
                      Coming Up - 8-14 Days ({upcomingReminders.length})
                    </h4>
                    <div className="space-y-2">
                      {upcomingReminders.map((r) => (
                        <ReminderRow key={r.returnId} reminder={r} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Later (15-30 days) */}
                {laterReminders.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Later - 15-30 Days ({laterReminders.length})
                    </h4>
                    <div className="space-y-2">
                      {laterReminders.map((r) => (
                        <ReminderRow key={r.returnId} reminder={r} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vercel Cron Setup */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Automated Daily Reminders (Vercel Cron)
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          To receive automatic daily reminder emails, add this to your{" "}
          <code className="bg-gray-100 px-1 rounded">vercel.json</code>:
        </p>

        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "crons": [
    {
      "path": "/api/reminders",
      "schedule": "0 8 * * *"
    }
  ]
}`}
        </pre>

        <p className="text-sm text-gray-500 mt-3">
          This runs daily at 8 AM UTC. Adjust the schedule as needed using{" "}
          <a
            href="https://crontab.guru/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            cron syntax
          </a>
          .
        </p>
      </div>
    </div>
  );
}

function ReminderRow({ reminder }: { reminder: DeadlineReminder }) {
  const urgencyColor =
    reminder.daysUntil < 0
      ? "text-red-600"
      : reminder.daysUntil <= 7
      ? "text-red-500"
      : reminder.daysUntil <= 14
      ? "text-yellow-600"
      : "text-gray-600";

  const urgencyText =
    reminder.daysUntil < 0
      ? `${Math.abs(reminder.daysUntil)}d overdue`
      : reminder.daysUntil === 0
      ? "Today"
      : reminder.daysUntil === 1
      ? "Tomorrow"
      : `${reminder.daysUntil}d`;

  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
      <div>
        <span className="font-medium text-gray-900">{reminder.clientName}</span>
        <span className="text-gray-500 ml-2">
          {reminder.taxYear} {reminder.returnType}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-gray-500">{reminder.dueDate}</span>
        <span className={`font-medium ${urgencyColor}`}>{urgencyText}</span>
      </div>
    </div>
  );
}
