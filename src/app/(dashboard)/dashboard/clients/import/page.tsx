"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { importClients, type ImportResult } from "./actions";
import { generateSampleCSV } from "@/lib/csv/parser";

export default function ImportClientsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);

    // Read file for preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split(/\r?\n/).filter((line) => line.trim());
      const previewData = lines.slice(0, 6).map((line) => {
        // Simple CSV parse for preview
        const result: string[] = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      });

      setPreview(previewData);
    };
    reader.readAsText(selectedFile);
  }

  async function handleImport() {
    if (!file) return;

    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const importResult = await importClients(content);
      setResult(importResult);
      setLoading(false);
    };
    reader.readAsText(file);
  }

  function handleDownloadTemplate() {
    const csv = generateSampleCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "client_import_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleReset() {
    setFile(null);
    setPreview([]);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/dashboard/clients"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; Back to Clients
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Import Clients</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Section */}
          {!result && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Upload CSV File
              </h2>

              <div className="space-y-4">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {file ? (
                    <div>
                      <svg
                        className="mx-auto h-12 w-12 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        />
                      </svg>
                      <p className="mt-2 text-sm font-medium text-gray-900">
                        {file.name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                        />
                      </svg>
                      <p className="mt-2 text-sm font-medium text-gray-900">
                        Click to upload or drag and drop
                      </p>
                      <p className="mt-1 text-xs text-gray-500">CSV files only</p>
                    </div>
                  )}
                </div>

                {/* Preview */}
                {preview.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Preview (first 5 rows)
                    </h3>
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            {preview[0]?.map((header, i) => (
                              <th
                                key={i}
                                className="px-3 py-2 text-left font-medium text-gray-500 uppercase"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {preview.slice(1).map((row, i) => (
                            <tr key={i}>
                              {row.map((cell, j) => (
                                <td
                                  key={j}
                                  className="px-3 py-2 text-gray-900 truncate max-w-[150px]"
                                >
                                  {cell || "-"}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleImport}
                    disabled={!file || loading}
                    className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Importing..." : "Import Clients"}
                  </button>
                  {file && (
                    <button
                      onClick={handleReset}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {result && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Import Results
                </h2>
                <button
                  onClick={handleReset}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Import More
                </button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {result.imported}
                  </p>
                  <p className="text-sm text-green-700">Imported</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {result.duplicates.length}
                  </p>
                  <p className="text-sm text-yellow-700">Duplicates</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {result.errors.length}
                  </p>
                  <p className="text-sm text-red-700">Errors</p>
                </div>
              </div>

              {/* Success Message */}
              {result.imported > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex">
                    <svg
                      className="h-5 w-5 text-green-600 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                    <p className="text-sm text-green-700">
                      Successfully imported {result.imported} client
                      {result.imported !== 1 ? "s" : ""}.{" "}
                      <Link
                        href="/dashboard/clients"
                        className="font-medium underline"
                      >
                        View clients
                      </Link>
                    </p>
                  </div>
                </div>
              )}

              {/* Duplicates */}
              {result.duplicates.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">
                    Skipped (already exist):
                  </h3>
                  <ul className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700 space-y-1">
                    {result.duplicates.map((dup, i) => (
                      <li key={i}>{dup}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Errors */}
              {result.errors.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-red-800 mb-2">
                    Errors:
                  </h3>
                  <ul className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 space-y-1 max-h-48 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <li key={i}>
                        Row {err.row}: {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions Sidebar */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Instructions
            </h2>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h3 className="font-medium text-gray-900">Required Columns</h3>
                <ul className="mt-1 list-disc list-inside">
                  <li>first_name</li>
                  <li>last_name</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900">Optional Columns</h3>
                <ul className="mt-1 list-disc list-inside">
                  <li>email</li>
                  <li>phone</li>
                  <li>address_street, address_city, address_state, address_zip</li>
                  <li>ssn_last_four (or full SSN - only last 4 stored)</li>
                  <li>filing_status (single, married_joint, etc.)</li>
                  <li>status (active, inactive, prospect)</li>
                  <li>notes</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900">Tips</h3>
                <ul className="mt-1 list-disc list-inside">
                  <li>Column names are flexible (e.g., &quot;First Name&quot; works)</li>
                  <li>Duplicates detected by email address</li>
                  <li>State will be converted to 2-letter code</li>
                </ul>
              </div>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="mt-4 w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center"
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              Download Template
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 text-sm">
              Supported Filing Statuses
            </h3>
            <ul className="mt-2 text-xs text-blue-700 space-y-1">
              <li>single</li>
              <li>married_joint (or MFJ)</li>
              <li>married_separate (or MFS)</li>
              <li>head_of_household (or HOH)</li>
              <li>qualifying_widow (or QW)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
