"use client";

import Link from "next/link";
import { useState } from "react";
import { DEMO_MODE } from "@/lib/mock-data";

interface PipelineStage {
  id: string;
  name: string;
  color: string;
}

interface PipelineClient {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  pipeline_status: string;
  intake_completed_at: string | null;
}

interface PipelineBoardProps {
  stages: PipelineStage[];
  clients: PipelineClient[];
}

export default function PipelineBoard({ stages, clients }: PipelineBoardProps) {
  const [clientData, setClientData] = useState(clients);

  const getClientsByStage = (stageId: string) => {
    return clientData.filter((c) => c.pipeline_status === stageId);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleDragStart = (e: React.DragEvent, clientId: string) => {
    e.dataTransfer.setData("clientId", clientId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const clientId = e.dataTransfer.getData("clientId");

    // Optimistically update the UI
    setClientData((prev) =>
      prev.map((c) =>
        c.id === clientId ? { ...c, pipeline_status: newStatus } : c
      )
    );

    if (!DEMO_MODE) {
      // Update in the database
      try {
        const response = await fetch("/api/clients/update-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId, pipelineStatus: newStatus }),
        });

        if (!response.ok) {
          // Revert on error
          setClientData(clients);
        }
      } catch (error) {
        console.error("Error updating status:", error);
        setClientData(clients);
      }
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageClients = getClientsByStage(stage.id);
        return (
          <div
            key={stage.id}
            className="flex-shrink-0 w-72"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <div
              className={`rounded-t-lg border-t-4 ${stage.color} bg-gray-50 px-3 py-2`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">
                  {stage.name}
                </h3>
                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full bg-white text-gray-600 shadow-sm">
                  {stageClients.length}
                </span>
              </div>
            </div>

            <div className="bg-gray-100 rounded-b-lg p-2 min-h-[calc(100vh-280px)] space-y-2">
              {stageClients.map((client) => (
                <div
                  key={client.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, client.id)}
                  className="bg-white rounded-lg shadow-sm p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                >
                  <Link
                    href={`/dashboard/clients/${client.id}`}
                    className="block"
                  >
                    <p className="text-sm font-medium text-gray-900 hover:text-blue-600">
                      {client.first_name} {client.last_name}
                    </p>
                    {client.email && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {client.email}
                      </p>
                    )}
                    {client.intake_completed_at && (
                      <p className="text-xs text-gray-400 mt-1">
                        Intake: {formatDate(client.intake_completed_at)}
                      </p>
                    )}
                  </Link>
                </div>
              ))}

              {stageClients.length === 0 && (
                <div className="text-center py-8 text-xs text-gray-400">
                  No clients
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
