import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mockTaxReturns, mockClients, DEMO_MODE } from "@/lib/mock-data";
import { deleteTaxReturn } from "../actions";

interface TaxReturnWithClient {
  id: string;
  created_at: string;
  updated_at: string;
  client_id: string;
  tax_year: number;
  return_type: string;
  status: string;
  due_date: string | null;
  extended_due_date: string | null;
  filed_date: string | null;
  accepted_date: string | null;
  total_income: number | null;
  total_deductions: number | null;
  refund_amount: number | null;
  amount_due: number | null;
  preparation_fee: number | null;
  fee_paid: boolean;
  notes: string | null;
  clients: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export default async function ReturnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let taxReturn: TaxReturnWithClient | null = null;

  if (DEMO_MODE) {
    const returnData = mockTaxReturns.find((r) => r.id === id);
    if (returnData) {
      const client = mockClients.find((c) => c.id === returnData.client_id);
      taxReturn = {
        ...returnData,
        clients: {
          id: client?.id || "",
          first_name: client?.first_name || "",
          last_name: client?.last_name || "",
        },
      };
    }
  } else {
    const supabase = await createClient();
    const { data } = await supabase
      .from("tax_returns")
      .select("*, clients(id, first_name, last_name)")
      .eq("id", id)
      .single();
    taxReturn = data as unknown as TaxReturnWithClient;
  }

  if (!taxReturn) {
    notFound();
  }
  const deleteReturnWithId = deleteTaxReturn.bind(null, id);

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

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/dashboard/returns"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; Back to Returns
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            {taxReturn.tax_year} {taxReturn.return_type} -{" "}
            {taxReturn.clients.last_name}, {taxReturn.clients.first_name}
          </h1>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/dashboard/returns/${id}/edit`}
            className="rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </Link>
          <form action={deleteReturnWithId}>
            <button
              type="submit"
              onClick={(e) => {
                if (!confirm("Are you sure you want to delete this return?")) {
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
            <h2 className="text-lg font-medium text-gray-900 mb-4">Return Details</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Client</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Link
                    href={`/dashboard/clients/${taxReturn.clients.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {taxReturn.clients.last_name}, {taxReturn.clients.first_name}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      statusColors[taxReturn.status] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {taxReturn.status.replace(/_/g, " ")}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Tax Year</dt>
                <dd className="mt-1 text-sm text-gray-900">{taxReturn.tax_year}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Return Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{taxReturn.return_type}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Important Dates</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(taxReturn.due_date)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Extended Due</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(taxReturn.extended_due_date)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Filed Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(taxReturn.filed_date)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Accepted Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(taxReturn.accepted_date)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Financial Summary</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Income</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatCurrency(taxReturn.total_income)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Deductions</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatCurrency(taxReturn.total_deductions)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Refund Amount</dt>
                <dd className="mt-1 text-sm text-green-600 font-medium">
                  {formatCurrency(taxReturn.refund_amount)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Amount Due</dt>
                <dd className="mt-1 text-sm text-red-600 font-medium">
                  {formatCurrency(taxReturn.amount_due)}
                </dd>
              </div>
            </dl>
          </div>

          {taxReturn.notes && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{taxReturn.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Fees</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Preparation Fee</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">
                  {formatCurrency(taxReturn.preparation_fee)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Payment Status</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      taxReturn.fee_paid
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {taxReturn.fee_paid ? "Paid" : "Unpaid"}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Documents</h2>
              <Link
                href={`/dashboard/documents?return_id=${id}`}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View All
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              Go to the Documents section to upload and manage files for this return.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
