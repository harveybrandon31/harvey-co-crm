import { createClient } from "@/lib/supabase/server";

export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalReturns: number;
  pendingReturns: number;
  filedReturns: number;
  totalRevenue: number;
  unpaidFees: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface MonthlyData {
  month: string;
  filed: number;
  accepted: number;
}

export interface RecentActivity {
  id: string;
  type: "client" | "return" | "document";
  action: string;
  description: string;
  created_at: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const [
    clientsResult,
    activeClientsResult,
    returnsResult,
    pendingResult,
    filedResult,
    revenueResult,
    unpaidResult,
  ] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase.from("tax_returns").select("id", { count: "exact", head: true }),
    supabase
      .from("tax_returns")
      .select("id", { count: "exact", head: true })
      .in("status", ["in_progress", "pending_review", "pending_client", "ready_to_file"]),
    supabase
      .from("tax_returns")
      .select("id", { count: "exact", head: true })
      .in("status", ["filed", "accepted"]),
    supabase
      .from("tax_returns")
      .select("preparation_fee")
      .eq("fee_paid", true),
    supabase
      .from("tax_returns")
      .select("preparation_fee")
      .eq("fee_paid", false)
      .not("preparation_fee", "is", null),
  ]);

  const totalRevenue = (revenueResult.data || []).reduce(
    (sum, r) => sum + (r.preparation_fee || 0),
    0
  );

  const unpaidFees = (unpaidResult.data || []).reduce(
    (sum, r) => sum + (r.preparation_fee || 0),
    0
  );

  return {
    totalClients: clientsResult.count ?? 0,
    activeClients: activeClientsResult.count ?? 0,
    totalReturns: returnsResult.count ?? 0,
    pendingReturns: pendingResult.count ?? 0,
    filedReturns: filedResult.count ?? 0,
    totalRevenue,
    unpaidFees,
  };
}

export async function getReturnStatusBreakdown(): Promise<StatusCount[]> {
  const supabase = await createClient();

  const { data } = await supabase.from("tax_returns").select("status");

  if (!data) return [];

  const counts: Record<string, number> = {};
  data.forEach((r) => {
    counts[r.status] = (counts[r.status] || 0) + 1;
  });

  return Object.entries(counts).map(([status, count]) => ({
    status,
    count,
  }));
}

export async function getMonthlyFilingData(year: number): Promise<MonthlyData[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("tax_returns")
    .select("filed_date, accepted_date, status")
    .gte("filed_date", `${year}-01-01`)
    .lte("filed_date", `${year}-12-31`);

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const monthlyData: MonthlyData[] = months.map((month) => ({
    month,
    filed: 0,
    accepted: 0,
  }));

  (data || []).forEach((r) => {
    if (r.filed_date) {
      const monthIndex = new Date(r.filed_date).getMonth();
      monthlyData[monthIndex].filed++;
    }
    if (r.accepted_date) {
      const monthIndex = new Date(r.accepted_date).getMonth();
      monthlyData[monthIndex].accepted++;
    }
  });

  return monthlyData;
}

export async function getRecentActivity(limit = 10): Promise<RecentActivity[]> {
  const supabase = await createClient();

  // Get recent clients
  const { data: recentClients } = await supabase
    .from("clients")
    .select("id, first_name, last_name, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  // Get recent tax returns
  const { data: recentReturns } = await supabase
    .from("tax_returns")
    .select("id, tax_year, return_type, status, created_at, updated_at, clients(first_name, last_name)")
    .order("updated_at", { ascending: false })
    .limit(limit);

  // Get recent documents
  const { data: recentDocs } = await supabase
    .from("documents")
    .select("id, name, created_at, clients(first_name, last_name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  const activities: RecentActivity[] = [];

  // Add client activities
  (recentClients || []).forEach((c) => {
    activities.push({
      id: `client-${c.id}`,
      type: "client",
      action: "New client added",
      description: `${c.first_name} ${c.last_name}`,
      created_at: c.created_at,
    });
  });

  // Add return activities
  interface ReturnWithClient {
    id: string;
    tax_year: number;
    return_type: string;
    status: string;
    created_at: string;
    updated_at: string;
    clients: { first_name: string; last_name: string };
  }

  (recentReturns || []).forEach((r) => {
    const ret = r as unknown as ReturnWithClient;
    const statusLabel = ret.status.replace(/_/g, " ");
    activities.push({
      id: `return-${ret.id}`,
      type: "return",
      action: `Return ${statusLabel}`,
      description: `${ret.tax_year} ${ret.return_type} - ${ret.clients.first_name} ${ret.clients.last_name}`,
      created_at: ret.updated_at,
    });
  });

  // Add document activities
  interface DocWithClient {
    id: string;
    name: string;
    created_at: string;
    clients: { first_name: string; last_name: string };
  }

  (recentDocs || []).forEach((d) => {
    const doc = d as unknown as DocWithClient;
    activities.push({
      id: `doc-${doc.id}`,
      type: "document",
      action: "Document uploaded",
      description: `${doc.name} - ${doc.clients.first_name} ${doc.clients.last_name}`,
      created_at: doc.created_at,
    });
  });

  // Sort by date and return top items
  return activities
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export interface UpcomingDeadline {
  id: string;
  tax_year: number;
  return_type: string;
  due_date: string | null;
  extended_due_date: string | null;
  status: string;
  clients: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export async function getUpcomingDeadlines(days = 30): Promise<UpcomingDeadline[]> {
  const supabase = await createClient();

  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);

  const { data } = await supabase
    .from("tax_returns")
    .select("id, tax_year, return_type, due_date, extended_due_date, status, clients(id, first_name, last_name)")
    .in("status", ["not_started", "in_progress", "pending_review", "pending_client", "ready_to_file"])
    .or(`due_date.lte.${futureDate.toISOString()},extended_due_date.lte.${futureDate.toISOString()}`)
    .order("due_date", { ascending: true });

  // Cast to proper type (Supabase returns single object for foreign key, not array)
  return (data || []) as unknown as UpcomingDeadline[];
}
