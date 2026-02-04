"use client";

import { useState } from "react";
import { deleteIntakeLink } from "@/lib/intake/actions";
import { DEMO_MODE } from "@/lib/mock-data";

interface IntakeLink {
  id: string;
  created_at: string;
  token: string;
  email: string | null;
  expires_at: string;
  used_at: string | null;
  prefill_first_name: string | null;
  prefill_last_name: string | null;
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
  } | null;
}

interface IntakeLinksListProps {
  links: IntakeLink[];
}

export default function IntakeLinksList({ links }: IntakeLinksListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [smsModal, setSmsModal] = useState<{ linkId: string; token: string; name: string } | null>(null);
  const [smsPhone, setSmsPhone] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [smsSentId, setSmsSentId] = useState<string | null>(null);

  const handleSendSMS = async () => {
    if (!smsModal || !smsPhone) return;
    setSmsSending(true);
    setSmsError(null);

    const intakeUrl = `${window.location.origin}/intake/${smsModal.token}`;

    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: null,
          clientPhone: smsPhone,
          clientName: smsModal.name || "Client",
          templateId: "intake_reminder",
          templateValues: { intakeUrl },
        }),
      });

      if (res.ok) {
        setSmsSentId(smsModal.linkId);
        setSmsModal(null);
        setSmsPhone("");
        setTimeout(() => setSmsSentId(null), 3000);
      } else {
        const data = await res.json();
        setSmsError(data.error || "Failed to send SMS");
      }
    } catch {
      setSmsError("Failed to send SMS");
    } finally {
      setSmsSending(false);
    }
  };

  const handleDelete = async (linkId: string) => {
    if (!confirm("Are you sure you want to delete this link?")) return;

    setDeletingId(linkId);

    if (DEMO_MODE) {
      // In demo mode, just show a message
      alert("Link deletion is disabled in demo mode");
      setDeletingId(null);
      return;
    }

    try {
      await deleteIntakeLink(linkId);
    } catch (error) {
      console.error("Error deleting link:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const copyLink = async (token: string, linkId: string) => {
    const url = `${window.location.origin}/intake/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(linkId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatus = (link: IntakeLink) => {
    if (link.used_at) {
      return { label: "Completed", color: "bg-green-100 text-green-800" };
    }
    if (new Date(link.expires_at) < new Date()) {
      return { label: "Expired", color: "bg-gray-100 text-gray-800" };
    }
    return { label: "Active", color: "bg-blue-100 text-blue-800" };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (links.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-500">No intake links yet</p>
        <p className="text-xs text-gray-400">
          Create your first link using the form on the left
        </p>
      </div>
    );
  }

  return (
    <>
    <div className="divide-y divide-gray-200">
      {links.map((link) => {
        const status = getStatus(link);
        return (
          <div key={link.id} className="px-6 py-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {link.prefill_first_name || link.prefill_last_name ? (
                    <span className="text-sm font-medium text-gray-900">
                      {link.prefill_first_name} {link.prefill_last_name}
                    </span>
                  ) : link.email ? (
                    <span className="text-sm font-medium text-gray-900">
                      {link.email}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500 italic">
                      No name/email
                    </span>
                  )}
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-medium ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="text-xs text-gray-500 space-y-0.5">
                  <p>Created: {formatDate(link.created_at)}</p>
                  <p>
                    Expires: {formatDate(link.expires_at)}
                    {new Date(link.expires_at) < new Date() && (
                      <span className="text-red-500 ml-1">(expired)</span>
                    )}
                  </p>
                  {link.used_at && (
                    <p className="text-green-600">
                      Completed: {formatDate(link.used_at)}
                      {link.client && (
                        <span>
                          {" "}
                          by{" "}
                          <a
                            href={`/dashboard/clients/${link.client.id}`}
                            className="underline hover:text-green-700"
                          >
                            {link.client.first_name} {link.client.last_name}
                          </a>
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                {!link.used_at && new Date(link.expires_at) > new Date() && (
                  <>
                    <button
                      type="button"
                      onClick={() => copyLink(link.token, link.id)}
                      className="px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      {copiedId === link.id ? "Copied!" : "Copy Link"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const name = [link.prefill_first_name, link.prefill_last_name].filter(Boolean).join(" ");
                        setSmsModal({ linkId: link.id, token: link.token, name });
                        setSmsError(null);
                      }}
                      className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100"
                    >
                      {smsSentId === link.id ? "SMS Sent!" : "Send SMS"}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(link.id)}
                  disabled={deletingId === link.id}
                  className="px-2.5 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  {deletingId === link.id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>

    {/* SMS Send Modal */}
    {smsModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Send Intake Link via SMS</h3>
              <button onClick={() => setSmsModal(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {smsModal.name && (
              <p className="text-sm text-gray-500 mt-1">To: {smsModal.name}</p>
            )}
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={smsPhone}
                onChange={(e) => setSmsPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Message preview:</p>
              <p className="text-sm text-gray-700">
                Hi {smsModal.name?.split(" ")[0] || "there"}! This is Brandon from Harvey & Co. Just a friendly reminder to complete your tax intake form when you get a chance: [link] - Questions? Text me back!
              </p>
            </div>
            {smsError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{smsError}</p>
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              onClick={() => setSmsModal(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSendSMS}
              disabled={smsSending || !smsPhone}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {smsSending ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </>
              ) : "Send SMS"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
