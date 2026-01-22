"use client";

import { useState, useEffect } from "react";
import { createUser } from "./actions";
import DripCampaignSection from "@/components/campaigns/DripCampaignSection";

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

interface CampaignType {
  type: string;
  name: string;
  description: string;
  subject: string;
}

interface CampaignStats {
  totalClients: number;
  clientsWithEmail: number;
  clientsWithoutEmail: number;
  campaignTypes: CampaignType[];
}

interface CampaignResult {
  success: boolean;
  sent?: number;
  failed?: number;
  total?: number;
  testMode?: boolean;
  message?: string;
  error?: string;
  campaignType?: string;
  debug?: {
    apiKeyPrefix?: string;
    emailFrom?: string;
    to?: string;
  };
}

export default function SettingsPage() {
  const [reminders, setReminders] = useState<DeadlineReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);
  const [daysThreshold, setDaysThreshold] = useState(30);

  // User management state
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [addingUser, setAddingUser] = useState(false);
  const [userResult, setUserResult] = useState<{ success?: string; error?: string } | null>(null);

  // Campaign state
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(null);
  const [loadingCampaignStats, setLoadingCampaignStats] = useState(true);
  const [sendingCampaign, setSendingCampaign] = useState(false);
  const [campaignResult, setCampaignResult] = useState<CampaignResult | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [showConfirmSend, setShowConfirmSend] = useState(false);
  const [selectedCampaignType, setSelectedCampaignType] = useState("intro");

  useEffect(() => {
    fetchReminders();
    fetchCampaignStats();
  }, []);

  async function fetchCampaignStats() {
    setLoadingCampaignStats(true);
    try {
      const response = await fetch("/api/campaigns");
      const data = await response.json();
      if (!data.error) {
        setCampaignStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch campaign stats:", error);
    }
    setLoadingCampaignStats(false);
  }

  async function handleSendTestEmail() {
    if (!testEmail) return;
    setSendingCampaign(true);
    setCampaignResult(null);

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testMode: true, testEmail, campaignType: selectedCampaignType }),
      });

      const data = await response.json();
      setCampaignResult(data);
    } catch (error) {
      setCampaignResult({
        success: false,
        error: "Failed to send test email",
      });
      console.error("Failed to send test email:", error);
    }

    setSendingCampaign(false);
  }

  async function handleSendCampaign() {
    setSendingCampaign(true);
    setCampaignResult(null);
    setShowConfirmSend(false);

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testMode: false, campaignType: selectedCampaignType }),
      });

      const data = await response.json();
      setCampaignResult(data);
    } catch (error) {
      setCampaignResult({
        success: false,
        error: "Failed to send campaign",
      });
      console.error("Failed to send campaign:", error);
    }

    setSendingCampaign(false);
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAddingUser(true);
    setUserResult(null);

    const formData = new FormData();
    formData.append("email", newUserEmail);
    formData.append("password", newUserPassword);

    const result = await createUser(formData);
    setUserResult(result);
    setAddingUser(false);

    if (result.success) {
      setNewUserEmail("");
      setNewUserPassword("");
      setShowAddUser(false);
    }
  }

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
      <h1 className="font-brand-heading text-2xl font-semibold text-gray-900">Settings</h1>

      {/* User Management Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            User Management
          </h2>
          {!showAddUser && (
            <button
              onClick={() => setShowAddUser(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2D4A43] px-4 py-2 text-sm font-medium text-white hover:bg-[#3D5A53] transition-all"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add User
            </button>
          )}
        </div>

        {userResult && (
          <div
            className={`mb-4 rounded-lg p-3 text-sm ${
              userResult.success
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {userResult.success || userResult.error}
          </div>
        )}

        {showAddUser && (
          <form onSubmit={handleAddUser} className="border rounded-lg p-4 mb-4 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Add New User</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  id="userEmail"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                  className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2D4A43]/20 focus:border-[#2D4A43]"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label htmlFor="userPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="userPassword"
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  required
                  minLength={6}
                  className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2D4A43]/20 focus:border-[#2D4A43]"
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={addingUser}
                  className="rounded-lg bg-[#2D4A43] px-4 py-2 text-sm font-medium text-white hover:bg-[#3D5A53] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {addingUser ? "Creating..." : "Create User"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUser(false);
                    setNewUserEmail("");
                    setNewUserPassword("");
                    setUserResult(null);
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        <p className="text-sm text-gray-500">
          Add users who need access to this CRM. They will be able to log in immediately with the credentials you provide.
        </p>
      </div>

      {/* Email Campaign Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Email Campaign
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          Send promotional emails to all clients with email addresses.
          Choose from different campaign types below.
        </p>

        {/* Campaign Stats */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          {loadingCampaignStats ? (
            <p className="text-sm text-gray-500">Loading stats...</p>
          ) : campaignStats ? (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-semibold text-gray-900">{campaignStats.totalClients}</p>
                <p className="text-xs text-gray-500">Total Clients</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-green-600">{campaignStats.clientsWithEmail}</p>
                <p className="text-xs text-gray-500">With Email</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-yellow-600">{campaignStats.clientsWithoutEmail}</p>
                <p className="text-xs text-gray-500">No Email</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-red-500">Failed to load stats</p>
          )}
        </div>

        {/* Campaign Type Selection */}
        <div className="border rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Select Campaign Type</h3>
          <div className="space-y-2">
            {campaignStats?.campaignTypes?.map((campaign) => (
              <label
                key={campaign.type}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedCampaignType === campaign.type
                    ? "border-[#2D4A43] bg-[#2D4A43]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="campaignType"
                  value={campaign.type}
                  checked={selectedCampaignType === campaign.type}
                  onChange={(e) => setSelectedCampaignType(e.target.value)}
                  className="mt-1 text-[#2D4A43] focus:ring-[#2D4A43]"
                />
                <div>
                  <p className="font-medium text-gray-900">{campaign.name}</p>
                  <p className="text-xs text-gray-500">{campaign.description}</p>
                  <p className="text-xs text-gray-400 mt-1">Subject: {campaign.subject}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Campaign Result */}
        {campaignResult && (
          <div
            className={`mb-4 rounded-lg p-4 text-sm ${
              campaignResult.success
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {campaignResult.success ? (
              campaignResult.testMode ? (
                <p>{campaignResult.message}</p>
              ) : (
                <div>
                  <p className="font-medium">Campaign sent successfully!</p>
                  <p className="mt-1">
                    Sent: {campaignResult.sent} | Failed: {campaignResult.failed} | Total: {campaignResult.total}
                  </p>
                </div>
              )
            ) : (
              <div>
                <p>Error: {campaignResult.error}</p>
                {campaignResult.debug && (
                  <p className="mt-1 text-xs">
                    Key: {campaignResult.debug.apiKeyPrefix} | From: {campaignResult.debug.emailFrom} | To: {campaignResult.debug.to}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Test Email Section */}
        <div className="border rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Send Test Email</h3>
          <p className="text-xs text-gray-500 mb-3">
            Send a preview to yourself before sending to all clients.
          </p>
          <div className="flex gap-3">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A43]/20 focus:border-[#2D4A43]"
            />
            <button
              onClick={handleSendTestEmail}
              disabled={sendingCampaign || !testEmail}
              className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {sendingCampaign ? "Sending..." : "Send Test"}
            </button>
          </div>
        </div>

        {/* Send Campaign Section */}
        <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Send to All Clients</h3>
          <p className="text-xs text-gray-600 mb-3">
            This will send the campaign email to all {campaignStats?.clientsWithEmail || 0} clients with email addresses.
            This action cannot be undone.
          </p>

          {!showConfirmSend ? (
            <button
              onClick={() => setShowConfirmSend(true)}
              disabled={sendingCampaign || !campaignStats?.clientsWithEmail}
              className="rounded-lg bg-[#2D4A43] px-4 py-2 text-sm font-medium text-white hover:bg-[#3D5A53] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Send Campaign
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-orange-700">Are you sure?</span>
              <button
                onClick={handleSendCampaign}
                disabled={sendingCampaign}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {sendingCampaign ? "Sending..." : `Yes, Send to ${campaignStats?.clientsWithEmail} Clients`}
              </button>
              <button
                onClick={() => setShowConfirmSend(false)}
                disabled={sendingCampaign}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Drip Campaign Section */}
      <DripCampaignSection />

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
