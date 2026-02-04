"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DEMO_MODE } from "@/lib/mock-data";

type CampaignType = "email" | "sms" | "both";
type Step = 1 | 2 | 3 | 4;

const steps = [
  { number: 1, label: "Type" },
  { number: 2, label: "Details" },
  { number: 3, label: "Audience" },
  { number: 4, label: "Review" },
];

const audienceFilters = [
  { key: "all", label: "All Clients", description: "Send to every client in the system" },
  { key: "active", label: "Active Clients", description: "Clients with active tax returns" },
  { key: "intake_completed", label: "Intake Completed", description: "Clients who completed intake" },
  { key: "prospects", label: "Prospects Only", description: "Clients who haven't started a return" },
  { key: "returning", label: "Returning Clients", description: "Clients from previous tax years" },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [campaignType, setCampaignType] = useState<CampaignType | null>(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [smsBody, setSmsBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canProceed = () => {
    switch (step) {
      case 1: return campaignType !== null;
      case 2: {
        if (!name) return false;
        if ((campaignType === "email" || campaignType === "both") && (!subject || !emailBody)) return false;
        if ((campaignType === "sms" || campaignType === "both") && !smsBody) return false;
        return true;
      }
      case 3: return audience !== null;
      case 4: return true;
      default: return false;
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);

    if (DEMO_MODE) {
      // Simulate campaign creation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push("/dashboard/marketing/campaigns");
      return;
    }

    try {
      const response = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type: campaignType,
          subject: subject || null,
          email_body: emailBody || null,
          sms_body: smsBody || null,
          audience_filter: { type: audience },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/dashboard/marketing/campaigns/${data.id}`);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create campaign");
      }
    } catch {
      setError("Failed to create campaign");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/marketing/campaigns"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Campaigns
        </Link>
        <h1 className="font-brand-heading text-2xl font-semibold text-gray-900">
          New Campaign
        </h1>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.number} className="flex items-center">
            <button
              onClick={() => s.number < step ? setStep(s.number as Step) : undefined}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                s.number === step
                  ? "bg-[#2D4A43] text-white"
                  : s.number < step
                  ? "bg-[#2D4A43]/10 text-[#2D4A43] cursor-pointer hover:bg-[#2D4A43]/20"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              <span className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-current">
                {s.number < step ? (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s.number
                )}
              </span>
              {s.label}
            </button>
            {i < steps.length - 1 && (
              <div className={`w-8 h-px mx-1 ${s.number < step ? "bg-[#2D4A43]" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        {/* Step 1: Campaign Type */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Choose Campaign Type</h2>
            <p className="text-sm text-gray-500 mb-6">Select how you want to reach your clients.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { type: "email" as CampaignType, label: "Email", description: "Send professional emails", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", color: "blue" },
                { type: "sms" as CampaignType, label: "SMS", description: "Send text messages", icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z", color: "emerald" },
                { type: "both" as CampaignType, label: "Email + SMS", description: "Send both channels", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", color: "purple" },
              ].map((option) => (
                <button
                  key={option.type}
                  onClick={() => setCampaignType(option.type)}
                  className={`text-left p-5 rounded-xl border-2 transition-all ${
                    campaignType === option.type
                      ? `border-[#2D4A43] bg-[#2D4A43]/5`
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`h-10 w-10 rounded-lg bg-${option.color}-50 flex items-center justify-center mb-3`}>
                    <svg className={`h-5 w-5 text-${option.color}-600`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d={option.icon} />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{option.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Campaign Details */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Campaign Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Tax Season Kickoff 2025"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A43]"
              />
            </div>

            {(campaignType === "email" || campaignType === "both") && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., It's tax time! Let's get started."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A43]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Body</label>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={8}
                    placeholder="Write your email content here. Use {firstName} and {lastName} for personalization."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A43]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported variables: {"{firstName}"}, {"{lastName}"}, {"{email}"}
                  </p>
                </div>
              </>
            )}

            {(campaignType === "sms" || campaignType === "both") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SMS Message</label>
                <textarea
                  value={smsBody}
                  onChange={(e) => setSmsBody(e.target.value.slice(0, 320))}
                  rows={4}
                  placeholder="Hi {firstName}! This is Brandon from Harvey & Co..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A43]"
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    Supported variables: {"{firstName}"}, {"{lastName}"}
                  </p>
                  <p className={`text-xs ${smsBody.length > 160 ? "text-amber-600" : "text-gray-500"}`}>
                    {smsBody.length}/160 characters {smsBody.length > 160 && "(2 segments)"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Audience */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Select Audience</h2>
            <p className="text-sm text-gray-500 mb-6">Choose who receives this campaign.</p>

            <div className="space-y-3">
              {audienceFilters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setAudience(filter.key)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center gap-4 ${
                    audience === filter.key
                      ? "border-[#2D4A43] bg-[#2D4A43]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    audience === filter.key ? "border-[#2D4A43]" : "border-gray-300"
                  }`}>
                    {audience === filter.key && (
                      <div className="h-2.5 w-2.5 rounded-full bg-[#2D4A43]" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{filter.label}</p>
                    <p className="text-xs text-gray-500">{filter.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Review Campaign</h2>
            <p className="text-sm text-gray-500 mb-6">Confirm your campaign details before saving.</p>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Campaign Name</span>
                  <span className="text-sm font-medium text-gray-900">{name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Type</span>
                  <span className="text-sm font-medium text-gray-900">
                    {campaignType === "both" ? "Email + SMS" : campaignType?.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Audience</span>
                  <span className="text-sm font-medium text-gray-900">
                    {audienceFilters.find((f) => f.key === audience)?.label}
                  </span>
                </div>
                {subject && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Email Subject</span>
                    <span className="text-sm font-medium text-gray-900">{subject}</span>
                  </div>
                )}
              </div>

              {(campaignType === "email" || campaignType === "both") && emailBody && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Email Preview</p>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{emailBody}</p>
                  </div>
                </div>
              )}

              {(campaignType === "sms" || campaignType === "both") && smsBody && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">SMS Preview</p>
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                    <p className="text-sm text-gray-700">{smsBody}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-800">Campaign will be saved as a draft</p>
                    <p className="text-xs text-amber-700 mt-1">
                      You can review recipients, schedule, or send immediately from the campaign detail page.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => step > 1 ? setStep((step - 1) as Step) : router.push("/dashboard/marketing/campaigns")}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          {step === 1 ? "Cancel" : "Back"}
        </button>

        {step < 4 ? (
          <button
            onClick={() => setStep((step + 1) as Step)}
            disabled={!canProceed()}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2D4A43] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#3D5A53] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Continue
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2D4A43] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#3D5A53] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isCreating ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating...
              </>
            ) : (
              <>
                Create Campaign
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
