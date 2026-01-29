"use client";

import { useRef, useState } from "react";
import { uploadFile } from "@uploadcare/upload-client";
import { IntakeFormData } from "../IntakeForm";

interface DocumentsStepProps {
  formData: IntakeFormData;
  updateFormData: (updates: Partial<IntakeFormData>) => void;
  token: string;
}

const UPLOADCARE_PUBLIC_KEY = "67c482e9a427ffb15d57";

const DOCUMENT_CATEGORIES = [
  { id: "w2", label: "W-2 Forms", description: "Wage and tax statements from employers" },
  { id: "1099", label: "1099 Forms", description: "Income from other sources" },
  { id: "1098", label: "1098 Forms", description: "Mortgage interest, tuition statements" },
  { id: "prior_return", label: "Prior Year Return", description: "Last year's tax return" },
  { id: "other", label: "Other Documents", description: "Any other relevant documents" },
];

interface UploadedFileInfo {
  uuid: string;
  name: string;
  size: number;
  cdnUrl: string;
  mimeType: string;
}

export default function DocumentsStep({
  formData,
  updateFormData,
}: DocumentsStepProps) {

  const handleUploadComplete = (fileInfo: UploadedFileInfo, category: string) => {
    const newDoc = {
      id: fileInfo.uuid,
      name: fileInfo.name || "Uploaded file",
      category,
      uploaded: true,
      filePath: fileInfo.cdnUrl,
      fileType: fileInfo.mimeType,
      fileSize: fileInfo.size,
    };

    updateFormData({
      uploadedDocuments: [...formData.uploadedDocuments, newDoc],
    });
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

  const driversLicenseDocs = getDocsByCategory("drivers_license");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-600 leading-relaxed">
          Upload your tax documents. You can add documents now or skip this step
          and upload them later. Accepted formats: PDF, JPG, PNG (max 10MB each).
        </p>
      </div>

      {/* Driver's License Upload - Prominent Optional Section */}
      <div className="bg-gradient-to-r from-[#2D4A43] to-[#3D5A53] rounded-xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-lg">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">Driver&apos;s License</h3>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Optional</span>
            </div>
            <p className="text-sm text-white/80 mb-4">
              Upload a photo of your driver&apos;s license to help us verify your identity quickly.
              This speeds up the tax preparation process.
            </p>

            {driversLicenseDocs.length > 0 ? (
              <div className="space-y-2">
                {driversLicenseDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between bg-white/10 px-3 py-2 rounded-lg"
                  >
                    <div className="flex items-center min-w-0">
                      <svg className="h-5 w-5 text-white/60 mr-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm truncate">{doc.name}</span>
                      {doc.fileSize && (
                        <span className="ml-2 text-xs text-white/60">
                          ({formatFileSize(doc.fileSize)})
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument(doc.id)}
                      className="ml-2 text-white/60 hover:text-white p-1"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <UploadButton
                category="drivers_license"
                onUpload={handleUploadComplete}
                variant="white"
              />
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#F5F3EF] border border-[#2D4A43]/10 rounded-xl p-5">
        <h4 className="text-sm font-medium text-[#2D4A43] mb-3">
          Other documents to gather:
        </h4>
        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1.5">
          <li>W-2s from all employers</li>
          <li>1099s (interest, dividends, contractor income)</li>
          <li>1098s (mortgage interest, student loan interest, tuition)</li>
          <li>Last year&apos;s tax return (helpful for comparison)</li>
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
                <UploadButton
                  category={category.id}
                  onUpload={handleUploadComplete}
                  variant="outline"
                  multiple
                />
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
                        {doc.fileSize && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({formatFileSize(doc.fileSize)})
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
          Click the Add buttons above to upload your documents
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

// Upload button using @uploadcare/upload-client (native JS, no jQuery)
interface UploadButtonProps {
  category: string;
  onUpload: (fileInfo: UploadedFileInfo, category: string) => void;
  variant: "white" | "outline";
  multiple?: boolean;
}

function UploadButton({ category, onUpload, variant, multiple = false }: UploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
          continue;
        }

        // Validate file type
        const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/heic"];
        if (!allowedTypes.includes(file.type)) {
          alert(`File "${file.name}" is not a supported format. Please use PDF, JPG, or PNG.`);
          continue;
        }

        const result = await uploadFile(file, {
          publicKey: UPLOADCARE_PUBLIC_KEY,
          store: "auto",
        });

        onUpload(
          {
            uuid: result.uuid,
            name: result.originalFilename || file.name,
            size: result.size,
            cdnUrl: result.cdnUrl,
            mimeType: result.mimeType || file.type,
          },
          category
        );
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const baseClasses = "cursor-pointer inline-flex items-center text-sm font-medium rounded-lg transition-all";
  const variantClasses = variant === "white"
    ? "px-4 py-2 bg-white text-[#2D4A43] hover:bg-white/90"
    : "px-3 py-1.5 border-2 border-[#2D4A43]/20 text-xs text-[#2D4A43] bg-white hover:bg-[#2D4A43]/5";

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".pdf,.jpg,.jpeg,.png,.heic"
        multiple={multiple}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className={`${baseClasses} ${variantClasses} ${uploading ? "opacity-50 cursor-wait" : ""}`}
      >
        {uploading ? (
          <>
            <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Uploading...
          </>
        ) : variant === "white" ? (
          <>
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Upload Photo
          </>
        ) : (
          <>
            <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </>
        )}
      </button>
    </>
  );
}
