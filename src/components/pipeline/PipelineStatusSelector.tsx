"use client";

import { useState } from "react";
import { DEMO_MODE } from "@/lib/mock-data";

const PIPELINE_STAGES = [
  { id: "new_intake", name: "New Intake", color: "bg-blue-100 text-blue-800" },
  { id: "documents_requested", name: "Docs Requested", color: "bg-yellow-100 text-yellow-800" },
  { id: "documents_received", name: "Docs Received", color: "bg-orange-100 text-orange-800" },
  { id: "in_preparation", name: "In Preparation", color: "bg-purple-100 text-purple-800" },
  { id: "review_needed", name: "Review Needed", color: "bg-pink-100 text-pink-800" },
  { id: "pending_client_approval", name: "Client Approval", color: "bg-indigo-100 text-indigo-800" },
  { id: "ready_to_file", name: "Ready to File", color: "bg-teal-100 text-teal-800" },
  { id: "filed", name: "Filed", color: "bg-cyan-100 text-cyan-800" },
  { id: "completed", name: "Completed", color: "bg-green-100 text-green-800" },
];

interface PipelineStatusSelectorProps {
  clientId: string;
  currentStatus: string;
}

export default function PipelineStatusSelector({
  clientId,
  currentStatus,
}: PipelineStatusSelectorProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const currentStage = PIPELINE_STAGES.find((s) => s.id === status);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;

    setIsUpdating(true);
    const previousStatus = status;
    setStatus(newStatus);

    if (!DEMO_MODE) {
      try {
        const response = await fetch("/api/clients/update-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId, pipelineStatus: newStatus }),
        });

        if (!response.ok) {
          setStatus(previousStatus);
          alert("Failed to update status");
        }
      } catch (error) {
        console.error("Error updating status:", error);
        setStatus(previousStatus);
      }
    }

    setIsUpdating(false);
  };

  return (
    <div>
      <div className="mb-3">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
            currentStage?.color || "bg-gray-100 text-gray-800"
          }`}
        >
          {currentStage?.name || status.replace(/_/g, " ")}
        </span>
      </div>

      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={isUpdating}
        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
      >
        {PIPELINE_STAGES.map((stage) => (
          <option key={stage.id} value={stage.id}>
            {stage.name}
          </option>
        ))}
      </select>
    </div>
  );
}
