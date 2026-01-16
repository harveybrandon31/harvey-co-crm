"use client";

import type { InvoiceLineItem, InvoiceStatus, Client } from "@/lib/types";

interface Invoice {
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
  notes: string | null;
  clients: Client;
}

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

export default function PrintableInvoice({ invoice }: { invoice: Invoice }) {
  const client = invoice.clients;

  return (
    <div className="p-8 print:p-0" id="printable-invoice">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice,
          #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 40px;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Harvey & Co</h1>
          <p className="text-sm text-gray-600">Financial Services</p>
          <p className="text-sm text-gray-500 mt-2">harveynco.com</p>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold text-gray-900">INVOICE</h2>
          <p className="text-lg text-gray-600 mt-1">{invoice.invoice_number}</p>
        </div>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Bill To
          </h3>
          <p className="font-medium text-gray-900">
            {client.first_name} {client.last_name}
          </p>
          {client.address_street && (
            <p className="text-gray-600">{client.address_street}</p>
          )}
          {(client.address_city ||
            client.address_state ||
            client.address_zip) && (
            <p className="text-gray-600">
              {[client.address_city, client.address_state, client.address_zip]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
          {client.email && <p className="text-gray-600 mt-2">{client.email}</p>}
          {client.phone && <p className="text-gray-600">{client.phone}</p>}
        </div>
        <div className="text-right">
          <div className="inline-block text-left">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <span className="text-gray-500">Issue Date:</span>
              <span className="text-gray-900 font-medium">
                {formatDate(invoice.issue_date)}
              </span>
              <span className="text-gray-500">Due Date:</span>
              <span className="text-gray-900 font-medium">
                {formatDate(invoice.due_date)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <table className="w-full mb-8">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
              Description
            </th>
            <th className="text-right py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-24">
              Qty
            </th>
            <th className="text-right py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-32">
              Unit Price
            </th>
            <th className="text-right py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-32">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.line_items.map((item, index) => (
            <tr key={index} className="border-b border-gray-100">
              <td className="py-3 text-gray-900">{item.description}</td>
              <td className="py-3 text-right text-gray-600">{item.quantity}</td>
              <td className="py-3 text-right text-gray-600">
                {formatCurrency(item.unit_price)}
              </td>
              <td className="py-3 text-right font-medium text-gray-900">
                {formatCurrency(item.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-2 text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(invoice.subtotal)}
            </span>
          </div>
          {invoice.tax_rate > 0 && (
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-600">Tax ({invoice.tax_rate}%)</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(invoice.tax_amount)}
              </span>
            </div>
          )}
          <div className="flex justify-between py-3 border-t-2 border-gray-900 text-lg">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-bold text-gray-900">
              {formatCurrency(invoice.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Notes
          </h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {invoice.notes}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
        <p>Thank you for your business!</p>
        <p className="mt-1">
          Please make payment by the due date. Questions? Contact us at
          harveynco.com
        </p>
      </div>
    </div>
  );
}
