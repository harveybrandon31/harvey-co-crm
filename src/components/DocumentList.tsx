"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteDocument, getDocumentUrl } from "@/app/(dashboard)/dashboard/documents/actions";

interface DocumentWithRelations {
  id: string;
  created_at: string;
  name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  category: string | null;
  clients: {
    id: string;
    first_name: string;
    last_name: string;
  };
  tax_returns: {
    id: string;
    tax_year: number;
    return_type: string;
  } | null;
}

interface DocumentListProps {
  documents: DocumentWithRelations[];
}

const categoryLabels: Record<string, string> = {
  w2: "W-2",
  "1099": "1099",
  receipt: "Receipt",
  prior_return: "Prior Return",
  id: "ID Document",
  other: "Other",
};

const categoryColors: Record<string, string> = {
  w2: "bg-blue-100 text-blue-800",
  "1099": "bg-green-100 text-green-800",
  receipt: "bg-yellow-100 text-yellow-800",
  prior_return: "bg-purple-100 text-purple-800",
  id: "bg-red-100 text-red-800",
  other: "bg-gray-100 text-gray-800",
};

function formatFileSize(bytes: number | null) {
  if (bytes === null) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentList({ documents }: DocumentListProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    setDeleting(id);
    await deleteDocument(id);
    router.refresh();
    setDeleting(null);
  }

  async function handleDownload(filePath: string, fileName: string) {
    const url = await getDocumentUrl(filePath);
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  if (documents.length === 0) {
    return (
      <div className="p-12 text-center text-sm text-gray-500">
        No documents found. Upload your first document using the form.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Client
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Uploaded
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 text-gray-400 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                    {doc.name}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/dashboard/clients/${doc.clients.id}`}
                  className="text-sm text-gray-900 hover:text-blue-600"
                >
                  {doc.clients.last_name}, {doc.clients.first_name}
                </Link>
                {doc.tax_returns && (
                  <div className="text-xs text-gray-500">
                    {doc.tax_returns.tax_year} {doc.tax_returns.return_type}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {doc.category ? (
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      categoryColors[doc.category] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {categoryLabels[doc.category] || doc.category}
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatFileSize(doc.file_size)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(doc.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                <button
                  onClick={() => handleDownload(doc.file_path, doc.name)}
                  className="text-blue-600 hover:text-blue-900 mr-4"
                >
                  Download
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deleting === doc.id}
                  className="text-red-600 hover:text-red-900 disabled:opacity-50"
                >
                  {deleting === doc.id ? "..." : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
