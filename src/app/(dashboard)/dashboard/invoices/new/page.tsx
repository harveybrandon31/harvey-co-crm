"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createInvoice, getClientsForInvoice, getClientReturnsForInvoice } from "../actions";
import type { InvoiceLineItem } from "@/lib/types";

interface ClientOption {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
}

interface ReturnOption {
  id: string;
  tax_year: number;
  return_type: string;
  preparation_fee: number | null;
}

export default function NewInvoicePage() {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientReturns, setClientReturns] = useState<ReturnOption[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedReturn, setSelectedReturn] = useState("");
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { description: "", quantity: 1, unit_price: 0, amount: 0 },
  ]);
  const [taxRate, setTaxRate] = useState(0);
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadClientReturns(selectedClient);
    } else {
      setClientReturns([]);
      setSelectedReturn("");
    }
  }, [selectedClient]);

  async function loadClients() {
    const result = await getClientsForInvoice();
    if (result.data) {
      setClients(result.data);
    }
  }

  async function loadClientReturns(clientId: string) {
    const result = await getClientReturnsForInvoice(clientId);
    if (result.data) {
      setClientReturns(result.data);
    }
  }

  function handleReturnSelect(returnId: string) {
    setSelectedReturn(returnId);

    // Auto-populate line item from return's preparation fee
    const selectedTaxReturn = clientReturns.find((r) => r.id === returnId);
    if (selectedTaxReturn && selectedTaxReturn.preparation_fee) {
      const newLineItem: InvoiceLineItem = {
        description: `Tax Preparation - ${selectedTaxReturn.tax_year} ${selectedTaxReturn.return_type}`,
        quantity: 1,
        unit_price: selectedTaxReturn.preparation_fee,
        amount: selectedTaxReturn.preparation_fee,
      };
      setLineItems([newLineItem]);
    }
  }

  function updateLineItem(
    index: number,
    field: keyof InvoiceLineItem,
    value: string | number
  ) {
    const newItems = [...lineItems];
    const item = { ...newItems[index] };

    if (field === "description") {
      item.description = value as string;
    } else if (field === "quantity") {
      item.quantity = parseFloat(value as string) || 0;
      item.amount = item.quantity * item.unit_price;
    } else if (field === "unit_price") {
      item.unit_price = parseFloat(value as string) || 0;
      item.amount = item.quantity * item.unit_price;
    }

    newItems[index] = item;
    setLineItems(newItems);
  }

  function addLineItem() {
    setLineItems([
      ...lineItems,
      { description: "", quantity: 1, unit_price: 0, amount: 0 },
    ]);
  }

  function removeLineItem(index: number) {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate
    if (!selectedClient) {
      setError("Please select a client");
      setLoading(false);
      return;
    }

    if (lineItems.every((item) => !item.description || item.amount === 0)) {
      setError("Please add at least one line item with a description and amount");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("client_id", selectedClient);
    if (selectedReturn) {
      formData.append("tax_return_id", selectedReturn);
    }
    formData.append("issue_date", issueDate);
    formData.append("due_date", dueDate);
    formData.append("tax_rate", taxRate.toString());
    formData.append("notes", notes);
    formData.append("line_items", JSON.stringify(lineItems.filter((item) => item.description)));

    const result = await createInvoice(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // On success, the action redirects to the invoice detail page
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
        <Link
          href="/dashboard/invoices"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Cancel
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client & Return Selection */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Client Information
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="client"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Client *
              </label>
              <select
                id="client"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                required
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                    {client.email ? ` (${client.email})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="return"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tax Return (Optional)
              </label>
              <select
                id="return"
                value={selectedReturn}
                onChange={(e) => handleReturnSelect(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                disabled={!selectedClient}
              >
                <option value="">No tax return linked</option>
                {clientReturns.map((ret) => (
                  <option key={ret.id} value={ret.id}>
                    {ret.tax_year} {ret.return_type}
                    {ret.preparation_fee
                      ? ` - ${formatCurrency(ret.preparation_fee)}`
                      : ""}
                  </option>
                ))}
              </select>
              {selectedClient && clientReturns.length === 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  No tax returns found for this client
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Invoice Details
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="issueDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Issue Date
              </label>
              <input
                type="date"
                id="issueDate"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label
                htmlFor="dueDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label
                htmlFor="taxRate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tax Rate (%)
              </label>
              <input
                type="number"
                id="taxRate"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.01"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Line Items</h2>
            <button
              type="button"
              onClick={addLineItem}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-3">
            {/* Header */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase">
              <div className="col-span-5">Description</div>
              <div className="col-span-2">Quantity</div>
              <div className="col-span-2">Unit Price</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-1"></div>
            </div>

            {/* Line Items */}
            {lineItems.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
              >
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      updateLineItem(index, "description", e.target.value)
                    }
                    placeholder="Description"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      updateLineItem(index, "quantity", e.target.value)
                    }
                    min="0"
                    step="1"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) =>
                      updateLineItem(index, "unit_price", e.target.value)
                    }
                    min="0"
                    step="0.01"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2 text-right font-medium text-sm">
                  {formatCurrency(item.amount)}
                </div>
                <div className="sm:col-span-1 text-right">
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 border-t pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                {taxRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax ({taxRate}%)</span>
                    <span className="font-medium">
                      {formatCurrency(taxAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Optional notes to appear on the invoice..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link
            href="/dashboard/invoices"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}
