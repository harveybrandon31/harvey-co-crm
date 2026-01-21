"use client";

import { useState, useEffect } from "react";

interface CampaignStats {
  campaignName: string;
  stats: {
    total: number;
    active: number;
    completed: number;
    unsubscribed: number;
    stage1: number;
    stage2: number;
    stage3: number;
  };
  clientsWithEmail: number;
  notEnrolled: number;
}

interface CampaignResult {
  success: boolean;
  enrolled?: number;
  failed?: number;
  total?: number;
  message?: string;
  error?: string;
}

export default function DripCampaignSection() {
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [result, setResult] = useState<CampaignResult | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<{
    processed: number;
    completed: number;
    advanced: number;
    errors: number;
  } | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      const response = await fetch("/api/drip-campaign");
      const data = await response.json();
      if (!data.error) {
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch campaign stats:", error);
    }
    setLoading(false);
  }

  async function handleStartCampaign() {
    setStarting(true);
    setResult(null);
    setShowConfirm(false);

    try {
      const response = await fetch("/api/drip-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });

      const data = await response.json();
      setResult(data);
      // Refresh stats
      await fetchStats();
    } catch (error) {
      setResult({ success: false, error: "Failed to start campaign" });
      console.error("Failed to start campaign:", error);
    }

    setStarting(false);
  }

  async function handlePauseCampaign() {
    try {
      const response = await fetch("/api/drip-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause" }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchStats();
      }
    } catch (error) {
      console.error("Failed to pause campaign:", error);
    }
  }

  async function handleResumeCampaign() {
    try {
      const response = await fetch("/api/drip-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resume" }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchStats();
      }
    } catch (error) {
      console.error("Failed to resume campaign:", error);
    }
  }

  async function handleProcessNow() {
    setProcessing(true);
    setProcessResult(null);

    try {
      const response = await fetch("/api/drip-campaign/process", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ""}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setProcessResult(data);
        await fetchStats();
      }
    } catch (error) {
      console.error("Failed to process campaign:", error);
    }

    setProcessing(false);
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Automated Drip Campaign
      </h2>

      <p className="text-sm text-gray-600 mb-4">
        Start an automated email sequence that sends follow-up emails until clients complete
        their intake form.
      </p>

      {/* Campaign Flow */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Campaign Sequence</h3>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border">
            <span className="w-6 h-6 bg-[#2D4A43] text-white rounded-full flex items-center justify-center text-xs font-medium">1</span>
            <span>Introduction</span>
          </div>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-xs text-gray-500">2 days</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border">
            <span className="w-6 h-6 bg-[#2D4A43] text-white rounded-full flex items-center justify-center text-xs font-medium">2</span>
            <span>Refund Amounts</span>
          </div>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-xs text-gray-500">3 days</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border">
            <span className="w-6 h-6 bg-[#2D4A43] text-white rounded-full flex items-center justify-center text-xs font-medium">3</span>
            <span>Urgency</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Sequence stops automatically when client completes intake or unsubscribes.
        </p>
      </div>

      {/* Campaign Stats */}
      {loading ? (
        <div className="text-sm text-gray-500 py-4">Loading stats...</div>
      ) : stats ? (
        <div className="space-y-4 mb-4">
          {/* Overview Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-semibold text-gray-900">{stats.clientsWithEmail}</p>
              <p className="text-xs text-gray-500">Total with Email</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-semibold text-blue-600">{stats.stats.active}</p>
              <p className="text-xs text-gray-500">Active in Sequence</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-semibold text-green-600">{stats.stats.completed}</p>
              <p className="text-xs text-gray-500">Completed Intake</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-semibold text-yellow-600">{stats.notEnrolled}</p>
              <p className="text-xs text-gray-500">Not Enrolled</p>
            </div>
          </div>

          {/* Stage Breakdown */}
          {stats.stats.active > 0 && (
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Active by Stage</h4>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-[#2D4A43] rounded-full flex items-center justify-center text-[10px] text-white font-medium">1</span>
                  <span className="text-sm text-gray-700">{stats.stats.stage1} waiting for Email 2</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-[#2D4A43] rounded-full flex items-center justify-center text-[10px] text-white font-medium">2</span>
                  <span className="text-sm text-gray-700">{stats.stats.stage2} waiting for Email 3</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-[#2D4A43] rounded-full flex items-center justify-center text-[10px] text-white font-medium">3</span>
                  <span className="text-sm text-gray-700">{stats.stats.stage3} sequence complete</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-red-500 py-4">Failed to load stats</div>
      )}

      {/* Result Message */}
      {result && (
        <div
          className={`mb-4 rounded-lg p-4 text-sm ${
            result.success
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {result.success ? (
            <div>
              <p className="font-medium">Campaign started!</p>
              <p className="mt-1">
                Enrolled: {result.enrolled} | Failed: {result.failed}
              </p>
            </div>
          ) : (
            <p>Error: {result.error}</p>
          )}
        </div>
      )}

      {/* Process Result */}
      {processResult && (
        <div className="mb-4 rounded-lg p-4 text-sm bg-blue-50 text-blue-700 border border-blue-200">
          <p className="font-medium">Follow-ups processed!</p>
          <p className="mt-1">
            Advanced: {processResult.advanced} | Completed: {processResult.completed} | Errors: {processResult.errors}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {!showConfirm ? (
          <>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={starting || !stats || stats.notEnrolled === 0}
              className="rounded-lg bg-[#2D4A43] px-4 py-2 text-sm font-medium text-white hover:bg-[#3D5A53] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Start Campaign ({stats?.notEnrolled || 0} clients)
            </button>

            {stats && stats.stats.active > 0 && (
              <>
                <button
                  onClick={handlePauseCampaign}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Pause All
                </button>
                <button
                  onClick={handleResumeCampaign}
                  className="rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition-all"
                >
                  Resume All
                </button>
                <button
                  onClick={handleProcessNow}
                  disabled={processing}
                  className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-all"
                >
                  {processing ? "Processing..." : "Process Follow-ups Now"}
                </button>
              </>
            )}

            <button
              onClick={fetchStats}
              disabled={loading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
            >
              Refresh
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-orange-700">
              Send Email 1 (Introduction) to {stats?.notEnrolled} clients?
            </span>
            <button
              onClick={handleStartCampaign}
              disabled={starting}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {starting ? "Starting..." : "Yes, Start Campaign"}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={starting}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Cron Setup Info */}
      <div className="mt-6 pt-4 border-t">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Automated Processing</h3>
        <p className="text-xs text-gray-600 mb-2">
          Add this to your <code className="bg-gray-100 px-1 rounded">vercel.json</code> to automatically
          process follow-ups daily:
        </p>
        <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
{`{
  "crons": [
    {
      "path": "/api/drip-campaign/process",
      "schedule": "0 9 * * *"
    }
  ]
}`}
        </pre>
        <p className="text-xs text-gray-500 mt-2">
          This runs daily at 9 AM UTC. The cron job checks for due follow-ups and sends them automatically.
        </p>
      </div>
    </div>
  );
}
