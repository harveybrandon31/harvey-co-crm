"use client";

import { useState } from "react";
import { createIntakeLink } from "@/lib/intake/actions";
import { DEMO_MODE } from "@/lib/mock-data";

export default function CreateIntakeLinkForm() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setGeneratedUrl(null);

    if (DEMO_MODE) {
      // Generate a demo link
      const demoToken = Math.random().toString(36).substring(2, 18);
      setGeneratedUrl(`${window.location.origin}/intake/${demoToken}`);
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
        // Reset form
        setEmail("");
        setFirstName("");
        setLastName("");
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

      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {generatedUrl && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3">
          <p className="text-sm font-medium text-green-800 mb-2">
            Link generated successfully!
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
        {isLoading ? "Generating..." : "Generate Link"}
      </button>
    </form>
  );
}
