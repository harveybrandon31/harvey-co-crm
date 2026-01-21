import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { clientId, pipelineStatus } = await request.json();

    if (!clientId || !pipelineStatus) {
      return NextResponse.json(
        { error: "Client ID and pipeline status are required" },
        { status: 400 }
      );
    }

    const validStatuses = [
      "new_intake",
      "documents_requested",
      "documents_received",
      "in_preparation",
      "review_needed",
      "pending_client_approval",
      "ready_to_file",
      "filed",
      "completed",
    ];

    if (!validStatuses.includes(pipelineStatus)) {
      return NextResponse.json(
        { error: "Invalid pipeline status" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("clients")
      .update({ pipeline_status: pipelineStatus })
      .eq("id", clientId);

    if (error) {
      console.error("Error updating client status:", error);
      return NextResponse.json(
        { error: "Failed to update client status" },
        { status: 500 }
      );
    }

    // Log the activity
    await supabase.from("activity_log").insert({
      client_id: clientId,
      action: "pipeline_status_change",
      description: `Pipeline status changed to ${pipelineStatus.replace(/_/g, " ")}`,
      metadata: { new_status: pipelineStatus },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating client status:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
