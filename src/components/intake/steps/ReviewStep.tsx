"use client";

import { IntakeFormData } from "../IntakeForm";

interface ReviewStepProps {
  formData: IntakeFormData;
  goToStep: (step: number) => void;
}

const FILING_STATUS_LABELS: Record<string, string> = {
  single: "Single",
  married_joint: "Married Filing Jointly",
  married_separate: "Married Filing Separately",
  head_of_household: "Head of Household",
  qualifying_widow: "Qualifying Surviving Spouse",
};

// Branded textarea class
const textareaClass = "mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-[#2D4A43] focus:ring-2 focus:ring-[#2D4A43]/20 sm:text-sm transition-all";

export default function ReviewStep({ formData, goToStep }: ReviewStepProps) {
  const maskSSN = (ssn: string) => {
    if (!ssn) return "-";
    return `***-**-${ssn.slice(-4)}`;
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600 leading-relaxed">
        Please review your information before submitting. Click &quot;Edit&quot; next to
        any section to make changes.
      </p>

      {/* Personal Information */}
      <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-brand-heading text-sm font-medium text-gray-900">
            Personal Information
          </h3>
          <button
            type="button"
            onClick={() => goToStep(1)}
            className="text-sm text-[#2D4A43] hover:text-[#3D5A53] font-medium"
          >
            Edit
          </button>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Name:</span>{" "}
            <span className="text-gray-900 font-medium">
              {formData.firstName} {formData.lastName}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Email:</span>{" "}
            <span className="text-gray-900">{formData.email || "-"}</span>
          </div>
          <div>
            <span className="text-gray-500">Phone:</span>{" "}
            <span className="text-gray-900">{formData.phone || "-"}</span>
          </div>
          <div>
            <span className="text-gray-500">DOB:</span>{" "}
            <span className="text-gray-900">{formData.dateOfBirth || "-"}</span>
          </div>
          <div>
            <span className="text-gray-500">SSN:</span>{" "}
            <span className="text-gray-900">{maskSSN(formData.ssn)}</span>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-brand-heading text-sm font-medium text-gray-900">Address</h3>
          <button
            type="button"
            onClick={() => goToStep(2)}
            className="text-sm text-[#2D4A43] hover:text-[#3D5A53] font-medium"
          >
            Edit
          </button>
        </div>
        <div className="px-5 py-4 text-sm">
          {formData.addressStreet ? (
            <p className="text-gray-900">
              {formData.addressStreet}
              <br />
              {formData.addressCity}, {formData.addressState}{" "}
              {formData.addressZip}
            </p>
          ) : (
            <p className="text-gray-500 italic">No address provided</p>
          )}
        </div>
      </div>

      {/* Filing Status */}
      <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-brand-heading text-sm font-medium text-gray-900">Filing Status</h3>
          <button
            type="button"
            onClick={() => goToStep(3)}
            className="text-sm text-[#2D4A43] hover:text-[#3D5A53] font-medium"
          >
            Edit
          </button>
        </div>
        <div className="px-5 py-4 text-sm">
          <p className="text-gray-900">
            {FILING_STATUS_LABELS[formData.filingStatus] || <span className="text-gray-500 italic">Not selected</span>}
          </p>
          {formData.hasSpouse && formData.spouseFirstName && (
            <p className="text-gray-500 mt-1">
              Spouse: {formData.spouseFirstName} {formData.spouseLastName}
            </p>
          )}
        </div>
      </div>

      {/* Dependents */}
      <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-brand-heading text-sm font-medium text-gray-900">Dependents</h3>
          <button
            type="button"
            onClick={() => goToStep(4)}
            className="text-sm text-[#2D4A43] hover:text-[#3D5A53] font-medium"
          >
            Edit
          </button>
        </div>
        <div className="px-5 py-4 text-sm">
          {formData.dependents.length > 0 ? (
            <ul className="space-y-1">
              {formData.dependents.map((dep, index) => (
                <li key={dep.id} className="text-gray-900">
                  {index + 1}. {dep.firstName} {dep.lastName} ({dep.relationship})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No dependents</p>
          )}
        </div>
      </div>

      {/* Income */}
      <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-brand-heading text-sm font-medium text-gray-900">Income Sources</h3>
          <button
            type="button"
            onClick={() => goToStep(5)}
            className="text-sm text-[#2D4A43] hover:text-[#3D5A53] font-medium"
          >
            Edit
          </button>
        </div>
        <div className="px-5 py-4 text-sm">
          <ul className="space-y-1">
            {formData.hasW2Income && (
              <li className="text-gray-900">
                W-2 Income ({formData.w2EmployerCount} employer
                {formData.w2EmployerCount > 1 ? "s" : ""})
              </li>
            )}
            {formData.has1099Income && (
              <li className="text-gray-900">1099/Self-Employment Income</li>
            )}
            {formData.hasStockSales && (
              <li className="text-gray-900">Stock/Investment Sales</li>
            )}
            {formData.hasCryptoTransactions && (
              <li className="text-gray-900">Cryptocurrency Transactions</li>
            )}
            {formData.hasRentalIncome && (
              <li className="text-gray-900">Rental Income</li>
            )}
            {formData.hasForeignIncome && (
              <li className="text-gray-900">Foreign Income/Accounts</li>
            )}
            {formData.incomeTypes.map((type) => (
              <li key={type} className="text-gray-900 capitalize">
                {type.replace(/_/g, " ")}
              </li>
            ))}
            {!formData.hasW2Income &&
              !formData.has1099Income &&
              !formData.hasStockSales &&
              !formData.hasCryptoTransactions &&
              !formData.hasRentalIncome &&
              !formData.hasForeignIncome &&
              formData.incomeTypes.length === 0 && (
                <li className="text-gray-500 italic">No income sources selected</li>
              )}
          </ul>
        </div>
      </div>

      {/* Deductions */}
      <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-brand-heading text-sm font-medium text-gray-900">
            Deductions & Credits
          </h3>
          <button
            type="button"
            onClick={() => goToStep(6)}
            className="text-sm text-[#2D4A43] hover:text-[#3D5A53] font-medium"
          >
            Edit
          </button>
        </div>
        <div className="px-5 py-4 text-sm">
          <ul className="space-y-1">
            {formData.itemizeDeductions && (
              <li className="text-gray-900">Planning to itemize deductions</li>
            )}
            {formData.hasMortgageInterest && (
              <li className="text-gray-900">Mortgage Interest</li>
            )}
            {formData.hasCharitableDonations && (
              <li className="text-gray-900">Charitable Donations</li>
            )}
            {formData.hasStudentLoanInterest && (
              <li className="text-gray-900">Student Loan Interest</li>
            )}
            {formData.hasMedicalExpenses && (
              <li className="text-gray-900">Medical Expenses</li>
            )}
            {formData.hasBusinessExpenses && (
              <li className="text-gray-900">Business Expenses</li>
            )}
            {formData.hasChildcare && (
              <li className="text-gray-900">Childcare/Dependent Care</li>
            )}
            {formData.hasEducationExpenses && (
              <li className="text-gray-900">Education Expenses</li>
            )}
            {!formData.hasMortgageInterest &&
              !formData.hasCharitableDonations &&
              !formData.hasStudentLoanInterest &&
              !formData.hasMedicalExpenses &&
              !formData.hasBusinessExpenses &&
              !formData.hasChildcare &&
              !formData.hasEducationExpenses && (
                <li className="text-gray-500 italic">
                  No deductions or credits selected
                </li>
              )}
          </ul>
          {formData.otherDeductions && (
            <p className="mt-2 text-gray-500">
              Notes: {formData.otherDeductions}
            </p>
          )}
        </div>
      </div>

      {/* Documents */}
      <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-brand-heading text-sm font-medium text-gray-900">
            Uploaded Documents
          </h3>
          <button
            type="button"
            onClick={() => goToStep(7)}
            className="text-sm text-[#2D4A43] hover:text-[#3D5A53] font-medium"
          >
            Edit
          </button>
        </div>
        <div className="px-5 py-4 text-sm">
          {formData.uploadedDocuments.length > 0 ? (
            <ul className="space-y-1">
              {formData.uploadedDocuments.map((doc) => (
                <li key={doc.id} className="text-gray-900">
                  {doc.name} ({doc.category})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">
              No documents uploaded yet. You can add them later.
            </p>
          )}
        </div>
      </div>

      {/* Additional Notes */}
      <div>
        <label
          htmlFor="additionalNotes"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Additional Notes or Questions
        </label>
        <textarea
          id="additionalNotes"
          rows={3}
          value={formData.additionalNotes}
          onChange={() => {}}
          placeholder="Anything else we should know about your tax situation?"
          className={textareaClass}
        />
      </div>

      {/* Consent */}
      <div className="bg-[#2D4A43]/5 border border-[#2D4A43]/10 rounded-xl p-5">
        <p className="text-sm text-gray-700 leading-relaxed">
          By clicking &quot;Submit&quot; below, I confirm that the information provided
          is accurate to the best of my knowledge. I understand that Harvey & Co
          Financial Services will use this information for the purpose of
          preparing my tax return.
        </p>
      </div>
    </div>
  );
}
