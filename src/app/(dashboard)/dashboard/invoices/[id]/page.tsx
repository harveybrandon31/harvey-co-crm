import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoice } from "../actions";
import InvoiceActions from "./InvoiceActions";
import PrintableInvoice from "./PrintableInvoice";
import type { InvoiceStatus, InvoiceLineItem, Client } from "@/lib/types";

interface InvoiceWithRelations {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  line_items: InvoiceLineItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  paid_date: string | null;
  paid_amount: number | null;
  payment_method: string | null;
  notes: string | null;
  clients: Client;
  tax_returns: {
    id: string;
    tax_year: number;
    return_type: string;
  } | null;
}

const statusStyles: Record<InvoiceStatus, { bg: string; text: string }> = {
  draft: { bg: "bg-gray-100", text: "text-gray-700" },
  sent: { bg: "bg-blue-100", text: "text-blue-700" },
  paid: { bg: "bg-green-100", text: "text-green-700" },
  overdue: { bg: "bg-red-100", text: "text-red-700" },
  cancelled: { bg: "bg-gray-100", text: "text-gray-500" },
};

const statusLabels: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: invoice, error } = await getInvoice(id);

  if (error || !invoice) {
    notFound();
  }

  const typedInvoice = invoice as unknown as InvoiceWithRelations;
  const style = statusStyles[typedInvoice.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/invoices"
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Invoice {typedInvoice.invoice_number}
            </h1>
            <p className="text-sm text-gray-500">
              {typedInvoice.clients.first_name} {typedInvoice.clients.last_name}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${style.bg} ${style.text}`}
        >
          {statusLabels[typedInvoice.status]}
        </span>
      </div>

      {/* Actions */}
      <InvoiceActions invoice={typedInvoice} />

      {/* Invoice Preview */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium text-gray-900">Invoice Preview</h2>
          <p className="text-sm text-gray-500 mt-1">
            This is how the invoice will appear when printed or sent
          </p>
        </div>

        <PrintableInvoice invoice={typedInvoice} />
      </div>

      {/* Payment Info */}
      {typedInvoice.status === "paid" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-green-800 mb-2">
            Payment Received
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-sm">
            <div>
              <span className="text-green-600">Date Paid:</span>{" "}
              <span className="font-medium text-green-800">
                {typedInvoice.paid_date
                  ? formatDate(typedInvoice.paid_date)
                  : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-green-600">Amount:</span>{" "}
              <span className="font-medium text-green-800">
                {formatCurrency(typedInvoice.paid_amount || typedInvoice.total)}
              </span>
            </div>
            {typedInvoice.payment_method && (
              <div>
                <span className="text-green-600">Method:</span>{" "}
                <span className="font-medium text-green-800">
                  {typedInvoice.payment_method}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Linked Tax Return */}
      {typedInvoice.tax_returns && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Linked Tax Return
          </h3>
          <Link
            href={`/dashboard/returns/${typedInvoice.tax_returns.id}`}
            className="text-blue-600 hover:text-blue-700"
          >
            {typedInvoice.tax_returns.tax_year}{" "}
            {typedInvoice.tax_returns.return_type}
          </Link>
        </div>
      )}
    </div>
  );
}
