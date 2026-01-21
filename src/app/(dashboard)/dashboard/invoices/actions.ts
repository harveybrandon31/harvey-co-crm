"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mockInvoices, mockClients, mockTaxReturns, DEMO_MODE } from "@/lib/mock-data";
import type { InvoiceLineItem, InvoiceStatus } from "@/lib/types";

export async function getInvoices(filters?: {
  status?: InvoiceStatus;
  clientId?: string;
  search?: string;
}) {
  if (DEMO_MODE) {
    let invoices = mockInvoices.map((inv) => {
      const client = mockClients.find((c) => c.id === inv.client_id);
      return {
        ...inv,
        clients: {
          id: client?.id || "",
          first_name: client?.first_name || "",
          last_name: client?.last_name || "",
          email: client?.email || null,
        },
      };
    });

    if (filters?.status) {
      invoices = invoices.filter((inv) => inv.status === filters.status);
    }

    if (filters?.clientId) {
      invoices = invoices.filter((inv) => inv.client_id === filters.clientId);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      invoices = invoices.filter((inv) =>
        inv.invoice_number.toLowerCase().includes(search)
      );
    }

    return { data: invoices };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  let query = supabase
    .from("invoices")
    .select(
      `
      *,
      clients (
        id,
        first_name,
        last_name,
        email
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.clientId) {
    query = query.eq("client_id", filters.clientId);
  }

  if (filters?.search) {
    query = query.ilike("invoice_number", `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function getInvoice(id: string) {
  if (DEMO_MODE) {
    const invoice = mockInvoices.find((inv) => inv.id === id);
    if (!invoice) {
      return { error: "Invoice not found" };
    }

    const client = mockClients.find((c) => c.id === invoice.client_id);
    const { mockTaxReturns } = await import("@/lib/mock-data");
    const taxReturn = invoice.tax_return_id
      ? mockTaxReturns.find((r) => r.id === invoice.tax_return_id)
      : null;

    return {
      data: {
        ...invoice,
        clients: client || null,
        tax_returns: taxReturn
          ? { id: taxReturn.id, tax_year: taxReturn.tax_year, return_type: taxReturn.return_type }
          : null,
      },
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("invoices")
    .select(
      `
      *,
      clients (
        id,
        first_name,
        last_name,
        email,
        phone,
        address_street,
        address_city,
        address_state,
        address_zip
      ),
      tax_returns (
        id,
        tax_year,
        return_type
      )
    `
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function createInvoice(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const clientId = formData.get("client_id") as string;
  const taxReturnId = formData.get("tax_return_id") as string | null;
  const issueDate = formData.get("issue_date") as string;
  const dueDate = formData.get("due_date") as string;
  const taxRate = parseFloat((formData.get("tax_rate") as string) || "0");
  const notes = formData.get("notes") as string | null;
  const lineItemsJson = formData.get("line_items") as string;

  let lineItems: InvoiceLineItem[] = [];
  try {
    lineItems = JSON.parse(lineItemsJson || "[]");
  } catch {
    return { error: "Invalid line items format" };
  }

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  // Generate invoice number
  const { data: invoiceNumber } = await supabase.rpc("generate_invoice_number");

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      invoice_number: invoiceNumber,
      client_id: clientId,
      tax_return_id: taxReturnId || null,
      issue_date: issueDate,
      due_date: dueDate,
      status: "draft",
      line_items: lineItems,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      notes: notes || null,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/invoices");
  redirect(`/dashboard/invoices/${data.id}`);
}

export async function updateInvoice(id: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const issueDate = formData.get("issue_date") as string;
  const dueDate = formData.get("due_date") as string;
  const taxRate = parseFloat((formData.get("tax_rate") as string) || "0");
  const notes = formData.get("notes") as string | null;
  const lineItemsJson = formData.get("line_items") as string;

  let lineItems: InvoiceLineItem[] = [];
  try {
    lineItems = JSON.parse(lineItemsJson || "[]");
  } catch {
    return { error: "Invalid line items format" };
  }

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const { error } = await supabase
    .from("invoices")
    .update({
      issue_date: issueDate,
      due_date: dueDate,
      line_items: lineItems,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      notes: notes || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${id}`);
  redirect(`/dashboard/invoices/${id}`);
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const updateData: Record<string, unknown> = { status };

  // If marking as paid, set paid_date
  if (status === "paid") {
    updateData.paid_date = new Date().toISOString().split("T")[0];
  }

  const { error } = await supabase
    .from("invoices")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${id}`);
  return { success: true };
}

export async function markInvoicePaid(id: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const paidDate = formData.get("paid_date") as string;
  const paidAmount = parseFloat(formData.get("paid_amount") as string);
  const paymentMethod = formData.get("payment_method") as string | null;

  const { error } = await supabase
    .from("invoices")
    .update({
      status: "paid",
      paid_date: paidDate,
      paid_amount: paidAmount,
      payment_method: paymentMethod || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${id}`);
  redirect(`/dashboard/invoices/${id}`);
}

export async function deleteInvoice(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function getClientsForInvoice() {
  if (DEMO_MODE) {
    const data = mockClients
      .sort((a, b) => a.last_name.localeCompare(b.last_name))
      .map((c) => ({
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email,
      }));
    return { data };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("clients")
    .select("id, first_name, last_name, email")
    .eq("user_id", user.id)
    .order("last_name");

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function getClientReturnsForInvoice(clientId: string) {
  if (DEMO_MODE) {
    const data = mockTaxReturns
      .filter((r) => r.client_id === clientId)
      .sort((a, b) => b.tax_year - a.tax_year)
      .map((r) => ({
        id: r.id,
        tax_year: r.tax_year,
        return_type: r.return_type,
        preparation_fee: r.preparation_fee,
      }));
    return { data };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("tax_returns")
    .select("id, tax_year, return_type, preparation_fee")
    .eq("client_id", clientId)
    .eq("user_id", user.id)
    .order("tax_year", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data };
}
