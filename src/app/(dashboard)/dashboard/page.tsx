import {
  getPipelineStages,
  getRevenueStats,
  getRecentActivity,
  getUpcomingDeadlines,
  getPendingIntakeReviews,
} from "@/lib/analytics/queries";
import PipelineCards from "@/components/dashboard/PipelineCards";
import RevenueCards from "@/components/dashboard/RevenueCards";
import RecentActivityFeed from "@/components/analytics/RecentActivityFeed";
import UpcomingDeadlines from "@/components/analytics/UpcomingDeadlines";
import PendingIntakeReviews from "@/components/analytics/PendingIntakeReviews";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [pipelineStages, revenueStats, recentActivity, upcomingDeadlines, pendingIntakes] =
    await Promise.all([
      getPipelineStages(),
      getRevenueStats(),
      getRecentActivity(8),
      getUpcomingDeadlines(30),
      getPendingIntakeReviews(),
    ]);

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Pending Intake Reviews - Priority Alert */}
      {pendingIntakes.length > 0 && (
        <div className="bg-white rounded-xl border-2 border-amber-300 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h2 className="font-brand-heading text-lg font-semibold text-gray-900">
                Completed Intakes Pending Review
              </h2>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
              {pendingIntakes.length} pending
            </span>
          </div>
          <PendingIntakeReviews reviews={pendingIntakes} />
        </div>
      )}

      {/* Revenue Cards */}
      <RevenueCards stats={revenueStats} />

      {/* Client Pipeline */}
      <div>
        <h2 className="font-brand-heading text-lg font-semibold text-gray-900 mb-4">
          Client Pipeline
        </h2>
        <PipelineCards stages={pipelineStages} />
      </div>

      {/* Deadlines & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-brand-heading text-lg font-semibold text-gray-900 mb-4">
            Upcoming Deadlines
          </h2>
          <UpcomingDeadlines deadlines={upcomingDeadlines} />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-brand-heading text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <RecentActivityFeed activities={recentActivity} />
        </div>
      </div>
    </div>
  );
}
