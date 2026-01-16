import {
  getDashboardStats,
  getReturnStatusBreakdown,
  getMonthlyFilingData,
  getRecentActivity,
  getUpcomingDeadlines,
} from "@/lib/analytics/queries";
import StatsCards from "@/components/analytics/StatsCards";
import StatusPieChart from "@/components/analytics/StatusPieChart";
import MonthlyFilingsChart from "@/components/analytics/MonthlyFilingsChart";
import RecentActivityFeed from "@/components/analytics/RecentActivityFeed";
import UpcomingDeadlines from "@/components/analytics/UpcomingDeadlines";

export default async function DashboardPage() {
  const currentYear = new Date().getFullYear();

  const [stats, statusBreakdown, monthlyData, recentActivity, upcomingDeadlines] =
    await Promise.all([
      getDashboardStats(),
      getReturnStatusBreakdown(),
      getMonthlyFilingData(currentYear),
      getRecentActivity(8),
      getUpcomingDeadlines(30),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Return Status Breakdown
          </h2>
          <StatusPieChart data={statusBreakdown} />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {currentYear} Filing Activity
          </h2>
          <MonthlyFilingsChart data={monthlyData} />
        </div>
      </div>

      {/* Activity & Deadlines Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <RecentActivityFeed activities={recentActivity} />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Upcoming Deadlines
          </h2>
          <UpcomingDeadlines deadlines={upcomingDeadlines} />
        </div>
      </div>
    </div>
  );
}
