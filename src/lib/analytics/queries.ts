import { createClient } from "@/lib/supabase/server";
import {
  mockClients,
  mockTaxReturns,
  mockDocuments,
  DEMO_MODE,
} from "@/lib/mock-data";

export interface ClientOverviewStats {
  totalClients: number;
  activeClients: number;
  newIntakes: number;
  pendingDocuments: number;
  recentClients: {
    id: string;
    name: string;
    status: string;
    pipelineStatus?: string;
    lastActivity?: string;
    hasOutstandingDocs?: boolean;
  }[];
}

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
  if (DEMO_MODE) {
    const activeClients = mockClients.filter((c) => c.status === "active").length;
    const pendingStatuses = ["in_progress", "pending_review", "pending_client", "ready_to_file"];
    const filedStatuses = ["filed", "accepted"];

    const pendingReturns = mockTaxReturns.filter((r) =>
      pendingStatuses.includes(r.status)
    ).length;

    const filedReturns = mockTaxReturns.filter((r) =>
      filedStatuses.includes(r.status)
    ).length;

    const totalRevenue = mockTaxReturns
      .filter((r) => r.fee_paid && r.preparation_fee)
      .reduce((sum, r) => sum + (r.preparation_fee || 0), 0);

    const unpaidFees = mockTaxReturns
      .filter((r) => !r.fee_paid && r.preparation_fee)
      .reduce((sum, r) => sum + (r.preparation_fee || 0), 0);

    return {
      totalClients: mockClients.length,
      activeClients,
      totalReturns: mockTaxReturns.length,
      pendingReturns,
      filedReturns,
      totalRevenue,
      unpaidFees,
    };
  }

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
  if (DEMO_MODE) {
    const counts: Record<string, number> = {};
    mockTaxReturns.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });

    return Object.entries(counts).map(([status, count]) => ({
      status,
      count,
    }));
  }

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
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const monthlyData: MonthlyData[] = months.map((month) => ({
    month,
    filed: 0,
    accepted: 0,
  }));

  if (DEMO_MODE) {
    mockTaxReturns.forEach((r) => {
      if (r.filed_date && r.filed_date.startsWith(year.toString())) {
        const monthIndex = new Date(r.filed_date).getMonth();
        monthlyData[monthIndex].filed++;
      }
      if (r.accepted_date && r.accepted_date.startsWith(year.toString())) {
        const monthIndex = new Date(r.accepted_date).getMonth();
        monthlyData[monthIndex].accepted++;
      }
    });

    return monthlyData;
  }

  const supabase = await createClient();

  const { data } = await supabase
    .from("tax_returns")
    .select("filed_date, accepted_date, status")
    .gte("filed_date", `${year}-01-01`)
    .lte("filed_date", `${year}-12-31`);

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
  if (DEMO_MODE) {
    const activities: RecentActivity[] = [];

    // Add client activities
    mockClients.slice(0, 5).forEach((c) => {
      activities.push({
        id: `client-${c.id}`,
        type: "client",
        action: "New client added",
        description: `${c.first_name} ${c.last_name}`,
        created_at: c.created_at,
      });
    });

    // Add return activities
    mockTaxReturns.slice(0, 5).forEach((r) => {
      const client = mockClients.find((c) => c.id === r.client_id);
      const statusLabel = r.status.replace(/_/g, " ");
      activities.push({
        id: `return-${r.id}`,
        type: "return",
        action: `Return ${statusLabel}`,
        description: `${r.tax_year} ${r.return_type} - ${client?.first_name || ""} ${client?.last_name || ""}`,
        created_at: r.updated_at,
      });
    });

    // Add document activities
    mockDocuments.slice(0, 5).forEach((d) => {
      const client = mockClients.find((c) => c.id === d.client_id);
      activities.push({
        id: `doc-${d.id}`,
        type: "document",
        action: "Document uploaded",
        description: `${d.name} - ${client?.first_name || ""} ${client?.last_name || ""}`,
        created_at: d.created_at,
      });
    });

    return activities
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

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
  if (DEMO_MODE) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const pendingStatuses = ["not_started", "in_progress", "pending_review", "pending_client", "ready_to_file"];

    return mockTaxReturns
      .filter((r) => {
        if (!pendingStatuses.includes(r.status)) return false;
        if (!r.due_date) return false;
        const dueDate = new Date(r.due_date);
        return dueDate <= futureDate;
      })
      .map((r) => {
        const client = mockClients.find((c) => c.id === r.client_id);
        return {
          id: r.id,
          tax_year: r.tax_year,
          return_type: r.return_type,
          due_date: r.due_date,
          extended_due_date: r.extended_due_date,
          status: r.status,
          clients: {
            id: client?.id || "",
            first_name: client?.first_name || "",
            last_name: client?.last_name || "",
          },
        };
      })
      .sort((a, b) => {
        const dateA = a.due_date ? new Date(a.due_date).getTime() : 0;
        const dateB = b.due_date ? new Date(b.due_date).getTime() : 0;
        return dateA - dateB;
      });
  }

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

export async function getClientOverview(): Promise<ClientOverviewStats> {
  if (DEMO_MODE) {
    const activeClients = mockClients.filter((c) => c.status === "active").length;
    const newIntakes = 3; // Mock: clients with new_intake status

    // Mock recent clients with activity
    const recentClients = mockClients.slice(0, 5).map((c) => ({
      id: c.id,
      name: `${c.first_name} ${c.last_name}`,
      status: c.status,
      pipelineStatus: c.status === "active" ? "in_preparation" : c.status === "prospect" ? "new_intake" : undefined,
      lastActivity: `Updated ${Math.floor(Math.random() * 7) + 1} days ago`,
      hasOutstandingDocs: Math.random() > 0.5 && c.status === "active",
    }));

    return {
      totalClients: mockClients.length,
      activeClients,
      newIntakes,
      pendingDocuments: 4, // Mock value
      recentClients,
    };
  }

  const supabase = await createClient();

  // Get counts
  const [totalResult, activeResult, intakesResult] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("pipeline_status", "new_intake"),
  ]);

  // Get recent clients with their pipeline status
  const { data: recentClientsData } = await supabase
    .from("clients")
    .select("id, first_name, last_name, status, pipeline_status, updated_at")
    .order("updated_at", { ascending: false })
    .limit(5);

  const recentClients = (recentClientsData || []).map((c) => ({
    id: c.id,
    name: `${c.first_name} ${c.last_name}`,
    status: c.status,
    pipelineStatus: c.pipeline_status,
    lastActivity: `Updated ${formatTimeAgo(c.updated_at)}`,
    hasOutstandingDocs: c.pipeline_status === "documents_requested",
  }));

  return {
    totalClients: totalResult.count ?? 0,
    activeClients: activeResult.count ?? 0,
    newIntakes: intakesResult.count ?? 0,
    pendingDocuments: recentClients.filter((c) => c.hasOutstandingDocs).length,
    recentClients,
  };
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export interface PendingIntakeReview {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  filingStatus: string | null;
  intakeCompletedAt: string;
  hasDependents: boolean;
  dependentCount: number;
}

export async function getPendingIntakeReviews(): Promise<PendingIntakeReview[]> {
  if (DEMO_MODE) {
    return [];
  }

  const supabase = await createClient();

  // Get clients who have completed intake but are still in new_intake pipeline status
  const { data: clients, error } = await supabase
    .from("clients")
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      filing_status,
      intake_completed_at,
      has_spouse
    `)
    .eq("intake_completed", true)
    .eq("pipeline_status", "new_intake")
    .order("intake_completed_at", { ascending: false });

  if (error) {
    console.error("Error fetching pending intake reviews:", error);
    return [];
  }

  // Get dependent counts for each client
  const clientIds = (clients || []).map(c => c.id);

  const dependentCounts: Record<string, number> = {};
  if (clientIds.length > 0) {
    const { data: dependents } = await supabase
      .from("dependents")
      .select("client_id")
      .in("client_id", clientIds);

    if (dependents) {
      dependents.forEach(d => {
        dependentCounts[d.client_id] = (dependentCounts[d.client_id] || 0) + 1;
      });
    }
  }

  return (clients || []).map(c => ({
    id: c.id,
    firstName: c.first_name,
    lastName: c.last_name,
    email: c.email,
    phone: c.phone,
    filingStatus: c.filing_status,
    intakeCompletedAt: c.intake_completed_at,
    hasDependents: (dependentCounts[c.id] || 0) > 0,
    dependentCount: dependentCounts[c.id] || 0,
  }));
}
