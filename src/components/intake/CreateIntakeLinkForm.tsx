"use client";

import { useState } from "react";
import { createIntakeLink } from "@/lib/intake/actions";
import { DEMO_MODE } from "@/lib/mock-data";

export default function CreateIntakeLinkForm() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [sendViaSMS, setSendViaSMS] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [smsSent, setSmsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setGeneratedUrl(null);
    setSmsSent(false);

    if (sendViaSMS && !phone) {
      setError("Phone number is required to send via SMS");
      setIsLoading(false);
      return;
    }

    if (DEMO_MODE) {
      const demoToken = Math.random().toString(36).substring(2, 18);
      const url = `${window.location.origin}/intake/${demoToken}`;
      setGeneratedUrl(url);
      if (sendViaSMS) setSmsSent(true);
      setIsLoading(false);
      return;
    }

    try {
      const result = await createIntakeLink({
        email: email || undefined,
        prefillFirstName: firstName || undefined,
        prefillLastName: lastName || undefined,
        expiresInDays,
      });

      if (result.success && result.url) {
        setGeneratedUrl(result.url);

        // Send via SMS if requested
        if (sendViaSMS && phone) {
          try {
            const smsRes = await fetch("/api/sms/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                clientId: null,
                clientPhone: phone,
                clientName: firstName ? `${firstName} ${lastName || ""}`.trim() : "Client",
                templateId: "intake_reminder",
                templateValues: { intakeUrl: result.url },
              }),
            });
            if (smsRes.ok) {
              setSmsSent(true);
            } else {
              const data = await smsRes.json();
              setError(`Link created but SMS failed: ${data.error}`);
            }
          } catch {
            setError("Link created but SMS sending failed");
          }
        }

        // Reset form
        setEmail("");
        setPhone("");
        setFirstName("");
        setLastName("");
        setSendViaSMS(false);
      } else {
        setError(result.error || "Failed to create link");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (generatedUrl) {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Client Email (optional)
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="client@example.com"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Pre-fills the email field on the intake form
        </p>
      </div>

      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-700"
        >
          Client Phone (optional)
        </label>
        <input
          type="tel"
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 123-4567"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-700"
          >
            First Name (optional)
          </label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700"
          >
            Last Name (optional)
          </label>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Smith"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="expiresInDays"
          className="block text-sm font-medium text-gray-700"
        >
          Link Expiration
        </label>
        <select
          id="expiresInDays"
          value={expiresInDays}
          onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
          <option value={30}>30 days</option>
          <option value={60}>60 days</option>
          <option value={90}>90 days</option>
        </select>
      </div>

      {/* Send via SMS toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={sendViaSMS}
          onChange={(e) => setSendViaSMS(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        />
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Send link via SMS</span>
        </div>
      </label>
      {sendViaSMS && !phone && (
        <p className="text-xs text-amber-600">Enter a phone number above to send via SMS</p>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {generatedUrl && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3">
          <p className="text-sm font-medium text-green-800 mb-2">
            Link generated successfully!
            {smsSent && " SMS sent."}
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={generatedUrl}
              className="flex-1 text-xs bg-white border border-green-300 rounded px-2 py-1.5"
            />
            <button
              type="button"
              onClick={copyToClipboard}
              className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? "Generating..." : sendViaSMS ? "Generate & Send SMS" : "Generate Link"}
      </button>
    </form>
  );
}
