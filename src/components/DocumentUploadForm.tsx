"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadDocument } from "@/app/(dashboard)/dashboard/documents/actions";
import type { Client } from "@/lib/types";

interface DocumentUploadFormProps {
  clients: Client[];
  taxReturns: { id: string; tax_year: number; return_type: string }[];
  defaultClientId?: string;
  defaultReturnId?: string;
}

export default function DocumentUploadForm({
  clients,
  taxReturns,
  defaultClientId,
  defaultReturnId,
}: DocumentUploadFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await uploadDocument(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setFileName(null);
      formRef.current?.reset();
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setFileName(file?.name || null);
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Document</h2>

      <form ref={formRef} action={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
            Document uploaded successfully!
          </div>
        )}

        <div>
          <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
            Client *
          </label>
          <select
            id="client_id"
            name="client_id"
            required
            defaultValue={defaultClientId || ""}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select a client...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.last_name}, {client.first_name}
              </option>
            ))}
          </select>
        </div>

        {taxReturns.length > 0 && (
          <div>
            <label htmlFor="tax_return_id" className="block text-sm font-medium text-gray-700">
              Tax Return (Optional)
            </label>
            <select
              id="tax_return_id"
              name="tax_return_id"
              defaultValue={defaultReturnId || ""}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">None</option>
              {taxReturns.map((tr) => (
                <option key={tr.id} value={tr.id}>
                  {tr.tax_year} - {tr.return_type}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="category"
            name="category"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Uncategorized</option>
            <option value="w2">W-2</option>
            <option value="1099">1099</option>
            <option value="receipt">Receipt</option>
            <option value="prior_return">Prior Return</option>
            <option value="id">ID Document</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700">
            File *
          </label>
          <div className="mt-1">
            <label className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-gray-400">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="text-sm text-gray-600">
                  {fileName ? (
                    <span className="font-medium text-blue-600">{fileName}</span>
                  ) : (
                    <>
                      <span className="font-medium text-blue-600">Click to upload</span>
                      <span> or drag and drop</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
              </div>
              <input
                id="file"
                name="file"
                type="file"
                required
                onChange={handleFileChange}
                className="sr-only"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload Document"}
        </button>
      </form>
    </div>
  );
}
