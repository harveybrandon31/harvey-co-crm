"use client";

import { useState } from "react";
import { SMS_TEMPLATES, SMSTemplateType, fillTemplate } from "@/lib/sms/templates";

interface SendSMSButtonProps {
  clientId: string;
  clientName: string;
  clientPhone: string | null;
}

export default function SendSMSButton({
  clientId,
  clientName,
  clientPhone,
}: SendSMSButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplateType | "">("");
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstName = clientName.split(" ")[0];

  // Get preview of the message
  const getPreview = () => {
    if (selectedTemplate === "custom") {
      return customMessage;
    }
    if (selectedTemplate) {
      const template = SMS_TEMPLATES.find((t) => t.id === selectedTemplate);
      if (template) {
        return fillTemplate(template.template, {
          firstName,
          intakeUrl: "[intake link]",
          date: "[date]",
          time: "[time]",
          refundAmount: "[amount]",
        });
      }
    }
    return "";
  };

  const handleSend = async () => {
    if (!clientPhone) {
      setError("No phone number available for this client");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          clientPhone,
          clientName,
          templateId: selectedTemplate !== "custom" ? selectedTemplate : undefined,
          customMessage: selectedTemplate === "custom" ? customMessage : undefined,
          templateValues: {
            intakeUrl: `${window.location.origin}/intake/new`,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send SMS");
      }

      // Success - close modal
      setIsOpen(false);
      setSelectedTemplate("");
      setCustomMessage("");
      alert("SMS sent successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send SMS");
    } finally {
      setIsSending(false);
    }
  };

  if (!clientPhone) {
    return (
      <button
        disabled
        className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed"
        title="No phone number"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          SMS
        </span>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-all"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          SMS
        </span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Send SMS to {clientName}
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                To: {clientPhone}
              </p>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-4">
              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value as SMSTemplateType | "")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A43]"
                >
                  <option value="">Select a template...</option>
                  {SMS_TEMPLATES.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                {selectedTemplate && selectedTemplate !== "custom" && (
                  <p className="text-xs text-gray-500 mt-1">
                    {SMS_TEMPLATES.find((t) => t.id === selectedTemplate)?.description}
                  </p>
                )}
              </div>

              {/* Custom Message (if custom template selected) */}
              {selectedTemplate === "custom" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Message
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={4}
                    maxLength={160}
                    placeholder="Type your message here..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A43]"
                  />
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {customMessage.length}/160 characters
                  </p>
                </div>
              )}

              {/* Preview */}
              {(selectedTemplate || customMessage) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview
                  </label>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div className="flex-1 bg-white rounded-lg rounded-tl-none p-3 shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {getPreview()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isSending || (!selectedTemplate && !customMessage)}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send SMS
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
