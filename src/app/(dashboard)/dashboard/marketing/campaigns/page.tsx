import Link from "next/link";
import { DEMO_MODE } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

interface Campaign {
  id: string;
  name: string;
  type: "email" | "sms" | "both";
  status: string;
  total_recipients: number;
  delivered_count: number;
  opened_count: number;
  sent_at: string | null;
  scheduled_at: string | null;
  created_at: string;
}

const mockCampaigns: Campaign[] = [
  {
    id: "demo-1",
    name: "Tax Season Kickoff 2025",
    type: "both",
    status: "sent",
    total_recipients: 120,
    delivered_count: 115,
    opened_count: 78,
    sent_at: "2025-01-15T10:00:00Z",
    scheduled_at: null,
    created_at: "2025-01-10T08:00:00Z",
  },
  {
    id: "demo-2",
    name: "Document Reminder Blast",
    type: "sms",
    status: "sent",
    total_recipients: 45,
    delivered_count: 43,
    opened_count: 0,
    sent_at: "2025-02-01T14:00:00Z",
    scheduled_at: null,
    created_at: "2025-01-30T09:00:00Z",
  },
  {
    id: "demo-3",
    name: "Referral Program Launch",
    type: "email",
    status: "draft",
    total_recipients: 0,
    delivered_count: 0,
    opened_count: 0,
    sent_at: null,
    scheduled_at: null,
    created_at: "2025-02-03T16:00:00Z",
  },
  {
    id: "demo-4",
    name: "Early Bird Filing Promo",
    type: "email",
    status: "scheduled",
    total_recipients: 85,
    delivered_count: 0,
    opened_count: 0,
    sent_at: null,
    scheduled_at: "2025-02-15T09:00:00Z",
    created_at: "2025-02-02T11:00:00Z",
  },
  {
    id: "demo-5",
    name: "Happy Holidays",
    type: "both",
    status: "sent",
    total_recipients: 198,
    delivered_count: 190,
    opened_count: 132,
    sent_at: "2024-12-20T08:00:00Z",
    scheduled_at: null,
    created_at: "2024-12-18T14:00:00Z",
  },
];

async function getCampaigns(): Promise<Campaign[]> {
  if (DEMO_MODE) return mockCampaigns;

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data } = await supabase
    .from("campaigns")
    .select("id, name, type, status, total_recipients, delivered_count, opened_count, sent_at, scheduled_at, created_at")
    .order("created_at", { ascending: false });

  return (data || []) as Campaign[];
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-100 text-blue-700",
  sending: "bg-amber-100 text-amber-700",
  sent: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const typeLabels: Record<string, string> = {
  email: "Email",
  sms: "SMS",
  both: "Email + SMS",
};

export default async function CampaignsListPage() {
  const campaigns = await getCampaigns();

  const drafts = campaigns.filter((c) => c.status === "draft");
  const scheduled = campaigns.filter((c) => c.status === "scheduled");
  const sent = campaigns.filter((c) => c.status === "sent" || c.status === "sending");
  const cancelled = campaigns.filter((c) => c.status === "cancelled");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/marketing"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Marketing Hub
          </Link>
          <h1 className="font-brand-heading text-2xl font-semibold text-gray-900">
            Campaigns
          </h1>
        </div>
        <Link
          href="/dashboard/marketing/campaigns/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#2D4A43] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#3D5A53] transition-all shadow-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Campaign
        </Link>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535" />
            </svg>
            <p className="mt-4 text-sm text-gray-500">No campaigns created yet.</p>
            <Link
              href="/dashboard/marketing/campaigns/new"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#2D4A43] hover:underline"
            >
              Create your first campaign
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipients
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Delivered
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Opened
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/marketing/campaigns/${campaign.id}`}
                        className="text-sm font-medium text-[#2D4A43] hover:underline"
                      >
                        {campaign.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {typeLabels[campaign.type] || campaign.type}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[campaign.status] || statusColors.draft}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-right">
                      {campaign.total_recipients}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-right hidden md:table-cell">
                      {campaign.delivered_count}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-right hidden lg:table-cell">
                      {campaign.opened_count}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-right">
                      {campaign.sent_at
                        ? new Date(campaign.sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : campaign.scheduled_at
                        ? `Scheduled ${new Date(campaign.scheduled_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                        : new Date(campaign.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {campaigns.length > 0 && (
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <span>{drafts.length} draft{drafts.length !== 1 ? "s" : ""}</span>
          <span>{scheduled.length} scheduled</span>
          <span>{sent.length} sent</span>
          {cancelled.length > 0 && <span>{cancelled.length} cancelled</span>}
        </div>
      )}
    </div>
  );
}
