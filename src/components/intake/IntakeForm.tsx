"use client";

import { useState } from "react";
import PersonalInfoStep from "./steps/PersonalInfoStep";
import AddressStep from "./steps/AddressStep";
import FilingStatusStep from "./steps/FilingStatusStep";
import DependentsStep from "./steps/DependentsStep";
import IncomeStep from "./steps/IncomeStep";
import DeductionsStep from "./steps/DeductionsStep";
import DocumentsStep from "./steps/DocumentsStep";
import ReviewStep from "./steps/ReviewStep";

export interface IntakeFormData {
  // Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  ssn: string;

  // Address
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;

  // Filing Status
  filingStatus: string;
  hasSpouse: boolean;
  spouseFirstName: string;
  spouseLastName: string;
  spouseDob: string;
  spouseSsn: string;

  // Dependents
  dependents: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    ssn: string;
    relationship: string;
    monthsLivedWith: number;
  }[];

  // Income
  hasW2Income: boolean;
  w2EmployerCount: number;
  has1099Income: boolean;
  incomeTypes: string[];
  hasCryptoTransactions: boolean;
  hasStockSales: boolean;
  hasRentalIncome: boolean;
  hasForeignIncome: boolean;

  // Deductions
  itemizeDeductions: boolean;
  hasMortgageInterest: boolean;
  hasCharitableDonations: boolean;
  hasStudentLoanInterest: boolean;
  hasMedicalExpenses: boolean;
  hasBusinessExpenses: boolean;
  hasChildcare: boolean;
  hasEducationExpenses: boolean;
  otherDeductions: string;

  // Documents
  uploadedDocuments: {
    id: string;
    name: string;
    category: string;
    file?: File;
    uploaded: boolean;
    filePath?: string;
    fileType?: string;
    fileSize?: number;
  }[];

  // Notes
  additionalNotes: string;
}

const STEPS = [
  { id: 1, name: "Personal Info", shortName: "Personal" },
  { id: 2, name: "Address", shortName: "Address" },
  { id: 3, name: "Filing Status", shortName: "Filing" },
  { id: 4, name: "Dependents", shortName: "Dependents" },
  { id: 5, name: "Income", shortName: "Income" },
  { id: 6, name: "Deductions", shortName: "Deductions" },
  { id: 7, name: "Documents", shortName: "Documents" },
  { id: 8, name: "Review & Submit", shortName: "Review" },
];

interface IntakeFormProps {
  token: string;
  linkId: string;
  clientId: string | null | undefined;
  prefillData?: {
    email?: string;
    firstName?: string;
    lastName?: string;
  };
}

export default function IntakeForm({
  token,
  linkId,
  clientId,
  prefillData,
}: IntakeFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<IntakeFormData>({
    // Personal Info
    firstName: prefillData?.firstName || "",
    lastName: prefillData?.lastName || "",
    email: prefillData?.email || "",
    phone: "",
    dateOfBirth: "",
    ssn: "",

    // Address
    addressStreet: "",
    addressCity: "",
    addressState: "",
    addressZip: "",

    // Filing Status
    filingStatus: "",
    hasSpouse: false,
    spouseFirstName: "",
    spouseLastName: "",
    spouseDob: "",
    spouseSsn: "",

    // Dependents
    dependents: [],

    // Income
    hasW2Income: false,
    w2EmployerCount: 0,
    has1099Income: false,
    incomeTypes: [],
    hasCryptoTransactions: false,
    hasStockSales: false,
    hasRentalIncome: false,
    hasForeignIncome: false,

    // Deductions
    itemizeDeductions: false,
    hasMortgageInterest: false,
    hasCharitableDonations: false,
    hasStudentLoanInterest: false,
    hasMedicalExpenses: false,
    hasBusinessExpenses: false,
    hasChildcare: false,
    hasEducationExpenses: false,
    otherDeductions: "",

    // Documents
    uploadedDocuments: [],

    // Notes
    additionalNotes: "",
  });

  const updateFormData = (updates: Partial<IntakeFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= STEPS.length) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // In demo mode with demo token, just show success
      const isDemoMode = token === "demo" || linkId === "demo-link-id" ||
        token.startsWith("demo-token-") || linkId.startsWith("demo-");

      console.log("[IntakeForm] Submit started - token:", token, "linkId:", linkId, "isDemoMode:", isDemoMode);

      if (isDemoMode) {
        // Simulate a brief delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setSubmitted(true);
        return;
      }

      // Documents are already uploaded when selected, just map the data
      const uploadedDocs = formData.uploadedDocuments.map(doc => ({
        id: doc.id,
        name: doc.name,
        category: doc.category,
        filePath: doc.filePath,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
      }));

      console.log("[IntakeForm] Document stats:", {
        total: uploadedDocs.length,
        withPaths: uploadedDocs.filter(d => d.filePath).length,
      });

      // Submit the form data
      const submissionData = {
        ...formData,
        uploadedDocuments: uploadedDocs,
      };

      console.log("[IntakeForm] Submitting form data:", {
        dependents: formData.dependents.length,
        hasSpouse: formData.hasSpouse,
        spouseFirstName: formData.spouseFirstName,
        spouseLastName: formData.spouseLastName,
        spouseDob: formData.spouseDob,
        documents: uploadedDocs.length,
      });

      const response = await fetch("/api/intake/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          linkId,
          clientId,
          formData: submissionData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit intake form");
      }

      const result = await response.json();
      console.log("[IntakeForm] Submit success:", result);

      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("There was an error submitting your form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success/Confirmation Screen
  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="bg-white shadow-lg rounded-2xl p-10 max-w-lg mx-auto">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-[#2D4A43]/10 mb-6">
            <svg
              className="h-10 w-10 text-[#2D4A43]"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>

          <h2 className="font-brand-heading text-2xl font-semibold text-[#1A1A1A] mb-3">
            <span className="italic">Thank You!</span>
          </h2>

          <p className="text-gray-600 mb-6 leading-relaxed">
            Your tax intake form has been submitted successfully. We&apos;ve received all your information.
          </p>

          <div className="bg-[#F5F3EF] rounded-xl p-6 mb-6">
            <h3 className="font-medium text-[#2D4A43] mb-3">What happens next?</h3>
            <ul className="text-sm text-gray-600 space-y-2 text-left">
              <li className="flex items-start gap-2">
                <span className="text-[#2D4A43] mt-0.5">1.</span>
                Our team will review your information
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2D4A43] mt-0.5">2.</span>
                We&apos;ll reach out within 1-2 business days
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2D4A43] mt-0.5">3.</span>
                We may request additional documents if needed
              </li>
            </ul>
          </div>

          <p className="text-sm text-gray-500">
            Questions? Contact us at{" "}
            <a href="mailto:team@harveynco.com" className="text-[#2D4A43] hover:underline">
              team@harveynco.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalInfoStep formData={formData} updateFormData={updateFormData} />
        );
      case 2:
        return (
          <AddressStep formData={formData} updateFormData={updateFormData} />
        );
      case 3:
        return (
          <FilingStatusStep formData={formData} updateFormData={updateFormData} />
        );
      case 4:
        return (
          <DependentsStep formData={formData} updateFormData={updateFormData} />
        );
      case 5:
        return (
          <IncomeStep formData={formData} updateFormData={updateFormData} />
        );
      case 6:
        return (
          <DeductionsStep formData={formData} updateFormData={updateFormData} />
        );
      case 7:
        return (
          <DocumentsStep
            formData={formData}
            updateFormData={updateFormData}
            token={token}
          />
        );
      case 8:
        return (
          <ReviewStep
            formData={formData}
            goToStep={goToStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Progress Steps - Compact pill style */}
      <nav aria-label="Progress" className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#2D4A43]">
            Step {currentStep} of {STEPS.length}
          </span>
          <span className="text-sm text-gray-500">
            {STEPS[currentStep - 1].name}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-[#2D4A43] h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>
        {/* Step indicators */}
        <div className="flex justify-between mt-3">
          {STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => step.id < currentStep && goToStep(step.id)}
              disabled={step.id > currentStep}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                step.id < currentStep
                  ? "bg-[#2D4A43] text-white cursor-pointer hover:bg-[#3D5A53]"
                  : step.id === currentStep
                  ? "bg-[#2D4A43] text-white ring-4 ring-[#2D4A43]/20"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {step.id < currentStep ? (
                <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                step.id
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Form Content */}
      <div className="bg-white shadow-lg rounded-2xl p-8">
        <h2 className="font-brand-heading text-xl font-semibold text-[#1A1A1A] mb-6">
          {STEPS[currentStep - 1].name}
        </h2>

        {renderStep()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all ${
              currentStep === 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-[#2D4A43] bg-[#2D4A43]/5 hover:bg-[#2D4A43]/10"
            }`}
          >
            Previous
          </button>

          {currentStep < STEPS.length ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2.5 text-sm font-medium text-white bg-[#2D4A43] rounded-lg hover:bg-[#3D5A53] transition-all"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-2.5 text-sm font-medium text-white bg-[#2D4A43] rounded-lg hover:bg-[#3D5A53] disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                "Submit"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
