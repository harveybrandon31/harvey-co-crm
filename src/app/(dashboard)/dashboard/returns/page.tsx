import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { mockTaxReturns, mockClients, DEMO_MODE } from "@/lib/mock-data";

interface TaxReturnWithClient {
  id: string;
  tax_year: number;
  return_type: string;
  status: string;
  due_date: string | null;
  clients: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export default async function ReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; status?: string }>;
}) {
  const params = await searchParams;

  let returns: TaxReturnWithClient[] | null = null;

  if (DEMO_MODE) {
    returns = mockTaxReturns
      .map((r) => {
        const client = mockClients.find((c) => c.id === r.client_id);
        return {
          id: r.id,
          tax_year: r.tax_year,
          return_type: r.return_type,
          status: r.status,
          due_date: r.due_date,
          clients: {
            id: client?.id || "",
            first_name: client?.first_name || "",
            last_name: client?.last_name || "",
          },
        };
      })
      .sort((a, b) => b.tax_year - a.tax_year);

    if (params.year && params.year !== "all") {
      returns = returns.filter((r) => r.tax_year === parseInt(params.year!));
    }

    if (params.status && params.status !== "all") {
      returns = returns.filter((r) => r.status === params.status);
    }
  } else {
    const supabase = await createClient();

    let query = supabase
      .from("tax_returns")
      .select("id, tax_year, return_type, status, due_date, clients(id, first_name, last_name)")
      .order("tax_year", { ascending: false });

    if (params.year && params.year !== "all") {
      query = query.eq("tax_year", parseInt(params.year));
    }

    if (params.status && params.status !== "all") {
      query = query.eq("status", params.status);
    }

    const { data } = await query;
    returns = data as unknown as TaxReturnWithClient[];
  }

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

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
        <h1 className="text-2xl font-bold text-gray-900">Tax Returns</h1>
        <Link
          href="/dashboard/returns/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Return
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <form className="flex gap-4">
            <select
              name="year"
              defaultValue={params.year || "all"}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={params.status || "all"}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="pending_review">Pending Review</option>
              <option value="pending_client">Pending Client</option>
              <option value="ready_to_file">Ready to File</option>
              <option value="filed">Filed</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              type="submit"
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Filter
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {returns && returns.length > 0 ? (
                returns.map((tr) => {
                  const taxReturn = tr as unknown as TaxReturnWithClient;
                  return (
                    <tr key={taxReturn.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/dashboard/clients/${taxReturn.clients.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600"
                        >
                          {taxReturn.clients.last_name}, {taxReturn.clients.first_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {taxReturn.tax_year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {taxReturn.return_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            statusColors[taxReturn.status] || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {taxReturn.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {taxReturn.due_date
                          ? new Date(taxReturn.due_date).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Link
                          href={`/dashboard/returns/${taxReturn.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                    No tax returns found.{" "}
                    <Link href="/dashboard/returns/new" className="text-blue-600 hover:underline">
                      Add your first return
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
