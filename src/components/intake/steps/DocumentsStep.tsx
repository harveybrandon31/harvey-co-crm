"use client";

import { IntakeFormData } from "../IntakeForm";

interface DocumentsStepProps {
  formData: IntakeFormData;
  updateFormData: (updates: Partial<IntakeFormData>) => void;
  token: string;
}

const DOCUMENT_CATEGORIES = [
  { id: "w2", label: "W-2 Forms", description: "Wage and tax statements from employers" },
  { id: "1099", label: "1099 Forms", description: "Income from other sources" },
  { id: "1098", label: "1098 Forms", description: "Mortgage interest, tuition statements" },
  { id: "prior_return", label: "Prior Year Return", description: "Last year's tax return" },
  { id: "id", label: "Photo ID", description: "Driver's license or state ID" },
  { id: "other", label: "Other Documents", description: "Any other relevant documents" },
];

export default function DocumentsStep({
  formData,
  updateFormData,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  token,
}: DocumentsStepProps) {

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    category: string
  ) => {
    const files = e.target.files;
    if (!files) return;

    const newDocs = Array.from(files).map((file) => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      category,
      file,
      uploaded: false,
    }));

    updateFormData({
      uploadedDocuments: [...formData.uploadedDocuments, ...newDocs],
    });

    // Reset the input
    e.target.value = "";
  };

  const removeDocument = (docId: string) => {
    updateFormData({
      uploadedDocuments: formData.uploadedDocuments.filter((d) => d.id !== docId),
    });
  };

  const getDocsByCategory = (category: string) => {
    return formData.uploadedDocuments.filter((d) => d.category === category);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-600 leading-relaxed">
          Upload your tax documents. You can add documents now or skip this step
          and upload them later. Accepted formats: PDF, JPG, PNG (max 10MB each).
        </p>
      </div>

      <div className="bg-[#2D4A43]/5 border border-[#2D4A43]/10 rounded-xl p-5">
        <h4 className="text-sm font-medium text-[#2D4A43] mb-3">
          Documents to gather:
        </h4>
        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1.5">
          <li>W-2s from all employers</li>
          <li>1099s (interest, dividends, contractor income)</li>
          <li>1098s (mortgage interest, student loan interest, tuition)</li>
          <li>Last year&apos;s tax return (helpful for comparison)</li>
          <li>Photo ID (driver&apos;s license or state ID)</li>
        </ul>
      </div>

      <div className="space-y-4">
        {DOCUMENT_CATEGORIES.map((category) => {
          const docs = getDocsByCategory(category.id);
          return (
            <div
              key={category.id}
              className="border-2 border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {category.label}
                  </h4>
                  <p className="text-xs text-gray-500">{category.description}</p>
                </div>
                <label className="cursor-pointer inline-flex items-center px-3 py-1.5 border-2 border-[#2D4A43]/20 text-xs font-medium rounded-lg text-[#2D4A43] bg-white hover:bg-[#2D4A43]/5 transition-all">
                  <svg
                    className="h-4 w-4 mr-1.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    onChange={(e) => handleFileSelect(e, category.id)}
                  />
                </label>
              </div>

              {docs.length > 0 ? (
                <ul className="space-y-2">
                  {docs.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between bg-gray-50 px-3 py-2.5 rounded-lg"
                    >
                      <div className="flex items-center min-w-0">
                        <svg
                          className="h-5 w-5 text-[#2D4A43]/60 mr-2.5 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="text-sm text-gray-700 truncate">
                          {doc.name}
                        </span>
                        {doc.file && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({formatFileSize(doc.file.size)})
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(doc.id)}
                        className="ml-2 text-red-600 hover:text-red-700 p-1"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  No documents uploaded
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
        <svg
          className="mx-auto h-10 w-10 text-[#2D4A43]/40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="mt-3 text-sm text-gray-500">
          Drag and drop files here, or click the Add buttons above
        </p>
        <p className="text-xs text-gray-400 mt-1">
          PDF, JPG, PNG up to 10MB each
        </p>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Don&apos;t have all your documents yet? No problem! You can upload them
        later or bring them to your appointment.
      </p>
    </div>
  );
}
