"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  updateInvoiceStatus,
  markInvoicePaid,
  deleteInvoice,
} from "../actions";
import type { InvoiceStatus, InvoiceLineItem, Client } from "@/lib/types";

interface Invoice {
  id: string;
  invoice_number: string;
  status: InvoiceStatus;
  total: number;
  clients: Client;
  line_items: InvoiceLineItem[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default function InvoiceActions({ invoice }: { invoice: Invoice }) {
  const router = useRouter();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleStatusChange(newStatus: InvoiceStatus) {
    setLoading(true);
    const result = await updateInvoiceStatus(invoice.id, newStatus);
    if (result.error) {
      alert(result.error);
    }
    setLoading(false);
    router.refresh();
  }

  async function handleDelete() {
    setLoading(true);
    await deleteInvoice(invoice.id);
    // Redirects to invoices list on success
  }

  function handlePrint() {
    window.print();
  }

  const canMarkSent = invoice.status === "draft";
  const canMarkPaid = invoice.status === "sent" || invoice.status === "overdue";
  const canMarkOverdue = invoice.status === "sent";
  const canCancel =
    invoice.status !== "paid" && invoice.status !== "cancelled";
  const canEdit = invoice.status === "draft";
  const canDelete = invoice.status === "draft" || invoice.status === "cancelled";

  return (
    <>
      {/* Action Buttons */}
      <div className="bg-white shadow rounded-lg p-4 print:hidden">
        <div className="flex flex-wrap gap-3">
          {/* Primary Actions */}
          {canMarkSent && (
            <button
              onClick={() => handleStatusChange("sent")}
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Mark as Sent
            </button>
          )}

          {canMarkPaid && (
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={loading}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              Record Payment
            </button>
          )}

          <button
            onClick={handlePrint}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Print Invoice
          </button>

          {canEdit && (
            <Link
              href={`/dashboard/invoices/${invoice.id}/edit`}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Edit
            </Link>
          )}

          {/* Secondary Actions */}
          <div className="flex-1"></div>

          {canMarkOverdue && (
            <button
              onClick={() => handleStatusChange("overdue")}
              disabled={loading}
              className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Mark Overdue
            </button>
          )}

          {canCancel && (
            <button
              onClick={() => handleStatusChange("cancelled")}
              disabled={loading}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel Invoice
            </button>
          )}

          {canDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
              className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          invoice={invoice}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Delete Invoice
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete invoice {invoice.invoice_number}?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PaymentModal({
  invoice,
  onClose,
}: {
  invoice: Invoice;
  onClose: () => void;
}) {
  const [paidDate, setPaidDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paidAmount, setPaidAmount] = useState(invoice.total.toString());
  const [paymentMethod, setPaymentMethod] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("paid_date", paidDate);
    formData.append("paid_amount", paidAmount);
    formData.append("payment_method", paymentMethod);

    await markInvoicePaid(invoice.id, formData);
    // Redirects on success
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Record Payment
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date
            </label>
            <input
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount Paid
            </label>
            <input
              type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              step="0.01"
              min="0"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Invoice total: {formatCurrency(invoice.total)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Select method (optional)</option>
              <option value="check">Check</option>
              <option value="cash">Cash</option>
              <option value="credit_card">Credit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
