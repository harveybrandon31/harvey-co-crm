import Link from "next/link";
import { notFound } from "next/navigation";
import { DEMO_MODE } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  type: "email" | "sms" | "both";
  status: string;
  subject: string | null;
  email_body: string | null;
  sms_body: string | null;
  audience_filter: Record<string, unknown> | null;
  audience_count: number;
  total_recipients: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  failed_count: number;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
}

const mockCampaign: Campaign = {
  id: "demo-1",
  name: "Tax Season Kickoff 2025",
  description: "Annual tax season announcement to all clients",
  type: "both",
  status: "sent",
  subject: "Tax Season 2025 Is Here - Let's Get Started!",
  email_body: "Hi {firstName},\n\nTax season is here! I hope the new year is treating you well.\n\nLet's get your taxes filed early this year. We've streamlined our process to make things faster and easier for you.\n\nReady to get started? Reply to this email or click the link below to begin your intake.\n\nBest,\nBrandon Harvey\nHarvey & Co Financial Services",
  sms_body: "Hi {firstName}! Brandon here from Harvey & Co. Tax season 2025 is here! Let's get your taxes done early this year. Reply YES to get started!",
  audience_filter: { type: "all" },
  audience_count: 120,
  total_recipients: 120,
  delivered_count: 115,
  opened_count: 78,
  clicked_count: 34,
  bounced_count: 3,
  failed_count: 2,
  scheduled_at: null,
  sent_at: "2025-01-15T10:00:00Z",
  created_at: "2025-01-10T08:00:00Z",
};

async function getCampaign(id: string): Promise<Campaign | null> {
  if (DEMO_MODE) {
    if (id.startsWith("demo-")) return { ...mockCampaign, id };
    return null;
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  return data as Campaign | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-100 text-blue-700",
  sending: "bg-amber-100 text-amber-700",
  sent: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaign(id);

  if (!campaign) {
    notFound();
  }

  const deliveryRate = campaign.total_recipients > 0
    ? Math.round((campaign.delivered_count / campaign.total_recipients) * 100)
    : 0;
  const openRate = campaign.delivered_count > 0
    ? Math.round((campaign.opened_count / campaign.delivered_count) * 100)
    : 0;
  const clickRate = campaign.opened_count > 0
    ? Math.round((campaign.clicked_count / campaign.opened_count) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/marketing/campaigns"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Campaigns
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-brand-heading text-2xl font-semibold text-gray-900">
              {campaign.name}
            </h1>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusColors[campaign.status] || statusColors.draft}`}>
              {campaign.status}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {campaign.status === "draft" && (
              <>
                <button
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Schedule
                </button>
                <button
                  className="rounded-lg bg-[#2D4A43] px-4 py-2 text-sm font-medium text-white hover:bg-[#3D5A53] transition-all"
                >
                  Send Now
                </button>
              </>
            )}
            {campaign.status === "scheduled" && (
              <button
                className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-all"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
        {campaign.description && (
          <p className="text-sm text-gray-500 mt-1">{campaign.description}</p>
        )}
      </div>

      {/* Stats Grid */}
      {campaign.status === "sent" && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Sent</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">{campaign.total_recipients}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Delivered</p>
            <p className="text-xl font-semibold text-emerald-600 mt-1">{campaign.delivered_count}</p>
            <p className="text-xs text-gray-400 mt-0.5">{deliveryRate}%</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Opened</p>
            <p className="text-xl font-semibold text-blue-600 mt-1">{campaign.opened_count}</p>
            <p className="text-xs text-gray-400 mt-0.5">{openRate}%</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Clicked</p>
            <p className="text-xl font-semibold text-purple-600 mt-1">{campaign.clicked_count}</p>
            <p className="text-xs text-gray-400 mt-0.5">{clickRate}%</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Bounced</p>
            <p className="text-xl font-semibold text-amber-600 mt-1">{campaign.bounced_count}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Failed</p>
            <p className="text-xl font-semibold text-red-600 mt-1">{campaign.failed_count}</p>
          </div>
        </div>
      )}

      {/* Content Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Content */}
        {(campaign.type === "email" || campaign.type === "both") && campaign.email_body && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h2 className="font-semibold text-gray-900">Email Content</h2>
            </div>
            <div className="p-6">
              {campaign.subject && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Subject</p>
                  <p className="text-sm font-medium text-gray-900">{campaign.subject}</p>
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{campaign.email_body}</p>
              </div>
            </div>
          </div>
        )}

        {/* SMS Content */}
        {(campaign.type === "sms" || campaign.type === "both") && campaign.sms_body && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <h2 className="font-semibold text-gray-900">SMS Content</h2>
            </div>
            <div className="p-6">
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <p className="text-sm text-gray-700">{campaign.sms_body}</p>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {campaign.sms_body.length} characters
                {campaign.sms_body.length > 160 && ` (${Math.ceil(campaign.sms_body.length / 160)} segments)`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Campaign Info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Campaign Details</h2>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <dt className="text-xs text-gray-500 uppercase tracking-wide">Type</dt>
            <dd className="text-sm font-medium text-gray-900 mt-1">
              {campaign.type === "both" ? "Email + SMS" : campaign.type.toUpperCase()}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 uppercase tracking-wide">Audience</dt>
            <dd className="text-sm font-medium text-gray-900 mt-1">
              {campaign.audience_filter && typeof campaign.audience_filter === "object" && "type" in campaign.audience_filter
                ? String(campaign.audience_filter.type).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                : "All Clients"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 uppercase tracking-wide">Created</dt>
            <dd className="text-sm font-medium text-gray-900 mt-1">
              {new Date(campaign.created_at).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              })}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 uppercase tracking-wide">
              {campaign.sent_at ? "Sent" : campaign.scheduled_at ? "Scheduled" : "Last Updated"}
            </dt>
            <dd className="text-sm font-medium text-gray-900 mt-1">
              {campaign.sent_at
                ? new Date(campaign.sent_at).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
                  })
                : campaign.scheduled_at
                ? new Date(campaign.scheduled_at).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
                  })
                : "—"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
