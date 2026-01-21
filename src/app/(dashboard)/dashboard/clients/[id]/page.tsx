import Link from "next/link";
import { notFound } from "next/navigation";
import { mockClients, mockTaxReturns, mockDocuments, DEMO_MODE, getMockTasksForClient } from "@/lib/mock-data";
import type { Client, TaxReturn, Dependent, Task, Document, IntakeLink } from "@/lib/types";
import PipelineStatusSelector from "@/components/pipeline/PipelineStatusSelector";
import ClientIntakeLinkSection from "@/components/intake/ClientIntakeLinkSection";
import DocumentChecklist from "@/components/clients/DocumentChecklist";

// Extended client type for intake data
interface ClientWithIntake extends Client {
  date_of_birth?: string | null;
  has_spouse?: boolean;
  spouse_first_name?: string | null;
  spouse_last_name?: string | null;
  intake_completed?: boolean;
  intake_completed_at?: string | null;
  pipeline_status?: string;
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let client: ClientWithIntake | null = null;
  let taxReturns: TaxReturn[] | null = null;
  let dependents: Dependent[] | null = null;
  let tasks: Task[] | null = null;
  let documents: Document[] | null = null;
  let intakeLinks: IntakeLink[] | null = null;

  if (DEMO_MODE) {
    client = mockClients.find((c) => c.id === id) || null;
    taxReturns = mockTaxReturns
      .filter((r) => r.client_id === id)
      .sort((a, b) => b.tax_year - a.tax_year);
    documents = mockDocuments.filter((d) => d.client_id === id);
    dependents = [];
    tasks = getMockTasksForClient(id);
    // Mock intake links for demo - show both an active link and a completed one for active clients
    intakeLinks = client ? [
      // Current active link (not used yet)
      {
        id: `link-active-${id}`,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        client_id: id,
        token: `demo-token-${id}`,
        email: client.email,
        expires_at: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        used_at: null,
        created_by: null,
        prefill_first_name: client.first_name,
        prefill_last_name: client.last_name,
      },
      // Previous completed link (for active clients)
      ...(client.status === "active" ? [{
        id: `link-completed-${id}`,
        created_at: "2025-01-05T10:00:00Z",
        client_id: id,
        token: `demo-token-old-${id}`,
        email: client.email,
        expires_at: "2025-02-04T10:00:00Z",
        used_at: "2025-01-08T14:30:00Z",
        created_by: null,
        prefill_first_name: client.first_name,
        prefill_last_name: client.last_name,
      }] : []),
    ] : [];
  } else {
    // Dynamic import to avoid loading Supabase in demo mode
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data: clientData } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();

    client = clientData;

    const { data: returnsData } = await supabase
      .from("tax_returns")
      .select("*")
      .eq("client_id", id)
      .order("tax_year", { ascending: false });

    taxReturns = returnsData;

    const { data: dependentsData } = await supabase
      .from("dependents")
      .select("*")
      .eq("client_id", id);

    dependents = dependentsData;

    const { data: tasksData } = await supabase
      .from("tasks")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false })
      .limit(5);

    tasks = tasksData;

    const { data: documentsData } = await supabase
      .from("documents")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false });

    documents = documentsData;

    const { data: linksData } = await supabase
      .from("intake_links")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false });

    intakeLinks = linksData;
  }

  if (!client) {
    notFound();
  }

  const filingStatusLabels: Record<string, string> = {
    single: "Single",
    married_joint: "Married Filing Jointly",
    married_separate: "Married Filing Separately",
    head_of_household: "Head of Household",
    qualifying_widow: "Qualifying Widow(er)",
  };

  const statusColors: Record<string, string> = {
    not_started: "bg-gray-100 text-gray-800",
    in_progress: "bg-blue-100 text-blue-800",
    pending_review: "bg-yellow-100 text-yellow-800",
    pending_client: "bg-orange-100 text-orange-800",
    ready_to_file: "bg-purple-100 text-purple-800",
    filed: "bg-indigo-100 text-indigo-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/dashboard/clients"
            className="text-sm text-gray-500 hover:text-[#2D4A43] transition-colors"
          >
            &larr; Back to Clients
          </Link>
          <h1 className="font-brand-heading text-2xl font-semibold text-gray-900 mt-1">
            {(client as Client).first_name} {(client as Client).last_name}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Client since {new Date((client as Client).created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/dashboard/clients/${id}/edit`}
            className="rounded-lg bg-white border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            Edit
          </Link>
          {!DEMO_MODE && (
            <button
              type="button"
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-all"
              disabled
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {(client as Client).email || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {(client as Client).phone || "-"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {(client as Client).address_street ? (
                    <>
                      {(client as Client).address_street}<br />
                      {(client as Client).address_city}, {(client as Client).address_state} {(client as Client).address_zip}
                    </>
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Tax Information</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">SSN (Last 4)</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {client.ssn_last_four ? `***-**-${client.ssn_last_four}` : "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Filing Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {client.filing_status
                    ? filingStatusLabels[client.filing_status!]
                    : "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Client Status</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      client.status === "active"
                        ? "bg-green-100 text-green-800"
                        : client.status === "prospect"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {client.status}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Spouse Information */}
          {client.has_spouse && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Spouse Information</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Spouse Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {client.spouse_first_name} {client.spouse_last_name}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* Dependents */}
          {dependents && dependents.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Dependents</h2>
              <ul className="divide-y divide-gray-200">
                {dependents.map((dep) => (
                  <li key={dep.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {dep.first_name} {dep.last_name}
                        </p>
                        {dep.relationship && (
                          <p className="text-xs text-gray-500 capitalize">
                            {dep.relationship}
                          </p>
                        )}
                      </div>
                      {dep.date_of_birth && (
                        <span className="text-xs text-gray-500">
                          DOB: {new Date(dep.date_of_birth).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {client.notes && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {client.notes}
              </p>
            </div>
          )}

          {/* Documents Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Documents</h2>
              <Link
                href={`/dashboard/documents?client_id=${id}`}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View All
              </Link>
            </div>
            {documents && documents.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {documents.map((doc) => (
                  <li key={doc.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0">
                        <svg
                          className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {doc.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {doc.category && (
                              <span className="capitalize">{doc.category.replace(/_/g, " ")}</span>
                            )}
                            {doc.file_size && (
                              <span className="ml-2">
                                {(doc.file_size / 1024).toFixed(0)} KB
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No documents uploaded yet.</p>
            )}
          </div>

          {/* Intake Links Section */}
          <ClientIntakeLinkSection
            clientId={id}
            clientName={`${client.first_name} ${client.last_name}`}
            clientEmail={client.email}
            intakeLinks={intakeLinks || []}
          />

          {/* Document Checklist */}
          <DocumentChecklist
            clientId={id}
            clientName={`${client.first_name} ${client.last_name}`}
            hasW2Income={client.status === "active"}
            w2Count={1}
            has1099Income={client.notes?.includes("1099") || client.notes?.includes("freelance")}
            hasSpouse={client.has_spouse}
            hasDependents={(dependents && dependents.length > 0) || false}
            dependentCount={dependents?.length || 0}
            hasMortgage={false}
            hasStudentLoans={false}
            hasCrypto={client.notes?.toLowerCase().includes("crypto")}
            hasStockSales={client.notes?.toLowerCase().includes("stock")}
            hasRentalIncome={false}
            hasForeignIncome={false}
          />
        </div>

        <div className="space-y-6">
          {/* Pipeline Status */}
          {client.pipeline_status && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Pipeline Status</h2>
              <PipelineStatusSelector
                clientId={id}
                currentStatus={client.pipeline_status}
              />
              {client.intake_completed_at && (
                <p className="text-xs text-gray-500 mt-3">
                  Intake completed: {new Date(client.intake_completed_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Tax Returns */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Tax Returns</h2>
              <Link
                href={`/dashboard/returns/new?client_id=${id}`}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add Return
              </Link>
            </div>
            {taxReturns && taxReturns.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {taxReturns.map((tr: TaxReturn) => (
                  <li key={tr.id} className="py-3">
                    <Link
                      href={`/dashboard/returns/${tr.id}`}
                      className="flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 py-1 rounded"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {tr.tax_year} - {tr.return_type}
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          statusColors[tr.status] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {tr.status.replace(/_/g, " ")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No tax returns yet.</p>
            )}
          </div>

          {/* Tasks */}
          {tasks && tasks.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Tasks</h2>
              <ul className="space-y-3">
                {tasks.map((task) => (
                  <li key={task.id} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                        task.status === "completed"
                          ? "bg-green-500"
                          : task.status === "in_progress"
                          ? "bg-blue-500"
                          : task.priority === "urgent"
                          ? "bg-red-500"
                          : task.priority === "high"
                          ? "bg-orange-500"
                          : "bg-gray-400"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${task.status === "completed" ? "text-gray-500 line-through" : "text-gray-900"}`}>
                        {task.title}
                      </p>
                      {task.due_date && (
                        <p className="text-xs text-gray-500">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
