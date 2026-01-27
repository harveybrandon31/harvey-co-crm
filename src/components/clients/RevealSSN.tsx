"use client";

import { useState } from "react";

interface RevealSSNProps {
  encryptedSSN: string | null;
  lastFour?: string | null;
  label?: string;
}

export default function RevealSSN({ encryptedSSN, lastFour, label = "SSN" }: RevealSSNProps) {
  const [revealed, setRevealed] = useState(false);
  const [ssn, setSSN] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReveal = async () => {
    if (revealed) {
      setRevealed(false);
      return;
    }

    if (ssn) {
      setRevealed(true);
      return;
    }

    if (!encryptedSSN) {
      setError("No SSN on file");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/decrypt-ssn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encryptedSSN }),
      });

      if (response.ok) {
        const data = await response.json();
        setSSN(data.ssn);
        setRevealed(true);
      } else {
        setError("Failed to decrypt");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const displayValue = () => {
    if (loading) return "Loading...";
    if (error) return error;
    if (revealed && ssn) return ssn;
    if (lastFour) return `***-**-${lastFour}`;
    if (encryptedSSN) return "***-**-****";
    return "-";
  };

  const hasSSN = encryptedSSN || lastFour;

  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 flex items-center gap-2">
        <span className="text-sm text-gray-900 font-mono">{displayValue()}</span>
        {hasSSN && (
          <button
            type="button"
            onClick={handleReveal}
            disabled={loading}
            className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            {loading ? "..." : revealed ? "Hide" : "Reveal"}
          </button>
        )}
      </dd>
    </div>
  );
}
