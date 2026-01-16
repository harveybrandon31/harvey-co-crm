"use server";

import { createClient } from "@/lib/supabase/server";

export async function getRevenueReport(year?: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const targetYear = year || new Date().getFullYear();
  const startDate = `${targetYear}-01-01`;
  const endDate = `${targetYear}-12-31`;

  // Get paid invoices for the year
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("id, paid_date, paid_amount, total, client_id, tax_return_id")
    .eq("user_id", user.id)
    .eq("status", "paid")
    .gte("paid_date", startDate)
    .lte("paid_date", endDate);

  if (error) {
    return { error: error.message };
  }

  // Calculate monthly revenue
  const monthlyRevenue: Record<number, number> = {};
  for (let i = 1; i <= 12; i++) {
    monthlyRevenue[i] = 0;
  }

  let totalRevenue = 0;
  (invoices || []).forEach((inv) => {
    const amount = inv.paid_amount || inv.total;
    totalRevenue += amount;
    if (inv.paid_date) {
      const month = new Date(inv.paid_date).getMonth() + 1;
      monthlyRevenue[month] += amount;
    }
  });

  // Get outstanding invoices
  const { data: outstanding } = await supabase
    .from("invoices")
    .select("total")
    .eq("user_id", user.id)
    .in("status", ["sent", "overdue"]);

  const totalOutstanding = (outstanding || []).reduce(
    (sum, inv) => sum + inv.total,
    0
  );

  // Get overdue invoices
  const { data: overdue } = await supabase
    .from("invoices")
    .select("total")
    .eq("user_id", user.id)
    .eq("status", "overdue");

  const totalOverdue = (overdue || []).reduce(
    (sum, inv) => sum + inv.total,
    0
  );

  return {
    data: {
      year: targetYear,
      totalRevenue,
      totalOutstanding,
      totalOverdue,
      invoiceCount: invoices?.length || 0,
      monthlyRevenue: Object.entries(monthlyRevenue).map(([month, amount]) => ({
        month: parseInt(month),
        amount,
      })),
    },
  };
}

export async function getClientReport() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Get all clients with their stats
  const { data: clients, error } = await supabase
    .from("clients")
    .select(`
      id,
      first_name,
      last_name,
      email,
      status,
      created_at
    `)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  // Get return counts per client
  const { data: returns } = await supabase
    .from("tax_returns")
    .select("client_id, status")
    .eq("user_id", user.id);

  // Get invoice totals per client
  const { data: invoices } = await supabase
    .from("invoices")
    .select("client_id, total, status, paid_amount")
    .eq("user_id", user.id);

  // Build client stats
  const clientStats = (clients || []).map((client) => {
    const clientReturns = (returns || []).filter(
      (r) => r.client_id === client.id
    );
    const clientInvoices = (invoices || []).filter(
      (i) => i.client_id === client.id
    );

    const totalBilled = clientInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = clientInvoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + (inv.paid_amount || inv.total), 0);

    return {
      id: client.id,
      name: `${client.first_name} ${client.last_name}`,
      email: client.email,
      status: client.status,
      createdAt: client.created_at,
      returnCount: clientReturns.length,
      completedReturns: clientReturns.filter(
        (r) => r.status === "filed" || r.status === "accepted"
      ).length,
      totalBilled,
      totalPaid,
      balance: totalBilled - totalPaid,
    };
  });

  // Summary stats
  const statusCounts = {
    active: clients?.filter((c) => c.status === "active").length || 0,
    inactive: clients?.filter((c) => c.status === "inactive").length || 0,
    prospect: clients?.filter((c) => c.status === "prospect").length || 0,
  };

  // Clients by month (for acquisition chart)
  const clientsByMonth: Record<string, number> = {};
  (clients || []).forEach((client) => {
    const date = new Date(client.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    clientsByMonth[key] = (clientsByMonth[key] || 0) + 1;
  });

  return {
    data: {
      totalClients: clients?.length || 0,
      statusCounts,
      clientStats: clientStats.sort((a, b) => b.totalPaid - a.totalPaid),
      acquisitionByMonth: Object.entries(clientsByMonth)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12),
    },
  };
}

export async function getTaxReturnReport(year?: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const targetYear = year || new Date().getFullYear();

  // Get all returns for the tax year
  const { data: returns, error } = await supabase
    .from("tax_returns")
    .select(`
      id,
      tax_year,
      return_type,
      status,
      filed_date,
      preparation_fee,
      total_income,
      refund_amount,
      amount_due,
      clients (
        first_name,
        last_name
      )
    `)
    .eq("user_id", user.id)
    .eq("tax_year", targetYear);

  if (error) {
    return { error: error.message };
  }

  // Status breakdown
  const statusCounts: Record<string, number> = {
    not_started: 0,
    in_progress: 0,
    pending_review: 0,
    pending_client: 0,
    ready_to_file: 0,
    filed: 0,
    accepted: 0,
    rejected: 0,
  };

  // Return type breakdown
  const typeCounts: Record<string, number> = {};

  // Calculate stats
  let totalPrepFees = 0;
  let totalRefunds = 0;
  let totalOwed = 0;

  (returns || []).forEach((ret) => {
    statusCounts[ret.status] = (statusCounts[ret.status] || 0) + 1;
    typeCounts[ret.return_type] = (typeCounts[ret.return_type] || 0) + 1;

    if (ret.preparation_fee) totalPrepFees += ret.preparation_fee;
    if (ret.refund_amount) totalRefunds += ret.refund_amount;
    if (ret.amount_due) totalOwed += ret.amount_due;
  });

  // Calculate completion rate
  const completed = (statusCounts.filed || 0) + (statusCounts.accepted || 0);
  const total = returns?.length || 0;
  const completionRate = total > 0 ? (completed / total) * 100 : 0;

  return {
    data: {
      taxYear: targetYear,
      totalReturns: total,
      completedReturns: completed,
      completionRate,
      statusCounts,
      typeCounts: Object.entries(typeCounts).map(([type, count]) => ({
        type,
        count,
      })),
      totalPrepFees,
      totalRefunds,
      totalOwed,
      returns: (returns || []).map((ret) => {
        const client = ret.clients as unknown as { first_name: string; last_name: string } | null;
        return {
          id: ret.id,
          clientName: client
            ? `${client.first_name} ${client.last_name}`
            : "Unknown",
          returnType: ret.return_type,
          status: ret.status,
          filedDate: ret.filed_date,
          prepFee: ret.preparation_fee,
          refund: ret.refund_amount,
          amountDue: ret.amount_due,
        };
      }),
    },
  };
}

export async function getAgingReport() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Get all unpaid invoices
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select(`
      id,
      invoice_number,
      due_date,
      total,
      status,
      clients (
        first_name,
        last_name,
        email
      )
    `)
    .eq("user_id", user.id)
    .in("status", ["sent", "overdue"])
    .order("due_date", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Categorize by age
  const aging = {
    current: [] as typeof invoices,
    thirtyDays: [] as typeof invoices,
    sixtyDays: [] as typeof invoices,
    ninetyDays: [] as typeof invoices,
    overNinety: [] as typeof invoices,
  };

  (invoices || []).forEach((inv) => {
    const dueDate = new Date(inv.due_date);
    const daysOverdue = Math.floor(
      (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysOverdue <= 0) {
      aging.current.push(inv);
    } else if (daysOverdue <= 30) {
      aging.thirtyDays.push(inv);
    } else if (daysOverdue <= 60) {
      aging.sixtyDays.push(inv);
    } else if (daysOverdue <= 90) {
      aging.ninetyDays.push(inv);
    } else {
      aging.overNinety.push(inv);
    }
  });

  const calculateTotal = (invs: typeof invoices) =>
    (invs || []).reduce((sum, inv) => sum + inv.total, 0);

  return {
    data: {
      current: {
        count: aging.current.length,
        total: calculateTotal(aging.current),
        invoices: aging.current,
      },
      thirtyDays: {
        count: aging.thirtyDays.length,
        total: calculateTotal(aging.thirtyDays),
        invoices: aging.thirtyDays,
      },
      sixtyDays: {
        count: aging.sixtyDays.length,
        total: calculateTotal(aging.sixtyDays),
        invoices: aging.sixtyDays,
      },
      ninetyDays: {
        count: aging.ninetyDays.length,
        total: calculateTotal(aging.ninetyDays),
        invoices: aging.ninetyDays,
      },
      overNinety: {
        count: aging.overNinety.length,
        total: calculateTotal(aging.overNinety),
        invoices: aging.overNinety,
      },
      totalOutstanding: calculateTotal(invoices),
    },
  };
}
