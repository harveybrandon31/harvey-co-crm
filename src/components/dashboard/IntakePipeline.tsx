"use client";

import { useState } from "react";
import Link from "next/link";
import type { IntakePipelineData } from "@/lib/analytics/queries";

type Tab = "sent" | "completed" | "expired";

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysUntil(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Expired";
  if (diffDays === 1) return "1 day left";
  return `${diffDays} days left`;
}

function getDisplayName(item: { prefillFirstName: string | null; prefillLastName: string | null; clientFirstName: string | null; clientLastName: string | null; email: string | null }): string {
  if (item.clientFirstName && item.clientLastName) {
    return `${item.clientFirstName} ${item.clientLastName}`;
  }
  if (item.prefillFirstName && item.prefillLastName) {
    return `${item.prefillFirstName} ${item.prefillLastName}`;
  }
  return item.email || "Unknown";
}

const tabConfig: { key: Tab; label: string; color: string; emptyText: string }[] = [
  { key: "sent", label: "Sent", color: "blue", emptyText: "No pending intake links" },
  { key: "completed", label: "Completed", color: "emerald", emptyText: "No completed intakes yet" },
  { key: "expired", label: "Expired", color: "gray", emptyText: "No expired links" },
];

const tabStyles: Record<Tab, { active: string; badge: string }> = {
  sent: { active: "border-blue-500 text-blue-600", badge: "bg-blue-100 text-blue-700" },
  completed: { active: "border-emerald-500 text-emerald-600", badge: "bg-emerald-100 text-emerald-700" },
  expired: { active: "border-gray-400 text-gray-600", badge: "bg-gray-100 text-gray-600" },
};

export default function IntakePipeline({ data }: { data: IntakePipelineData }) {
  const [activeTab, setActiveTab] = useState<Tab>("sent");

  const counts = {
    sent: data.sent.length,
    completed: data.completed.length,
    expired: data.expired.length,
  };

  const items = data[activeTab];
  const currentTab = tabConfig.find((t) => t.key === activeTab)!;

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {tabConfig.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? tabStyles[tab.key].active
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                activeTab === tab.key ? tabStyles[tab.key].badge : "bg-gray-100 text-gray-500"
              }`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">{currentTab.emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              {item.clientId ? (
                <Link
                  href={`/dashboard/clients/${item.clientId}`}
                  className="block p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <ItemContent item={item} tab={activeTab} />
                </Link>
              ) : (
                <div className="p-3 rounded-lg border border-gray-100">
                  <ItemContent item={item} tab={activeTab} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ItemContent({ item, tab }: { item: IntakePipelineData["sent"][0]; tab: Tab }) {
  return (
    <div className="flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">
          {getDisplayName(item)}
        </p>
        {item.email && (
          <p className="text-xs text-gray-500 truncate">{item.email}</p>
        )}
      </div>
      <div className="ml-4 text-right flex-shrink-0">
        {tab === "sent" && (
          <span className="text-xs text-blue-600 font-medium">{daysUntil(item.expiresAt)}</span>
        )}
        {tab === "completed" && item.intakeCompletedAt && (
          <span className="text-xs text-emerald-600 font-medium">{formatTimeAgo(item.intakeCompletedAt)}</span>
        )}
        {tab === "expired" && (
          <span className="text-xs text-gray-400">{formatTimeAgo(item.expiresAt)}</span>
        )}
        <p className="text-xs text-gray-400 mt-0.5">Sent {formatTimeAgo(item.createdAt)}</p>
      </div>
    </div>
  );
}
