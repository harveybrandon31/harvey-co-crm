import {
  getDashboardStats,
  getReturnStatusBreakdown,
  getMonthlyFilingData,
  getRecentActivity,
  getUpcomingDeadlines,
  getClientOverview,
} from "@/lib/analytics/queries";
import StatsCards from "@/components/analytics/StatsCards";
import StatusPieChart from "@/components/analytics/StatusPieChart";
import MonthlyFilingsChart from "@/components/analytics/MonthlyFilingsChart";
import RecentActivityFeed from "@/components/analytics/RecentActivityFeed";
import UpcomingDeadlines from "@/components/analytics/UpcomingDeadlines";
import ClientOverview from "@/components/analytics/ClientOverview";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const currentYear = new Date().getFullYear();

  const [stats, statusBreakdown, monthlyData, recentActivity, upcomingDeadlines, clientOverview] =
    await Promise.all([
      getDashboardStats(),
      getReturnStatusBreakdown(),
      getMonthlyFilingData(currentYear),
      getRecentActivity(8),
      getUpcomingDeadlines(30),
      getClientOverview(),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-brand-heading text-2xl font-semibold text-gray-900">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back. Here&apos;s what&apos;s happening today.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
            })}
          </p>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-brand-heading text-lg font-semibold text-gray-900 mb-4">
            Return Status Breakdown
          </h2>
          <StatusPieChart data={statusBreakdown} />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-brand-heading text-lg font-semibold text-gray-900 mb-4">
            {currentYear} Filing Activity
          </h2>
          <MonthlyFilingsChart data={monthlyData} />
        </div>
      </div>

      {/* Client Overview & Deadlines Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClientOverview
          totalClients={clientOverview.totalClients}
          activeClients={clientOverview.activeClients}
          newIntakes={clientOverview.newIntakes}
          pendingDocuments={clientOverview.pendingDocuments}
          recentClients={clientOverview.recentClients}
        />

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-brand-heading text-lg font-semibold text-gray-900 mb-4">
            Upcoming Deadlines
          </h2>
          <UpcomingDeadlines deadlines={upcomingDeadlines} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-brand-heading text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h2>
        <RecentActivityFeed activities={recentActivity} />
      </div>
    </div>
  );
}
