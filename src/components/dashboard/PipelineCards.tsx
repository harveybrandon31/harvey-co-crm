import Link from "next/link";
import type { PipelineStage } from "@/lib/analytics/queries";

const colorMap: Record<string, { border: string; bg: string; badge: string; text: string }> = {
  blue: { border: "border-l-blue-500", bg: "bg-blue-50", badge: "bg-blue-100 text-blue-700", text: "text-blue-700" },
  amber: { border: "border-l-amber-500", bg: "bg-amber-50", badge: "bg-amber-100 text-amber-700", text: "text-amber-700" },
  indigo: { border: "border-l-indigo-500", bg: "bg-indigo-50", badge: "bg-indigo-100 text-indigo-700", text: "text-indigo-700" },
  purple: { border: "border-l-purple-500", bg: "bg-purple-50", badge: "bg-purple-100 text-purple-700", text: "text-purple-700" },
  emerald: { border: "border-l-emerald-500", bg: "bg-emerald-50", badge: "bg-emerald-100 text-emerald-700", text: "text-emerald-700" },
  sky: { border: "border-l-sky-500", bg: "bg-sky-50", badge: "bg-sky-100 text-sky-700", text: "text-sky-700" },
  green: { border: "border-l-green-500", bg: "bg-green-50", badge: "bg-green-100 text-green-700", text: "text-green-700" },
};

const MAX_NAMES = 3;

export default function PipelineCards({ stages }: { stages: PipelineStage[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {stages.map((stage) => {
        const colors = colorMap[stage.color] || colorMap.blue;
        const overflow = stage.count - MAX_NAMES;

        return (
          <Link
            key={stage.key}
            href={`/dashboard/pipeline/${stage.key}`}
            className={`block bg-white rounded-xl border border-gray-100 border-l-4 ${colors.border} shadow-sm p-4 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">{stage.label}</h3>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.badge}`}>
                {stage.count}
              </span>
            </div>

            {stage.count === 0 ? (
              <p className="text-xs text-gray-400 italic">No clients</p>
            ) : (
              <ul className="space-y-1">
                {stage.clients.slice(0, MAX_NAMES).map((client) => (
                  <li key={client.id} className="text-sm text-gray-600 truncate">
                    {client.first_name} {client.last_name}
                  </li>
                ))}
                {overflow > 0 && (
                  <li className={`text-xs font-medium ${colors.text}`}>
                    and {overflow} more
                  </li>
                )}
              </ul>
            )}
          </Link>
        );
      })}
    </div>
  );
}
