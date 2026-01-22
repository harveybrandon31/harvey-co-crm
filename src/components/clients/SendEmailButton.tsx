"use client";

import { useState } from "react";

interface SendEmailButtonProps {
  clientId: string;
  clientName: string;
  clientEmail: string | null;
}

const EMAIL_TEMPLATES = [
  {
    type: "intro",
    name: "Introduction Email",
    description: "Your story and background in financial services",
  },
  {
    type: "refund_amounts",
    name: "Refund Amounts",
    description: "Highlight potential refunds ($5k, $9k, $10k+)",
  },
  {
    type: "urgency",
    name: "Urgency/Deadline",
    description: "Create urgency around filing deadlines",
  },
];

export default function SendEmailButton({
  clientId,
  clientName,
  clientEmail,
}: SendEmailButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("intro");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleSend() {
    if (!clientEmail) return;

    setSending(true);
    setResult(null);

    try {
      const response = await fetch(`/api/clients/${clientId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignType: selectedTemplate }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({ success: true, message: `Email sent to ${clientEmail}` });
        // Close modal after 2 seconds on success
        setTimeout(() => {
          setShowModal(false);
          setResult(null);
        }, 2000);
      } else {
        // Show full error with debug info
        const debugInfo = data.debug ? ` | Key: ${data.debug.apiKeyPrefix} | From: ${data.debug.emailFrom}` : "";
        setResult({ success: false, message: `${data.error || "Failed to send email"}${debugInfo}` });
      }
    } catch (err) {
      setResult({ success: false, message: "Failed to send email" });
      console.error("Send email error:", err);
    }

    setSending(false);
  }

  if (!clientEmail) {
    return (
      <button
        type="button"
        disabled
        className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed"
        title="No email address on file"
      >
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          No Email
        </span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="rounded-lg bg-[#2D4A43] px-4 py-2 text-sm font-medium text-white hover:bg-[#3D5A53] transition-all"
      >
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Send Email
        </span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Send Email to {clientName}</h3>
            <p className="text-sm text-gray-500 mb-4">
              Sending to: <span className="font-medium text-gray-700">{clientEmail}</span>
            </p>

            {/* Template Selection */}
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium text-gray-700">Select Email Template</label>
              {EMAIL_TEMPLATES.map((template) => (
                <label
                  key={template.type}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedTemplate === template.type
                      ? "border-[#2D4A43] bg-[#2D4A43]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="template"
                    value={template.type}
                    checked={selectedTemplate === template.type}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="mt-0.5 text-[#2D4A43] focus:ring-[#2D4A43]"
                  />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{template.name}</p>
                    <p className="text-xs text-gray-500">{template.description}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Result Message */}
            {result && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  result.success
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {result.message}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setResult(null);
                }}
                disabled={sending}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className="rounded-lg bg-[#2D4A43] px-4 py-2 text-sm font-medium text-white hover:bg-[#3D5A53] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? "Sending..." : "Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
