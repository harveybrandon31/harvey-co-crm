"use client";

import { useEffect, useState, useCallback } from "react";

interface RequestItem {
  id: string;
  name: string;
  description: string | null;
  status: "pending" | "uploaded";
  uploaded_at: string | null;
  file_name: string | null;
  file_size: number | null;
}

interface RequestData {
  id: string;
  status: string;
  expiresAt: string;
  clientFirstName: string;
  items: RequestItem[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentUploadPage({ token }: { token: string }) {
  const [data, setData] = useState<RequestData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingItem, setUploadingItem] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/document-requests/${token}`);
      if (!res.ok) {
        const body = await res.json();
        setError(body.error || "Failed to load upload page");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError("Failed to connect. Please check your internet and try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleUpload(itemId: string, file: File) {
    setUploadingItem(itemId);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("itemId", itemId);

      const res = await fetch(`/api/document-requests/${token}/upload`, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        setUploadError(result.error || "Upload failed");
        return;
      }

      // Refresh data to get updated statuses
      await fetchData();
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploadingItem(null);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-r-transparent" />
        <p className="mt-4 text-gray-600">Loading your upload page...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-white shadow rounded-lg p-8 max-w-md mx-auto">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Link Invalid or Expired
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            Please contact Harvey & Co Financial Services if you need a new
            upload link.
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const uploadedCount = data.items.filter((i) => i.status === "uploaded").length;
  const totalCount = data.items.length;
  const allComplete = uploadedCount === totalCount;
  const progressPercent = totalCount > 0 ? (uploadedCount / totalCount) * 100 : 0;

  return (
    <div>
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Hi {data.clientFirstName}, upload your documents
        </h1>
        <p className="mt-2 text-gray-600">
          Please upload the documents listed below. Accepted formats: PDF, JPG,
          PNG, HEIC (max 25 MB each).
        </p>
      </div>

      {/* All complete celebration */}
      {allComplete && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-3">
            <svg
              className="h-6 w-6 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-emerald-900">
            All documents received!
          </h2>
          <p className="mt-1 text-emerald-700">
            Thank you! Our team will review your documents and reach out if
            anything else is needed.
          </p>
        </div>
      )}

      {/* Progress bar */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Progress
          </span>
          <span className="text-sm text-gray-500">
            {uploadedCount} of {totalCount} uploaded
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Upload error */}
      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-700">{uploadError}</p>
        </div>
      )}

      {/* Item cards */}
      <div className="space-y-4">
        {data.items.map((item) => (
          <div
            key={item.id}
            className="bg-white shadow rounded-lg p-5 border border-gray-100"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {item.status === "uploaded" ? (
                    <svg
                      className="h-5 w-5 text-emerald-500 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5 text-gray-300 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                </div>
                {item.description && (
                  <p className="mt-1 text-sm text-gray-500 ml-7">
                    {item.description}
                  </p>
                )}
                {item.status === "uploaded" && item.file_name && (
                  <div className="mt-2 ml-7 flex items-center gap-2 text-sm text-emerald-700">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>
                    <span className="truncate">{item.file_name}</span>
                    {item.file_size && (
                      <span className="text-emerald-600">
                        ({formatFileSize(item.file_size)})
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Upload button or status */}
              <div className="ml-4 flex-shrink-0">
                {item.status === "uploaded" ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    Uploaded
                  </span>
                ) : uploadingItem === item.id ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-primary border-r-transparent" />
                    Uploading...
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90 transition-colors">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                      />
                    </svg>
                    Choose File
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.heic,.heif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleUpload(item.id, file);
                        }
                        // Reset so the same file can be re-selected
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Expiration notice */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">
          This upload link expires on{" "}
          {new Date(data.expiresAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}
