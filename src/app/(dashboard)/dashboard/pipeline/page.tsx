import PipelineBoard from "@/components/pipeline/PipelineBoard";
import { DEMO_MODE } from "@/lib/mock-data";
import Link from "next/link";

const PIPELINE_STAGES = [
  { id: "new_intake", name: "New Intake", color: "bg-blue-100 border-blue-300" },
  { id: "documents_requested", name: "Docs Requested", color: "bg-yellow-100 border-yellow-300" },
  { id: "documents_received", name: "Docs Received", color: "bg-orange-100 border-orange-300" },
  { id: "in_preparation", name: "In Preparation", color: "bg-purple-100 border-purple-300" },
  { id: "review_needed", name: "Review Needed", color: "bg-pink-100 border-pink-300" },
  { id: "pending_client_approval", name: "Client Approval", color: "bg-indigo-100 border-indigo-300" },
  { id: "ready_to_file", name: "Ready to File", color: "bg-teal-100 border-teal-300" },
  { id: "filed", name: "Filed", color: "bg-cyan-100 border-cyan-300" },
  { id: "completed", name: "Completed", color: "bg-green-100 border-green-300" },
];

// Demo data for pipeline view
const mockPipelineClients = [
  {
    id: "client-p1",
    first_name: "James",
    last_name: "Wilson",
    email: "james.w@email.com",
    pipeline_status: "new_intake",
    intake_completed_at: "2025-01-18T10:00:00Z",
  },
  {
    id: "client-p2",
    first_name: "Maria",
    last_name: "Garcia",
    email: "maria.g@email.com",
    pipeline_status: "documents_requested",
    intake_completed_at: "2025-01-15T14:00:00Z",
  },
  {
    id: "client-p3",
    first_name: "Robert",
    last_name: "Johnson",
    email: "robert.j@email.com",
    pipeline_status: "documents_received",
    intake_completed_at: "2025-01-12T09:00:00Z",
  },
  {
    id: "client-p4",
    first_name: "Jennifer",
    last_name: "Brown",
    email: "jennifer.b@email.com",
    pipeline_status: "in_preparation",
    intake_completed_at: "2025-01-10T11:00:00Z",
  },
  {
    id: "client-p5",
    first_name: "William",
    last_name: "Davis",
    email: "william.d@email.com",
    pipeline_status: "review_needed",
    intake_completed_at: "2025-01-08T16:00:00Z",
  },
  {
    id: "client-p6",
    first_name: "Linda",
    last_name: "Martinez",
    email: "linda.m@email.com",
    pipeline_status: "pending_client_approval",
    intake_completed_at: "2025-01-05T13:00:00Z",
  },
  {
    id: "client-p7",
    first_name: "Michael",
    last_name: "Anderson",
    email: "michael.a@email.com",
    pipeline_status: "ready_to_file",
    intake_completed_at: "2025-01-03T10:00:00Z",
  },
  {
    id: "client-p8",
    first_name: "Elizabeth",
    last_name: "Taylor",
    email: "elizabeth.t@email.com",
    pipeline_status: "filed",
    intake_completed_at: "2024-12-28T09:00:00Z",
  },
  {
    id: "client-p9",
    first_name: "David",
    last_name: "Thomas",
    email: "david.t@email.com",
    pipeline_status: "completed",
    intake_completed_at: "2024-12-20T14:00:00Z",
  },
  {
    id: "client-p10",
    first_name: "Susan",
    last_name: "Jackson",
    email: "susan.j@email.com",
    pipeline_status: "in_preparation",
    intake_completed_at: "2025-01-09T10:00:00Z",
  },
];

export default async function PipelinePage() {
  let clients = null;

  if (DEMO_MODE) {
    clients = mockPipelineClients;
  } else {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data } = await supabase
      .from("clients")
      .select("id, first_name, last_name, email, pipeline_status, intake_completed_at")
      .eq("intake_completed", true)
      .order("intake_completed_at", { ascending: false });

    clients = data;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track client progress through the tax preparation workflow
          </p>
        </div>
        <Link
          href="/dashboard/intake-links"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Intake Link
        </Link>
      </div>

      <PipelineBoard stages={PIPELINE_STAGES} clients={clients || []} />
    </div>
  );
}
