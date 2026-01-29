"use client";

import { useState } from "react";

interface DocumentItem {
  id: string;
  name: string;
  description: string;
  required: boolean;
  received: boolean;
  receivedDate?: string;
  category: string;
}

interface DocumentChecklistProps {
  clientId: string;
  clientName: string;
  clientEmail?: string | null;
  hasW2Income?: boolean;
  w2Count?: number;
  has1099Income?: boolean;
  hasSpouse?: boolean;
  hasDependents?: boolean;
  dependentCount?: number;
  hasMortgage?: boolean;
  hasStudentLoans?: boolean;
  hasCrypto?: boolean;
  hasStockSales?: boolean;
  hasRentalIncome?: boolean;
  hasForeignIncome?: boolean;
  hasCharitable?: boolean;
  hasChildcare?: boolean;
  hasEducation?: boolean;
  hasBusinessExpenses?: boolean;
  onDocumentToggle?: (docId: string, received: boolean) => void;
}

export default function DocumentChecklist({
  clientId,
  clientName,
  clientEmail,
  hasW2Income = false,
  w2Count = 1,
  has1099Income = false,
  hasSpouse = false,
  hasDependents = false,
  dependentCount = 0,
  hasMortgage = false,
  hasStudentLoans = false,
  hasCrypto = false,
  hasStockSales = false,
  hasRentalIncome = false,
  hasForeignIncome = false,
  hasCharitable = false,
  hasChildcare = false,
  hasEducation = false,
  hasBusinessExpenses = false,
  onDocumentToggle,
}: DocumentChecklistProps) {
  const [sendingReminder, setSendingReminder] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedForRequest, setSelectedForRequest] = useState<Set<string>>(new Set());
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestResult, setRequestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  // Generate document checklist based on client profile
  const generateChecklist = (): DocumentItem[] => {
    const items: DocumentItem[] = [];

    // Always required
    items.push({
      id: "id-primary",
      name: "Photo ID (Primary Taxpayer)",
      description: "Driver's license, state ID, or passport",
      required: true,
      received: false,
      category: "Identity",
    });

    if (hasSpouse) {
      items.push({
        id: "id-spouse",
        name: "Photo ID (Spouse)",
        description: "Driver's license, state ID, or passport",
        required: true,
        received: false,
        category: "Identity",
      });
    }

    items.push({
      id: "ssn-primary",
      name: "SSN Card or Document",
      description: "Social Security card or official document showing SSN",
      required: true,
      received: false,
      category: "Identity",
    });

    // Prior year return
    items.push({
      id: "prior-return",
      name: "Prior Year Tax Return",
      description: "Last year's federal and state tax return",
      required: false,
      received: false,
      category: "Prior Returns",
    });

    // W-2s
    if (hasW2Income) {
      for (let i = 1; i <= w2Count; i++) {
        items.push({
          id: `w2-${i}`,
          name: w2Count > 1 ? `W-2 Form (Employer ${i})` : "W-2 Form",
          description: "Wage and tax statement from employer",
          required: true,
          received: false,
          category: "Income",
        });
      }
    }

    // 1099s
    if (has1099Income) {
      items.push({
        id: "1099-nec",
        name: "1099-NEC Forms",
        description: "Non-employee compensation (freelance/contract work)",
        required: true,
        received: false,
        category: "Income",
      });
      items.push({
        id: "1099-misc",
        name: "1099-MISC Forms (if any)",
        description: "Miscellaneous income",
        required: false,
        received: false,
        category: "Income",
      });
    }

    // Interest and dividends
    items.push({
      id: "1099-int",
      name: "1099-INT Forms (if any)",
      description: "Interest income from banks and investments",
      required: false,
      received: false,
      category: "Income",
    });

    items.push({
      id: "1099-div",
      name: "1099-DIV Forms (if any)",
      description: "Dividend income from investments",
      required: false,
      received: false,
      category: "Income",
    });

    items.push({
      id: "bank-statements",
      name: "Bank Statements",
      description: "Recent statements from all bank accounts",
      required: false,
      received: false,
      category: "Income",
    });

    // Stock sales
    if (hasStockSales) {
      items.push({
        id: "1099-b",
        name: "1099-B Forms",
        description: "Proceeds from broker/barter exchange transactions",
        required: true,
        received: false,
        category: "Income",
      });
      items.push({
        id: "stock-basis",
        name: "Cost Basis Documentation",
        description: "Purchase records for stock/investment sales",
        required: false,
        received: false,
        category: "Income",
      });
    }

    // Crypto
    if (hasCrypto) {
      items.push({
        id: "crypto-records",
        name: "Cryptocurrency Transaction Records",
        description: "All buy/sell/exchange records from exchanges",
        required: true,
        received: false,
        category: "Income",
      });
    }

    // Rental income
    if (hasRentalIncome) {
      items.push({
        id: "rental-income",
        name: "Rental Income Records",
        description: "Rent received, tenant info",
        required: true,
        received: false,
        category: "Income",
      });
      items.push({
        id: "rental-expenses",
        name: "Rental Expense Records",
        description: "Repairs, maintenance, property management fees",
        required: true,
        received: false,
        category: "Deductions",
      });
    }

    // Foreign income
    if (hasForeignIncome) {
      items.push({
        id: "foreign-income",
        name: "Foreign Income Documentation",
        description: "Statements from foreign employers/banks",
        required: true,
        received: false,
        category: "Income",
      });
      items.push({
        id: "fbar-info",
        name: "Foreign Bank Account Info",
        description: "Maximum balances for FBAR reporting",
        required: true,
        received: false,
        category: "Income",
      });
    }

    // Mortgage interest
    if (hasMortgage) {
      items.push({
        id: "1098-mortgage",
        name: "1098 Mortgage Interest Statement",
        description: "Mortgage interest paid during the year",
        required: true,
        received: false,
        category: "Deductions",
      });
    }

    // Student loans
    if (hasStudentLoans) {
      items.push({
        id: "1098-e",
        name: "1098-E Student Loan Interest",
        description: "Student loan interest paid during the year",
        required: true,
        received: false,
        category: "Deductions",
      });
    }

    // Charitable donations
    if (hasCharitable) {
      items.push({
        id: "charitable-receipts",
        name: "Charitable Donation Receipts",
        description: "Receipts and acknowledgment letters from charities",
        required: true,
        received: false,
        category: "Deductions",
      });
    }

    // Childcare
    if (hasChildcare) {
      items.push({
        id: "childcare-receipts",
        name: "Childcare Expense Records",
        description: "Provider receipts with name, address, and tax ID",
        required: true,
        received: false,
        category: "Deductions",
      });
    }

    // Education
    if (hasEducation) {
      items.push({
        id: "1098-t",
        name: "1098-T Tuition Statement",
        description: "Tuition statement from educational institution",
        required: true,
        received: false,
        category: "Deductions",
      });
      items.push({
        id: "education-receipts",
        name: "Education Expense Receipts",
        description: "Books, supplies, and required materials",
        required: false,
        received: false,
        category: "Deductions",
      });
    }

    // Business expenses
    if (hasBusinessExpenses) {
      items.push({
        id: "business-receipts",
        name: "Business Expense Records",
        description: "Receipts for business-related expenses",
        required: true,
        received: false,
        category: "Business",
      });
      items.push({
        id: "mileage-log",
        name: "Vehicle Mileage Log",
        description: "Log of business miles driven",
        required: false,
        received: false,
        category: "Business",
      });
      items.push({
        id: "home-office",
        name: "Home Office Documentation",
        description: "Square footage, utility bills if claiming home office",
        required: false,
        received: false,
        category: "Business",
      });
    }

    // Dependents
    if (hasDependents && dependentCount > 0) {
      items.push({
        id: "dependent-ssn",
        name: `Dependent SSN/ITIN (${dependentCount} dependent${dependentCount > 1 ? "s" : ""})`,
        description: "Social Security numbers for all dependents",
        required: true,
        received: false,
        category: "Identity",
      });
    }

    return items;
  };

  const [documents, setDocuments] = useState<DocumentItem[]>(generateChecklist);

  const toggleDocument = (docId: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              received: !doc.received,
              receivedDate: !doc.received ? new Date().toISOString() : undefined,
            }
          : doc
      )
    );
    const doc = documents.find((d) => d.id === docId);
    if (doc && onDocumentToggle) {
      onDocumentToggle(docId, !doc.received);
    }
  };

  // Group by category
  const categories = Array.from(new Set(documents.map((d) => d.category)));
  const requiredCount = documents.filter((d) => d.required).length;
  const requiredReceivedCount = documents.filter((d) => d.required && d.received).length;
  const totalReceivedCount = documents.filter((d) => d.received).length;
  const progress = requiredCount > 0 ? (requiredReceivedCount / requiredCount) * 100 : 0;
  const missingRequired = documents.filter((d) => d.required && !d.received);

  const handleSendReminder = async () => {
    if (!clientEmail || missingRequired.length === 0) return;

    setSendingReminder(true);
    try {
      const response = await fetch("/api/documents/reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          clientName,
          clientEmail,
          missingDocuments: missingRequired.map(d => ({
            name: d.name,
            description: d.description,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send reminder");
      }

      alert("Reminder email sent successfully!");
    } catch (error) {
      console.error("Error sending reminder:", error);
      alert("Failed to send reminder email. Please try again.");
    } finally {
      setSendingReminder(false);
    }
  };

  const toggleSelectForRequest = (docId: string) => {
    setSelectedForRequest((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  const selectAllMissing = () => {
    const missingIds = documents.filter((d) => !d.received).map((d) => d.id);
    setSelectedForRequest(new Set(missingIds));
  };

  const clearSelection = () => {
    setSelectedForRequest(new Set());
  };

  const handleSendDocumentRequest = async () => {
    const totalItems = selectedForRequest.size + customItems.length;
    if (!clientEmail || totalItems === 0) return;

    setSendingRequest(true);
    setRequestResult(null);

    try {
      const selectedDocs = documents.filter((d) => selectedForRequest.has(d.id));
      const allDocs = [
        ...selectedDocs.map((d) => ({ name: d.name, description: d.description })),
        ...customItems.map((name) => ({ name, description: "" })),
      ];

      const response = await fetch(`/api/clients/${clientId}/send-document-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: allDocs }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setRequestResult({
          success: true,
          message: `Document request sent for ${allDocs.length} item${allDocs.length > 1 ? "s" : ""}!`,
        });
        // Close modal after success
        setTimeout(() => {
          setShowRequestModal(false);
          setSelectMode(false);
          setSelectedForRequest(new Set());
          setCustomItems([]);
          setCustomInput("");
          setRequestResult(null);
        }, 2000);
      } else {
        setRequestResult({
          success: false,
          message: data.error || "Failed to send document request",
        });
      }
    } catch (error) {
      console.error("Error sending document request:", error);
      setRequestResult({
        success: false,
        message: "Failed to send document request. Please try again.",
      });
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-[#F5F3EF]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-brand-heading text-lg font-semibold text-gray-900">
              Document Checklist
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {clientName}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Select Mode Toggle */}
            {clientEmail && (
              <div className="flex items-center gap-2">
                {selectMode ? (
                  <>
                    <button
                      onClick={selectAllMissing}
                      className="text-xs text-[#2D4A43] hover:underline"
                    >
                      Select All Missing
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => {
                        setSelectMode(false);
                        clearSelection();
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setSelectMode(true)}
                    className="flex items-center gap-1.5 text-xs font-medium text-[#2D4A43] hover:text-[#3D5A53] transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Request Documents
                  </button>
                )}
              </div>
            )}
            <div className="text-right">
              <p className="text-2xl font-semibold text-[#2D4A43]">
                {requiredReceivedCount}/{requiredCount}
              </p>
              <p className="text-xs text-gray-500">required received</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2D4A43] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-gray-500">
            <span>{totalReceivedCount} total received</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
        </div>
      </div>

      {/* Document List by Category */}
      <div className="divide-y divide-gray-100">
        {categories.map((category) => {
          const categoryDocs = documents.filter((d) => d.category === category);
          const categoryReceivedCount = categoryDocs.filter((d) => d.received).length;

          return (
            <div key={category} className="px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  {category}
                </h4>
                <span className="text-xs text-gray-500">
                  {categoryReceivedCount}/{categoryDocs.length}
                </span>
              </div>

              <div className="space-y-2">
                {categoryDocs.map((doc) => {
                  const isSelectedForRequest = selectedForRequest.has(doc.id);

                  return (
                    <div
                      key={doc.id}
                      className={`flex items-start gap-2 ${selectMode ? "pl-2" : ""}`}
                    >
                      {/* Select Mode Checkbox */}
                      {selectMode && !doc.received && (
                        <button
                          onClick={() => toggleSelectForRequest(doc.id)}
                          className={`mt-3 h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isSelectedForRequest
                              ? "bg-[#2D4A43] border-[#2D4A43]"
                              : "border-gray-300 hover:border-[#2D4A43]"
                          }`}
                        >
                          {isSelectedForRequest && (
                            <svg
                              className="h-3 w-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </button>
                      )}
                      {selectMode && doc.received && (
                        <div className="mt-3 h-5 w-5 flex-shrink-0" />
                      )}

                      {/* Document Item */}
                      <button
                        onClick={() => selectMode && !doc.received ? toggleSelectForRequest(doc.id) : toggleDocument(doc.id)}
                        className={`flex-1 text-left flex items-start gap-3 p-3 rounded-lg transition-all ${
                          doc.received
                            ? "bg-emerald-50 border border-emerald-200"
                            : isSelectedForRequest
                            ? "bg-[#2D4A43]/5 border-2 border-[#2D4A43]"
                            : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {/* Received Checkbox */}
                        <div
                          className={`mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            doc.received
                              ? "bg-emerald-500 border-emerald-500"
                              : "border-gray-300"
                          }`}
                        >
                          {doc.received && (
                            <svg
                              className="h-3 w-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium ${
                                doc.received ? "text-emerald-900" : "text-gray-900"
                              }`}
                            >
                              {doc.name}
                            </span>
                            {doc.required && !doc.received && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">
                                Required
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-xs mt-0.5 ${
                              doc.received ? "text-emerald-700" : "text-gray-500"
                            }`}
                          >
                            {doc.description}
                          </p>
                          {doc.received && doc.receivedDate && (
                            <p className="text-xs text-emerald-600 mt-1">
                              Received {new Date(doc.receivedDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          {selectMode ? (
            <>
              <p className="text-sm text-gray-500">
                {selectedForRequest.size + customItems.length} document{selectedForRequest.size + customItems.length !== 1 ? "s" : ""} selected
              </p>
              <button
                onClick={() => setShowRequestModal(true)}
                disabled={selectedForRequest.size + customItems.length === 0}
                className="rounded-lg bg-[#2D4A43] px-4 py-2 text-sm font-medium text-white hover:bg-[#3D5A53] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send Request
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500">
                Click items to mark as received
              </p>
              {clientEmail && missingRequired.length > 0 && (
                <button
                  onClick={handleSendReminder}
                  disabled={sendingReminder}
                  className="text-sm font-medium text-[#2D4A43] hover:text-[#3D5A53] disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {sendingReminder ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Send All Missing
                    </>
                  )}
                </button>
              )}
              {!clientEmail && (
                <span className="text-xs text-gray-400">No email address</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Document Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Send Document Request
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Send an email to <span className="font-medium text-gray-700">{clientEmail}</span> requesting the following documents:
            </p>

            {/* Selected Documents List */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-200 mb-4">
              {documents
                .filter((d) => selectedForRequest.has(d.id))
                .map((doc) => (
                  <div key={doc.id} className="px-4 py-3 flex items-start gap-3">
                    <span className="text-[#C9A962] mt-0.5">&#9744;</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">{doc.description}</p>
                    </div>
                  </div>
                ))}
            </div>

            {/* Custom Document Items */}
            {customItems.length > 0 && (
              <div className="bg-blue-50 rounded-lg border border-blue-200 divide-y divide-blue-200 mb-4">
                <div className="px-4 py-2">
                  <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Custom Items</p>
                </div>
                {customItems.map((name, idx) => (
                  <div key={idx} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-[#C9A962] mt-0.5">&#9744;</span>
                      <p className="text-sm font-medium text-gray-900">{name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomItems((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Custom Document */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add custom document
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customInput.trim()) {
                      e.preventDefault();
                      setCustomItems((prev) => [...prev, customInput.trim()]);
                      setCustomInput("");
                    }
                  }}
                  placeholder="e.g. Profit & Loss Statement"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A43] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customInput.trim()) {
                      setCustomItems((prev) => [...prev, customInput.trim()]);
                      setCustomInput("");
                    }
                  }}
                  disabled={!customInput.trim()}
                  className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Result Message */}
            {requestResult && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  requestResult.success
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {requestResult.message}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowRequestModal(false);
                  setRequestResult(null);
                }}
                disabled={sendingRequest}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendDocumentRequest}
                disabled={sendingRequest}
                className="rounded-lg bg-[#2D4A43] px-4 py-2 text-sm font-medium text-white hover:bg-[#3D5A53] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sendingRequest ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Request Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
