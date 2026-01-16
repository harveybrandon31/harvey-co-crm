import { Suspense } from "react";
import ReportsTabs from "./ReportsTabs";

export default function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; year?: string }>;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading reports...</div>
          </div>
        }
      >
        <ReportsTabs searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
