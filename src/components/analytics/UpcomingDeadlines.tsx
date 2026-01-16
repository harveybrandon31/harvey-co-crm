import Link from "next/link";
import type { UpcomingDeadline } from "@/lib/analytics/queries";

interface UpcomingDeadlinesProps {
  deadlines: UpcomingDeadline[];
}

function getDaysUntil(dateString: string | null) {
  if (!dateString) return null;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function getUrgencyClass(days: number | null) {
  if (days === null) return "text-gray-500";
  if (days < 0) return "text-red-600 font-semibold";
  if (days <= 7) return "text-red-600";
  if (days <= 14) return "text-orange-500";
  if (days <= 30) return "text-yellow-600";
  return "text-gray-600";
}

function formatDeadline(days: number | null) {
  if (days === null) return "No date set";
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `${days} days`;
}

export default function UpcomingDeadlines({ deadlines }: UpcomingDeadlinesProps) {
  if (deadlines.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No upcoming deadlines
      </div>
    );
  }

  // Calculate effective due date for each deadline
  const deadlinesWithDays = deadlines.map((d) => {
    const effectiveDate = d.extended_due_date || d.due_date;
    const daysUntil = getDaysUntil(effectiveDate);
    return { ...d, effectiveDate, daysUntil };
  });

  // Sort by urgency
  deadlinesWithDays.sort((a, b) => {
    if (a.daysUntil === null) return 1;
    if (b.daysUntil === null) return -1;
    return a.daysUntil - b.daysUntil;
  });

  return (
    <div className="space-y-3">
      {deadlinesWithDays.slice(0, 5).map((deadline) => (
        <Link
          key={deadline.id}
          href={`/dashboard/returns/${deadline.id}`}
          className="block p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {deadline.clients.last_name}, {deadline.clients.first_name}
              </p>
              <p className="text-xs text-gray-500">
                {deadline.tax_year} {deadline.return_type}
              </p>
            </div>
            <div className="ml-4 text-right">
              <p className={`text-sm ${getUrgencyClass(deadline.daysUntil)}`}>
                {formatDeadline(deadline.daysUntil)}
              </p>
              {deadline.effectiveDate && (
                <p className="text-xs text-gray-400">
                  {new Date(deadline.effectiveDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
