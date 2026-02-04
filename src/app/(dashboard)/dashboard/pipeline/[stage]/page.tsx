import { notFound } from "next/navigation";
import Link from "next/link";
import { getClientsForStage, getPipelineStageConfig } from "@/lib/analytics/queries";
import StageClientTable from "@/components/pipeline/StageClientTable";

export const dynamic = "force-dynamic";

const colorMap: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
  indigo: "bg-indigo-100 text-indigo-700",
  purple: "bg-purple-100 text-purple-700",
  emerald: "bg-emerald-100 text-emerald-700",
  sky: "bg-sky-100 text-sky-700",
  green: "bg-green-100 text-green-700",
};

export default async function PipelineStagePage({
  params,
}: {
  params: Promise<{ stage: string }>;
}) {
  const { stage: stageKey } = await params;

  const stages = getPipelineStageConfig();
  const stageConfig = stages.find((s) => s.key === stageKey);

  if (!stageConfig) {
    notFound();
  }

  const clients = await getClientsForStage(stageKey);
  const badgeColor = colorMap[stageConfig.color] || colorMap.blue;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="font-brand-heading text-2xl font-semibold text-gray-900">
            {stageConfig.label}
          </h1>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${badgeColor}`}>
            {clients.length} client{clients.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Client Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <StageClientTable clients={clients} showStartProcessing={stageKey === "intake-completed"} />
      </div>
    </div>
  );
}
