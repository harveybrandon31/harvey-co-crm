"use server";

import { createClient } from "@/lib/supabase/server";
import {
  mockClients,
  mockTaxReturns,
  mockInvoices,
  DEMO_MODE,
} from "@/lib/mock-data";

export async function getRevenueReport(year?: number) {
  const targetYear = year || new Date().getFullYear();

  if (DEMO_MODE) {
    const paidInvoices = mockInvoices.filter(
      (inv) =>
        inv.status === "paid" &&
        inv.paid_date &&
        inv.paid_date.startsWith(targetYear.toString())
    );

    const monthlyRevenue: Record<number, number> = {};
    for (let i = 1; i <= 12; i++) {
      monthlyRevenue[i] = 0;
    }

    let totalRevenue = 0;
    paidInvoices.forEach((inv) => {
      const amount = inv.paid_amount || inv.total;
      totalRevenue += amount;
      if (inv.paid_date) {
        const month = new Date(inv.paid_date).getMonth() + 1;
        monthlyRevenue[month] += amount;
      }
    });

    const totalOutstanding = mockInvoices
      .filter((inv) => inv.status === "sent" || inv.status === "overdue")
      .reduce((sum, inv) => sum + inv.total, 0);

    const totalOverdue = mockInvoices
      .filter((inv) => inv.status === "overdue")
      .reduce((sum, inv) => sum + inv.total, 0);

    return {
      data: {
        year: targetYear,
        totalRevenue,
        totalOutstanding,
        totalOverdue,
        invoiceCount: paidInvoices.length,
        monthlyRevenue: Object.entries(monthlyRevenue).map(([month, amount]) => ({
          month: parseInt(month),
          amount,
        })),
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

  const startDate = `${targetYear}-01-01`;
  const endDate = `${targetYear}-12-31`;

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

  const { data: outstanding } = await supabase
    .from("invoices")
    .select("total")
    .eq("user_id", user.id)
    .in("status", ["sent", "overdue"]);

  const totalOutstanding = (outstanding || []).reduce(
    (sum, inv) => sum + inv.total,
    0
  );

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
  if (DEMO_MODE) {
    const clientStats = mockClients.map((client) => {
      const clientReturns = mockTaxReturns.filter(
        (r) => r.client_id === client.id
      );
      const clientInvoices = mockInvoices.filter(
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

    const statusCounts = {
      active: mockClients.filter((c) => c.status === "active").length,
      inactive: mockClients.filter((c) => c.status === "inactive").length,
      prospect: mockClients.filter((c) => c.status === "prospect").length,
    };

    const clientsByMonth: Record<string, number> = {};
    mockClients.forEach((client) => {
      const date = new Date(client.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      clientsByMonth[key] = (clientsByMonth[key] || 0) + 1;
    });

    return {
      data: {
        totalClients: mockClients.length,
        statusCounts,
        clientStats: clientStats.sort((a, b) => b.totalPaid - a.totalPaid),
        acquisitionByMonth: Object.entries(clientsByMonth)
          .map(([month, count]) => ({ month, count }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-12),
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

  const { data: clients, error } = await supabase
    .from("clients")
    .select("id, first_name, last_name, email, status, created_at")
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  const { data: returns } = await supabase
    .from("tax_returns")
    .select("client_id, status")
    .eq("user_id", user.id);

  const { data: invoices } = await supabase
    .from("invoices")
    .select("client_id, total, status, paid_amount")
    .eq("user_id", user.id);

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

  const statusCounts = {
    active: clients?.filter((c) => c.status === "active").length || 0,
    inactive: clients?.filter((c) => c.status === "inactive").length || 0,
    prospect: clients?.filter((c) => c.status === "prospect").length || 0,
  };

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
  const targetYear = year || new Date().getFullYear();

  if (DEMO_MODE) {
    const returns = mockTaxReturns.filter((r) => r.tax_year === targetYear);

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

    const typeCounts: Record<string, number> = {};

    let totalPrepFees = 0;
    let totalRefunds = 0;
    let totalOwed = 0;

    returns.forEach((ret) => {
      statusCounts[ret.status] = (statusCounts[ret.status] || 0) + 1;
      typeCounts[ret.return_type] = (typeCounts[ret.return_type] || 0) + 1;

      if (ret.preparation_fee) totalPrepFees += ret.preparation_fee;
      if (ret.refund_amount) totalRefunds += ret.refund_amount;
      if (ret.amount_due) totalOwed += ret.amount_due;
    });

    const completed = (statusCounts.filed || 0) + (statusCounts.accepted || 0);
    const total = returns.length;
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
        returns: returns.map((ret) => {
          const client = mockClients.find((c) => c.id === ret.client_id);
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

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

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

  const typeCounts: Record<string, number> = {};

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

interface AgingInvoice {
  id: string;
  invoice_number: string;
  due_date: string;
  total: number;
  status: string;
  clients: {
    first_name: string;
    last_name: string;
    email: string | null;
  };
}

export async function getAgingReport() {
  if (DEMO_MODE) {
    const unpaidInvoices = mockInvoices.filter(
      (inv) => inv.status === "sent" || inv.status === "overdue"
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const aging = {
      current: [] as AgingInvoice[],
      thirtyDays: [] as AgingInvoice[],
      sixtyDays: [] as AgingInvoice[],
      ninetyDays: [] as AgingInvoice[],
      overNinety: [] as AgingInvoice[],
    };

    unpaidInvoices.forEach((inv) => {
      const dueDate = new Date(inv.due_date);
      const daysOverdue = Math.floor(
        (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const client = mockClients.find((c) => c.id === inv.client_id);
      const invWithClient: AgingInvoice = {
        id: inv.id,
        invoice_number: inv.invoice_number,
        due_date: inv.due_date,
        total: inv.total,
        status: inv.status,
        clients: {
          first_name: client?.first_name || "",
          last_name: client?.last_name || "",
          email: client?.email || null,
        },
      };

      if (daysOverdue <= 0) {
        aging.current.push(invWithClient);
      } else if (daysOverdue <= 30) {
        aging.thirtyDays.push(invWithClient);
      } else if (daysOverdue <= 60) {
        aging.sixtyDays.push(invWithClient);
      } else if (daysOverdue <= 90) {
        aging.ninetyDays.push(invWithClient);
      } else {
        aging.overNinety.push(invWithClient);
      }
    });

    const calculateTotal = (invs: AgingInvoice[]) =>
      invs.reduce((sum, inv) => sum + inv.total, 0);

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
        totalOutstanding: unpaidInvoices.reduce((sum, inv) => sum + inv.total, 0),
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

  const aging = {
    current: [] as AgingInvoice[],
    thirtyDays: [] as AgingInvoice[],
    sixtyDays: [] as AgingInvoice[],
    ninetyDays: [] as AgingInvoice[],
    overNinety: [] as AgingInvoice[],
  };

  (invoices || []).forEach((inv) => {
    const dueDate = new Date(inv.due_date);
    const daysOverdue = Math.floor(
      (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const client = inv.clients as unknown as { first_name: string; last_name: string; email: string | null };
    const agingInv: AgingInvoice = {
      id: inv.id,
      invoice_number: inv.invoice_number,
      due_date: inv.due_date,
      total: inv.total,
      status: inv.status,
      clients: {
        first_name: client?.first_name || "",
        last_name: client?.last_name || "",
        email: client?.email || null,
      },
    };

    if (daysOverdue <= 0) {
      aging.current.push(agingInv);
    } else if (daysOverdue <= 30) {
      aging.thirtyDays.push(agingInv);
    } else if (daysOverdue <= 60) {
      aging.sixtyDays.push(agingInv);
    } else if (daysOverdue <= 90) {
      aging.ninetyDays.push(agingInv);
    } else {
      aging.overNinety.push(agingInv);
    }
  });

  const calculateTotal = (invs: AgingInvoice[]) =>
    invs.reduce((sum, inv) => sum + inv.total, 0);

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
      totalOutstanding: (invoices || []).reduce((sum, inv) => sum + inv.total, 0),
    },
  };
}
