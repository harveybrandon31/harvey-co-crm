"use client";

import Link from "next/link";

interface ClientStat {
  id: string;
  name: string;
  status: string;
  pipelineStatus?: string;
  lastActivity?: string;
  hasOutstandingDocs?: boolean;
}

interface ClientOverviewProps {
  totalClients: number;
  activeClients: number;
  newIntakes: number;
  pendingDocuments: number;
  recentClients: ClientStat[];
}

const PIPELINE_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new_intake: { label: "New Intake", color: "bg-blue-100 text-blue-700" },
  documents_requested: { label: "Docs Requested", color: "bg-yellow-100 text-yellow-700" },
  documents_received: { label: "Docs Received", color: "bg-emerald-100 text-emerald-700" },
  in_preparation: { label: "In Preparation", color: "bg-purple-100 text-purple-700" },
  review_needed: { label: "Review Needed", color: "bg-orange-100 text-orange-700" },
  pending_client_approval: { label: "Pending Approval", color: "bg-pink-100 text-pink-700" },
  ready_to_file: { label: "Ready to File", color: "bg-indigo-100 text-indigo-700" },
  filed: { label: "Filed", color: "bg-sky-100 text-sky-700" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700" },
};

export default function ClientOverview({
  totalClients,
  activeClients,
  newIntakes,
  pendingDocuments,
  recentClients,
}: ClientOverviewProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-brand-heading text-lg font-semibold text-gray-900">
          Client Overview
        </h2>
        <Link
          href="/dashboard/clients"
          className="text-sm font-medium text-[#2D4A43] hover:text-[#3D5A53] transition-colors"
        >
          View All Clients
        </Link>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
        <div className="px-4 py-4 text-center">
          <p className="text-2xl font-semibold text-gray-900">{totalClients}</p>
          <p className="text-xs text-gray-500 mt-1">Total Clients</p>
        </div>
        <div className="px-4 py-4 text-center">
          <p className="text-2xl font-semibold text-[#2D4A43]">{activeClients}</p>
          <p className="text-xs text-gray-500 mt-1">Active</p>
        </div>
        <div className="px-4 py-4 text-center">
          <p className="text-2xl font-semibold text-blue-600">{newIntakes}</p>
          <p className="text-xs text-gray-500 mt-1">New Intakes</p>
        </div>
        <div className="px-4 py-4 text-center">
          <p className="text-2xl font-semibold text-orange-600">{pendingDocuments}</p>
          <p className="text-xs text-gray-500 mt-1">Pending Docs</p>
        </div>
      </div>

      {/* Recent Clients List */}
      <div className="divide-y divide-gray-100">
        <div className="px-6 py-3 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Recent Activity
          </p>
        </div>
        {recentClients.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-500">No recent client activity</p>
          </div>
        ) : (
          recentClients.map((client) => {
            const pipelineInfo = client.pipelineStatus
              ? PIPELINE_STATUS_LABELS[client.pipelineStatus]
              : null;

            return (
              <Link
                key={client.id}
                href={`/dashboard/clients/${client.id}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar */}
                  <div className="h-9 w-9 rounded-full bg-[#2D4A43] flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-white">
                      {client.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {client.name}
                    </p>
                    {client.lastActivity && (
                      <p className="text-xs text-gray-500">
                        {client.lastActivity}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {client.hasOutstandingDocs && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-orange-50 text-orange-700 text-xs">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      Docs
                    </span>
                  )}
                  {pipelineInfo && (
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${pipelineInfo.color}`}
                    >
                      {pipelineInfo.label}
                    </span>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/pipeline"
            className="text-sm font-medium text-[#2D4A43] hover:text-[#3D5A53] transition-colors"
          >
            View Pipeline
          </Link>
          <Link
            href="/dashboard/intake-links"
            className="inline-flex items-center gap-1 text-sm font-medium text-[#2D4A43] hover:text-[#3D5A53] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Send Intake Link
          </Link>
        </div>
      </div>
    </div>
  );
}
