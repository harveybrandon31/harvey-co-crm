import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteClient } from "../actions";
import type { Client, TaxReturn } from "@/lib/types";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (!client) {
    notFound();
  }

  const { data: taxReturns } = await supabase
    .from("tax_returns")
    .select("*")
    .eq("client_id", id)
    .order("tax_year", { ascending: false });

  const deleteClientWithId = deleteClient.bind(null, id);

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
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; Back to Clients
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            {(client as Client).first_name} {(client as Client).last_name}
          </h1>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/dashboard/clients/${id}/edit`}
            className="rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </Link>
          <form action={deleteClientWithId}>
            <button
              type="submit"
              onClick={(e) => {
                if (!confirm("Are you sure you want to delete this client?")) {
                  e.preventDefault();
                }
              }}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Delete
            </button>
          </form>
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
                  {(client as Client).ssn_last_four ? `***-**-${(client as Client).ssn_last_four}` : "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Filing Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {(client as Client).filing_status
                    ? filingStatusLabels[(client as Client).filing_status!]
                    : "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Client Status</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      (client as Client).status === "active"
                        ? "bg-green-100 text-green-800"
                        : (client as Client).status === "prospect"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {(client as Client).status}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {(client as Client).notes && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {(client as Client).notes}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
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
        </div>
      </div>
    </div>
  );
}
