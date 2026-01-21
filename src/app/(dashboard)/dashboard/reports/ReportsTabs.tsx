"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getRevenueReport,
  getClientReport,
  getTaxReturnReport,
  getAgingReport,
} from "./actions";

type TabType = "revenue" | "clients" | "returns" | "aging";

const tabs: { id: TabType; name: string }[] = [
  { id: "revenue", name: "Revenue" },
  { id: "clients", name: "Clients" },
  { id: "returns", name: "Tax Returns" },
  { id: "aging", name: "Aging" },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function ReportsTabs({
  initialTab,
  initialYear,
}: {
  initialTab?: string;
  initialYear?: string;
}) {
  const [activeTab, setActiveTab] = useState<TabType>((initialTab as TabType) || "revenue");
  const [year, setYear] = useState(initialYear ? parseInt(initialYear) : new Date().getFullYear());

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 text-sm font-medium ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Year Selector (for revenue and returns) */}
      {(activeTab === "revenue" || activeTab === "returns") && (
        <div className="flex items-center gap-2">
          <label htmlFor="year" className="text-sm font-medium text-gray-700">
            Year:
          </label>
          <select
            id="year"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(
              (y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              )
            )}
          </select>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === "revenue" && <RevenueReport year={year} />}
      {activeTab === "clients" && <ClientReport />}
      {activeTab === "returns" && <TaxReturnReport year={year} />}
      {activeTab === "aging" && <AgingReport />}
    </div>
  );
}

function RevenueReport({ year }: { year: number }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof getRevenueReport>>["data"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await getRevenueReport(year);
      if (result.data) {
        setData(result.data);
      }
      setLoading(false);
    }
    load();
  }, [year]);

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  if (!data) {
    return <div className="text-center py-8 text-gray-500">No data available</div>;
  }

  const maxRevenue = Math.max(...data.monthlyRevenue.map((m) => m.amount), 1);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Revenue ({year})</p>
          <p className="text-2xl font-semibold text-green-600">
            {formatCurrency(data.totalRevenue)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Invoices Paid</p>
          <p className="text-2xl font-semibold text-gray-900">{data.invoiceCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Outstanding</p>
          <p className="text-2xl font-semibold text-yellow-600">
            {formatCurrency(data.totalOutstanding)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-2xl font-semibold text-red-600">
            {formatCurrency(data.totalOverdue)}
          </p>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Monthly Revenue
        </h3>
        <div className="space-y-2">
          {data.monthlyRevenue.map((month) => (
            <div key={month.month} className="flex items-center gap-3">
              <span className="w-8 text-sm text-gray-500">
                {monthNames[month.month - 1]}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all"
                  style={{
                    width: `${(month.amount / maxRevenue) * 100}%`,
                  }}
                />
              </div>
              <span className="w-24 text-sm text-right font-medium">
                {formatCurrency(month.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <ExportButton
          data={data.monthlyRevenue.map((m) => ({
            Month: monthNames[m.month - 1],
            Revenue: m.amount,
          }))}
          filename={`revenue-report-${year}`}
        />
      </div>
    </div>
  );
}

function ClientReport() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getClientReport>>["data"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await getClientReport();
      if (result.data) {
        setData(result.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  if (!data) {
    return <div className="text-center py-8 text-gray-500">No data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Clients</p>
          <p className="text-2xl font-semibold text-gray-900">{data.totalClients}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-semibold text-green-600">
            {data.statusCounts.active}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Prospects</p>
          <p className="text-2xl font-semibold text-blue-600">
            {data.statusCounts.prospect}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Inactive</p>
          <p className="text-2xl font-semibold text-gray-400">
            {data.statusCounts.inactive}
          </p>
        </div>
      </div>

      {/* Top Clients by Revenue */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Top Clients by Revenue
          </h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Returns
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Total Paid
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Balance
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.clientStats.slice(0, 10).map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/dashboard/clients/${client.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    {client.name}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      client.status === "active"
                        ? "bg-green-100 text-green-700"
                        : client.status === "prospect"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {client.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                  {client.completedReturns}/{client.returnCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                  {formatCurrency(client.totalPaid)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <span
                    className={
                      client.balance > 0 ? "text-red-600 font-medium" : "text-gray-500"
                    }
                  >
                    {formatCurrency(client.balance)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <ExportButton
          data={data.clientStats.map((c) => ({
            Name: c.name,
            Email: c.email || "",
            Status: c.status,
            Returns: c.returnCount,
            "Completed Returns": c.completedReturns,
            "Total Billed": c.totalBilled,
            "Total Paid": c.totalPaid,
            Balance: c.balance,
          }))}
          filename="client-report"
        />
      </div>
    </div>
  );
}

function TaxReturnReport({ year }: { year: number }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof getTaxReturnReport>>["data"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await getTaxReturnReport(year);
      if (result.data) {
        setData(result.data);
      }
      setLoading(false);
    }
    load();
  }, [year]);

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  if (!data) {
    return <div className="text-center py-8 text-gray-500">No data available</div>;
  }

  const statusLabels: Record<string, string> = {
    not_started: "Not Started",
    in_progress: "In Progress",
    pending_review: "Pending Review",
    pending_client: "Pending Client",
    ready_to_file: "Ready to File",
    filed: "Filed",
    accepted: "Accepted",
    rejected: "Rejected",
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Returns ({year})</p>
          <p className="text-2xl font-semibold text-gray-900">{data.totalReturns}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Completion Rate</p>
          <p className="text-2xl font-semibold text-blue-600">
            {data.completionRate.toFixed(0)}%
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Prep Fees</p>
          <p className="text-2xl font-semibold text-green-600">
            {formatCurrency(data.totalPrepFees)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Client Refunds</p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatCurrency(data.totalRefunds)}
          </p>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Status Breakdown
          </h3>
          <div className="space-y-2">
            {Object.entries(data.statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {statusLabels[status] || status}
                </span>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Return Types
          </h3>
          <div className="space-y-2">
            {data.typeCounts.map(({ type, count }) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{type}</span>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">All Returns</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Prep Fee
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Refund/Due
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.returns.map((ret) => (
                <tr key={ret.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/dashboard/returns/${ret.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {ret.clientName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ret.returnType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {statusLabels[ret.status] || ret.status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {ret.prepFee ? formatCurrency(ret.prepFee) : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    {ret.refund ? (
                      <span className="text-green-600">
                        +{formatCurrency(ret.refund)}
                      </span>
                    ) : ret.amountDue ? (
                      <span className="text-red-600">
                        -{formatCurrency(ret.amountDue)}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <ExportButton
          data={data.returns.map((r) => ({
            Client: r.clientName,
            Type: r.returnType,
            Status: statusLabels[r.status] || r.status,
            "Filed Date": r.filedDate || "",
            "Prep Fee": r.prepFee || 0,
            Refund: r.refund || 0,
            "Amount Due": r.amountDue || 0,
          }))}
          filename={`tax-returns-${year}`}
        />
      </div>
    </div>
  );
}

function AgingReport() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getAgingReport>>["data"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await getAgingReport();
      if (result.data) {
        setData(result.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  if (!data) {
    return <div className="text-center py-8 text-gray-500">No data available</div>;
  }

  const buckets = [
    { label: "Current", data: data.current, color: "bg-green-500" },
    { label: "1-30 Days", data: data.thirtyDays, color: "bg-yellow-500" },
    { label: "31-60 Days", data: data.sixtyDays, color: "bg-orange-500" },
    { label: "61-90 Days", data: data.ninetyDays, color: "bg-red-400" },
    { label: "90+ Days", data: data.overNinety, color: "bg-red-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Accounts Receivable Aging
          </h3>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Outstanding</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(data.totalOutstanding)}
            </p>
          </div>
        </div>

        {/* Aging Bars */}
        <div className="space-y-4">
          {buckets.map((bucket) => (
            <div key={bucket.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  {bucket.label}
                </span>
                <span className="text-sm text-gray-500">
                  {bucket.data.count} invoice{bucket.data.count !== 1 ? "s" : ""} -{" "}
                  {formatCurrency(bucket.data.total)}
                </span>
              </div>
              <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                  className={`${bucket.color} h-full rounded-full transition-all`}
                  style={{
                    width:
                      data.totalOutstanding > 0
                        ? `${(bucket.data.total / data.totalOutstanding) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overdue Invoices Table */}
      {(data.thirtyDays.count > 0 ||
        data.sixtyDays.count > 0 ||
        data.ninetyDays.count > 0 ||
        data.overNinety.count > 0) && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              Overdue Invoices
            </h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Due Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Days Overdue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[
                ...data.thirtyDays.invoices,
                ...data.sixtyDays.invoices,
                ...data.ninetyDays.invoices,
                ...data.overNinety.invoices,
              ].map((inv) => {
                const daysOverdue = Math.floor(
                  (new Date().getTime() - new Date(inv.due_date).getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                const client = inv.clients as unknown as { first_name: string; last_name: string; email: string };
                return (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/dashboard/invoices/${inv.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.first_name} {client.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(inv.due_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span
                        className={`font-medium ${
                          daysOverdue > 60
                            ? "text-red-600"
                            : daysOverdue > 30
                            ? "text-orange-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {daysOverdue} days
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ExportButton({
  data,
  filename,
}: {
  data: Record<string, string | number>[];
  filename: string;
}) {
  function handleExport() {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            // Escape commas and quotes in values
            if (typeof val === "string" && (val.includes(",") || val.includes('"'))) {
              return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      Export CSV
    </button>
  );
}
