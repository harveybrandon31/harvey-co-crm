"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startProcessing } from "@/lib/actions/tax-returns";

interface StartProcessingButtonProps {
  clientId: string;
  clientName: string;
  compact?: boolean;
}

export default function StartProcessingButton({ clientId, clientName, compact }: StartProcessingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError(null);

    const result = await startProcessing(clientId);

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || "Failed to create tax return");
      setLoading(false);
    }
  }

  if (compact) {
    return (
      <div>
        <button
          onClick={handleClick}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#2D4A43] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2D4A43]/90 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <>
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-r-transparent" />
              Creating...
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Start Processing
            </>
          )}
        </button>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#2D4A43] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2D4A43]/90 disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
            Creating Tax Return...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Start Processing
          </>
        )}
      </button>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Creates a {new Date().getFullYear()} 1040 tax return for {clientName}
      </p>
      {error && <p className="text-xs text-red-600 mt-1 text-center">{error}</p>}
    </div>
  );
}
