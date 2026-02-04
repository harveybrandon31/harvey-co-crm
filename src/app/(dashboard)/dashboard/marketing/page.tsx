import Link from "next/link";
import { DEMO_MODE } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

interface CampaignSummary {
  id: string;
  name: string;
  type: "email" | "sms" | "both";
  status: string;
  total_recipients: number;
  delivered_count: number;
  sent_at: string | null;
  created_at: string;
}

async function getMarketingStats(): Promise<{
  totalCampaigns: number;
  activeCampaigns: number;
  totalSent: number;
  totalDelivered: number;
  recentCampaigns: CampaignSummary[];
}> {
  if (DEMO_MODE) {
    return {
      totalCampaigns: 5,
      activeCampaigns: 1,
      totalSent: 248,
      totalDelivered: 235,
      recentCampaigns: [
        {
          id: "demo-1",
          name: "Tax Season Kickoff 2025",
          type: "both",
          status: "sent",
          total_recipients: 120,
          delivered_count: 115,
          sent_at: "2025-01-15T10:00:00Z",
          created_at: "2025-01-10T08:00:00Z",
        },
        {
          id: "demo-2",
          name: "Document Reminder Blast",
          type: "sms",
          status: "sent",
          total_recipients: 45,
          delivered_count: 43,
          sent_at: "2025-02-01T14:00:00Z",
          created_at: "2025-01-30T09:00:00Z",
        },
        {
          id: "demo-3",
          name: "Referral Program Launch",
          type: "email",
          status: "draft",
          total_recipients: 0,
          delivered_count: 0,
          sent_at: null,
          created_at: "2025-02-03T16:00:00Z",
        },
      ],
    };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, type, status, total_recipients, delivered_count, sent_at, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const allCampaigns = campaigns || [];
  const totalSent = allCampaigns.reduce((sum, c) => sum + (c.total_recipients || 0), 0);
  const totalDelivered = allCampaigns.reduce((sum, c) => sum + (c.delivered_count || 0), 0);

  return {
    totalCampaigns: allCampaigns.length,
    activeCampaigns: allCampaigns.filter((c) => c.status === "sending" || c.status === "scheduled").length,
    totalSent,
    totalDelivered,
    recentCampaigns: allCampaigns as CampaignSummary[],
  };
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-100 text-blue-700",
  sending: "bg-amber-100 text-amber-700",
  sent: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const typeIcons: Record<string, string> = {
  email: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  sms: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
  both: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
};

export default async function MarketingDashboardPage() {
  const stats = await getMarketingStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-brand-heading text-2xl font-semibold text-gray-900">
            Marketing Hub
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage client outreach campaigns.
          </p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500">Total Campaigns</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.totalCampaigns}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-semibold text-[#2D4A43] mt-1">{stats.activeCampaigns}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500">Messages Sent</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.totalSent.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500">Delivered</p>
          <p className="text-2xl font-semibold text-emerald-600 mt-1">{stats.totalDelivered.toLocaleString()}</p>
        </div>
      </div>

      {/* Recent Campaigns + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Campaigns */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-brand-heading text-lg font-semibold text-gray-900">
              Recent Campaigns
            </h2>
            <Link href="/dashboard/marketing/campaigns" className="text-sm text-[#2D4A43] hover:underline">
              View All
            </Link>
          </div>

          {stats.recentCampaigns.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">No campaigns yet.</p>
              <Link
                href="/dashboard/marketing/campaigns/new"
                className="mt-4 inline-flex items-center text-sm font-medium text-[#2D4A43] hover:underline"
              >
                Create your first campaign
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {stats.recentCampaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/dashboard/marketing/campaigns/${campaign.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-[#F5F3EF] flex items-center justify-center flex-shrink-0">
                    <svg className="h-5 w-5 text-[#2D4A43]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d={typeIcons[campaign.type] || typeIcons.email} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{campaign.name}</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[campaign.status] || statusColors.draft}`}>
                        {campaign.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {campaign.type === "both" ? "Email + SMS" : campaign.type.toUpperCase()}
                      {campaign.sent_at && (
                        <span className="ml-2">
                          Sent {new Date(campaign.sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-gray-900">{campaign.total_recipients}</p>
                    <p className="text-xs text-gray-500">recipients</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-brand-heading text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/dashboard/marketing/campaigns/new"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Campaign</p>
                  <p className="text-xs text-gray-500">Send bulk emails to clients</p>
                </div>
              </Link>
              <Link
                href="/dashboard/marketing/campaigns/new"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">SMS Campaign</p>
                  <p className="text-xs text-gray-500">Send text messages to clients</p>
                </div>
              </Link>
              <Link
                href="/dashboard/marketing/campaigns"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">View Reports</p>
                  <p className="text-xs text-gray-500">Campaign analytics & metrics</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-[#F5F3EF] rounded-xl border border-[#C9A962]/20 p-6">
            <div className="flex items-center gap-2 mb-3">
              <svg className="h-5 w-5 text-[#C9A962]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
              <h3 className="text-sm font-semibold text-gray-900">Tips</h3>
            </div>
            <ul className="space-y-2 text-xs text-gray-600">
              <li>SMS messages are limited to 160 characters for best delivery</li>
              <li>Personalize with client names for higher engagement</li>
              <li>Schedule campaigns during business hours (9am-5pm)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
