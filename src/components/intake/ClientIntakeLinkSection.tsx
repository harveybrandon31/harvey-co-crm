"use client";

import { useState } from "react";
import { createIntakeLink } from "@/lib/intake/actions";
import { DEMO_MODE } from "@/lib/mock-data";
import type { IntakeLink } from "@/lib/types";

interface ClientIntakeLinkSectionProps {
  clientId: string;
  clientName: string;
  clientEmail: string | null;
  intakeLinks: IntakeLink[];
}

export default function ClientIntakeLinkSection({
  clientId,
  clientName,
  clientEmail,
  intakeLinks,
}: ClientIntakeLinkSectionProps) {
  const [links, setLinks] = useState(intakeLinks);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newLinkUrl, setNewLinkUrl] = useState<string | null>(null);

  const getStatus = (link: IntakeLink) => {
    if (link.used_at) {
      return { label: "Completed", color: "bg-green-100 text-green-800" };
    }
    if (new Date(link.expires_at) < new Date()) {
      return { label: "Expired", color: "bg-red-100 text-red-800" };
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

  const generateNewLink = async () => {
    setIsGenerating(true);
    setNewLinkUrl(null);

    if (DEMO_MODE) {
      const demoToken = Math.random().toString(36).substring(2, 18);
      const newLink: IntakeLink = {
        id: `link-${Date.now()}`,
        created_at: new Date().toISOString(),
        client_id: clientId,
        token: demoToken,
        email: clientEmail,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        used_at: null,
        created_by: null,
        prefill_first_name: clientName.split(" ")[0],
        prefill_last_name: clientName.split(" ").slice(1).join(" "),
      };
      setLinks([newLink, ...links]);
      setNewLinkUrl(`${window.location.origin}/intake/${demoToken}`);
      setIsGenerating(false);
      return;
    }

    try {
      const result = await createIntakeLink({
        email: clientEmail || undefined,
        prefillFirstName: clientName.split(" ")[0],
        prefillLastName: clientName.split(" ").slice(1).join(" "),
        expiresInDays: 30,
      });

      if (result.success && result.url) {
        setNewLinkUrl(result.url);
        // Refresh will show the new link
        window.location.reload();
      }
    } catch (error) {
      console.error("Error generating link:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyLink = async (token: string, linkId: string) => {
    const url = `${window.location.origin}/intake/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(linkId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const hasActiveLink = links.some(
    (link) => !link.used_at && new Date(link.expires_at) > new Date()
  );

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Intake Links</h2>
        {!hasActiveLink && (
          <button
            type="button"
            onClick={generateNewLink}
            disabled={isGenerating}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            {isGenerating ? "Generating..." : "+ Generate Link"}
          </button>
        )}
      </div>

      {newLinkUrl && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm font-medium text-green-800 mb-2">
            New link generated!
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={newLinkUrl}
              className="flex-1 text-xs bg-white border border-green-300 rounded px-2 py-1.5"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(newLinkUrl);
                setCopiedId("new");
              }}
              className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200"
            >
              {copiedId === "new" ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {links.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {links.map((link) => {
            const status = getStatus(link);
            const isActive = !link.used_at && new Date(link.expires_at) > new Date();

            return (
              <li key={link.id} className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-medium ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {formatDate(link.created_at)}
                    </p>
                    {link.used_at ? (
                      <p className="text-xs text-green-600">
                        Completed: {formatDate(link.used_at)}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">
                        Expires: {formatDate(link.expires_at)}
                      </p>
                    )}
                  </div>
                  {isActive && (
                    <button
                      type="button"
                      onClick={() => copyLink(link.token, link.id)}
                      className="px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      {copiedId === link.id ? "Copied!" : "Copy Link"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mb-3">No intake links yet.</p>
          <button
            type="button"
            onClick={generateNewLink}
            disabled={isGenerating}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isGenerating ? "Generating..." : "Generate Intake Link"}
          </button>
        </div>
      )}

      {hasActiveLink && (
        <p className="text-xs text-gray-500 mt-3">
          An active link already exists. Wait for it to expire or be used before generating a new one.
        </p>
      )}
    </div>
  );
}
