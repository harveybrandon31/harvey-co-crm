"use client";

import { useState } from "react";
import Link from "next/link";
import type { TaxReturn, Client } from "@/lib/types";

interface TaxReturnFormProps {
  taxReturn?: TaxReturn;
  clients: Client[];
  defaultClientId?: string;
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  submitLabel: string;
}

export default function TaxReturnForm({
  taxReturn,
  clients,
  defaultClientId,
  action,
  submitLabel,
}: TaxReturnFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await action(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Return Information</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
              Client *
            </label>
            <select
              id="client_id"
              name="client_id"
              required
              defaultValue={taxReturn?.client_id || defaultClientId || ""}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a client...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.last_name}, {client.first_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tax_year" className="block text-sm font-medium text-gray-700">
              Tax Year *
            </label>
            <select
              id="tax_year"
              name="tax_year"
              required
              defaultValue={taxReturn?.tax_year || currentYear - 1}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {[currentYear, currentYear - 1, currentYear - 2, currentYear - 3].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="return_type" className="block text-sm font-medium text-gray-700">
              Return Type *
            </label>
            <select
              id="return_type"
              name="return_type"
              required
              defaultValue={taxReturn?.return_type || "1040"}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="1040">1040 (Individual)</option>
              <option value="1040-SR">1040-SR (Senior)</option>
              <option value="1065">1065 (Partnership)</option>
              <option value="1120">1120 (C-Corp)</option>
              <option value="1120-S">1120-S (S-Corp)</option>
              <option value="990">990 (Non-Profit)</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={taxReturn?.status || "not_started"}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="pending_review">Pending Review</option>
              <option value="pending_client">Pending Client</option>
              <option value="ready_to_file">Ready to File</option>
              <option value="filed">Filed</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Important Dates</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
              Due Date
            </label>
            <input
              type="date"
              id="due_date"
              name="due_date"
              defaultValue={taxReturn?.due_date || ""}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="extended_due_date" className="block text-sm font-medium text-gray-700">
              Extended Due Date
            </label>
            <input
              type="date"
              id="extended_due_date"
              name="extended_due_date"
              defaultValue={taxReturn?.extended_due_date || ""}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="filed_date" className="block text-sm font-medium text-gray-700">
              Filed Date
            </label>
            <input
              type="date"
              id="filed_date"
              name="filed_date"
              defaultValue={taxReturn?.filed_date || ""}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="accepted_date" className="block text-sm font-medium text-gray-700">
              Accepted Date
            </label>
            <input
              type="date"
              id="accepted_date"
              name="accepted_date"
              defaultValue={taxReturn?.accepted_date || ""}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {taxReturn && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Financial Summary</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="total_income" className="block text-sm font-medium text-gray-700">
                Total Income
              </label>
              <div className="mt-1 relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  id="total_income"
                  name="total_income"
                  defaultValue={taxReturn.total_income || ""}
                  className="block w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label htmlFor="total_deductions" className="block text-sm font-medium text-gray-700">
                Total Deductions
              </label>
              <div className="mt-1 relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  id="total_deductions"
                  name="total_deductions"
                  defaultValue={taxReturn.total_deductions || ""}
                  className="block w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label htmlFor="refund_amount" className="block text-sm font-medium text-gray-700">
                Refund Amount
              </label>
              <div className="mt-1 relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  id="refund_amount"
                  name="refund_amount"
                  defaultValue={taxReturn.refund_amount || ""}
                  className="block w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label htmlFor="amount_due" className="block text-sm font-medium text-gray-700">
                Amount Due
              </label>
              <div className="mt-1 relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  id="amount_due"
                  name="amount_due"
                  defaultValue={taxReturn.amount_due || ""}
                  className="block w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Fees</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="preparation_fee" className="block text-sm font-medium text-gray-700">
              Preparation Fee
            </label>
            <div className="mt-1 relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                id="preparation_fee"
                name="preparation_fee"
                defaultValue={taxReturn?.preparation_fee || ""}
                className="block w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          {taxReturn && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="fee_paid"
                name="fee_paid"
                defaultChecked={taxReturn.fee_paid}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="fee_paid" className="ml-2 block text-sm text-gray-700">
                Fee Paid
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={taxReturn?.notes || ""}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Add any notes about this return..."
        />
      </div>

      <div className="flex justify-end gap-3">
        <Link
          href="/dashboard/returns"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
