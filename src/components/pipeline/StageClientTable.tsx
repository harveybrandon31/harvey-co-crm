"use client";

import Link from "next/link";
import type { StageClient } from "@/lib/analytics/queries";

function formatCurrency(amount: number | null): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatStatus(status: string | null): string {
  if (!status) return "—";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function StageClientTable({ clients }: { clients: StageClient[] }) {
  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          />
        </svg>
        <p className="mt-4 text-sm text-gray-500">No clients in this stage.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
              Phone
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
              Tax Year
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
              Return Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
              Fee
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {clients.map((client) => (
            <tr key={client.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <Link
                  href={`/dashboard/clients/${client.id}`}
                  className="text-sm font-medium text-[#2D4A43] hover:underline"
                >
                  {client.first_name} {client.last_name}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {client.email || "—"}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                {client.phone || "—"}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                {client.tax_year || "—"}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                {client.return_type || "—"}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                {formatStatus(client.status)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 text-right hidden lg:table-cell">
                {formatCurrency(client.preparation_fee)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
