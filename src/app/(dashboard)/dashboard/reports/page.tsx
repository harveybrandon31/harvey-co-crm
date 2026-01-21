import { Suspense } from "react";
import ReportsTabs from "./ReportsTabs";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; year?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <h1 className="font-brand-heading text-2xl font-semibold text-gray-900">Reports</h1>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading reports...</div>
          </div>
        }
      >
        <ReportsTabs initialTab={params.tab} initialYear={params.year} />
      </Suspense>
    </div>
  );
}
