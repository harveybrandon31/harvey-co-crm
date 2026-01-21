"use client";

import { IntakeFormData } from "../IntakeForm";

interface DeductionsStepProps {
  formData: IntakeFormData;
  updateFormData: (updates: Partial<IntakeFormData>) => void;
}

// Branded checkbox class
const checkboxClass = "h-5 w-5 rounded border-gray-300 text-[#2D4A43] focus:ring-[#2D4A43] focus:ring-offset-0";
const textareaClass = "mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-[#2D4A43] focus:ring-2 focus:ring-[#2D4A43]/20 sm:text-sm transition-all";

export default function DeductionsStep({
  formData,
  updateFormData,
}: DeductionsStepProps) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 leading-relaxed">
        Tell us about potential deductions and credits you may qualify for.
      </p>

      {/* Itemize vs Standard */}
      <div className={`border-2 rounded-xl p-5 transition-all ${formData.itemizeDeductions ? "border-[#2D4A43] bg-[#2D4A43]/5" : "border-gray-200 bg-gray-50"}`}>
        <div className="flex items-start">
          <div className="flex items-center h-5 mt-0.5">
            <input
              id="itemizeDeductions"
              type="checkbox"
              checked={formData.itemizeDeductions}
              onChange={(e) =>
                updateFormData({ itemizeDeductions: e.target.checked })
              }
              className={checkboxClass}
            />
          </div>
          <div className="ml-4">
            <label
              htmlFor="itemizeDeductions"
              className="text-sm font-medium text-gray-900"
            >
              I want to itemize deductions
            </label>
            <p className="text-sm text-gray-500 mt-0.5">
              If unchecked, we&apos;ll compare to see if itemizing saves you money.
              Standard deduction for 2024: $14,600 (single) or $29,200 (married
              filing jointly).
            </p>
          </div>
        </div>
      </div>

      {/* Common Deductions */}
      <div>
        <h3 className="font-brand-heading text-lg font-medium text-gray-900 mb-4">
          Common Deductions
        </h3>
        <div className="space-y-4">
          <div className={`flex items-start p-4 rounded-lg transition-all ${formData.hasMortgageInterest ? "bg-[#2D4A43]/5" : ""}`}>
            <div className="flex items-center h-5 mt-0.5">
              <input
                id="hasMortgageInterest"
                type="checkbox"
                checked={formData.hasMortgageInterest}
                onChange={(e) =>
                  updateFormData({ hasMortgageInterest: e.target.checked })
                }
                className={checkboxClass}
              />
            </div>
            <div className="ml-4">
              <label
                htmlFor="hasMortgageInterest"
                className="text-sm font-medium text-gray-700"
              >
                Mortgage interest paid
              </label>
              <p className="text-sm text-gray-500 mt-0.5">
                You&apos;ll receive Form 1098 from your lender
              </p>
            </div>
          </div>

          <div className={`flex items-start p-4 rounded-lg transition-all ${formData.hasCharitableDonations ? "bg-[#2D4A43]/5" : ""}`}>
            <div className="flex items-center h-5 mt-0.5">
              <input
                id="hasCharitableDonations"
                type="checkbox"
                checked={formData.hasCharitableDonations}
                onChange={(e) =>
                  updateFormData({ hasCharitableDonations: e.target.checked })
                }
                className={checkboxClass}
              />
            </div>
            <div className="ml-4">
              <label
                htmlFor="hasCharitableDonations"
                className="text-sm font-medium text-gray-700"
              >
                Charitable donations
              </label>
              <p className="text-sm text-gray-500 mt-0.5">
                Cash or property donated to qualified organizations
              </p>
            </div>
          </div>

          <div className={`flex items-start p-4 rounded-lg transition-all ${formData.hasStudentLoanInterest ? "bg-[#2D4A43]/5" : ""}`}>
            <div className="flex items-center h-5 mt-0.5">
              <input
                id="hasStudentLoanInterest"
                type="checkbox"
                checked={formData.hasStudentLoanInterest}
                onChange={(e) =>
                  updateFormData({ hasStudentLoanInterest: e.target.checked })
                }
                className={checkboxClass}
              />
            </div>
            <div className="ml-4">
              <label
                htmlFor="hasStudentLoanInterest"
                className="text-sm font-medium text-gray-700"
              >
                Student loan interest
              </label>
              <p className="text-sm text-gray-500 mt-0.5">
                Deduct up to $2,500 in student loan interest (Form 1098-E)
              </p>
            </div>
          </div>

          <div className={`flex items-start p-4 rounded-lg transition-all ${formData.hasMedicalExpenses ? "bg-[#2D4A43]/5" : ""}`}>
            <div className="flex items-center h-5 mt-0.5">
              <input
                id="hasMedicalExpenses"
                type="checkbox"
                checked={formData.hasMedicalExpenses}
                onChange={(e) =>
                  updateFormData({ hasMedicalExpenses: e.target.checked })
                }
                className={checkboxClass}
              />
            </div>
            <div className="ml-4">
              <label
                htmlFor="hasMedicalExpenses"
                className="text-sm font-medium text-gray-700"
              >
                Significant medical expenses
              </label>
              <p className="text-sm text-gray-500 mt-0.5">
                Deductible if exceeding 7.5% of adjusted gross income
              </p>
            </div>
          </div>

          <div className={`flex items-start p-4 rounded-lg transition-all ${formData.hasBusinessExpenses ? "bg-[#2D4A43]/5" : ""}`}>
            <div className="flex items-center h-5 mt-0.5">
              <input
                id="hasBusinessExpenses"
                type="checkbox"
                checked={formData.hasBusinessExpenses}
                onChange={(e) =>
                  updateFormData({ hasBusinessExpenses: e.target.checked })
                }
                className={checkboxClass}
              />
            </div>
            <div className="ml-4">
              <label
                htmlFor="hasBusinessExpenses"
                className="text-sm font-medium text-gray-700"
              >
                Business or self-employment expenses
              </label>
              <p className="text-sm text-gray-500 mt-0.5">
                Home office, supplies, mileage, etc.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Credits */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="font-brand-heading text-lg font-medium text-gray-900 mb-4">
          Potential Tax Credits
        </h3>
        <div className="space-y-4">
          <div className={`flex items-start p-4 rounded-lg transition-all ${formData.hasChildcare ? "bg-[#2D4A43]/5" : ""}`}>
            <div className="flex items-center h-5 mt-0.5">
              <input
                id="hasChildcare"
                type="checkbox"
                checked={formData.hasChildcare}
                onChange={(e) =>
                  updateFormData({ hasChildcare: e.target.checked })
                }
                className={checkboxClass}
              />
            </div>
            <div className="ml-4">
              <label
                htmlFor="hasChildcare"
                className="text-sm font-medium text-gray-700"
              >
                Paid for childcare or dependent care
              </label>
              <p className="text-sm text-gray-500 mt-0.5">
                Daycare, after-school programs, summer camps
              </p>
            </div>
          </div>

          <div className={`flex items-start p-4 rounded-lg transition-all ${formData.hasEducationExpenses ? "bg-[#2D4A43]/5" : ""}`}>
            <div className="flex items-center h-5 mt-0.5">
              <input
                id="hasEducationExpenses"
                type="checkbox"
                checked={formData.hasEducationExpenses}
                onChange={(e) =>
                  updateFormData({ hasEducationExpenses: e.target.checked })
                }
                className={checkboxClass}
              />
            </div>
            <div className="ml-4">
              <label
                htmlFor="hasEducationExpenses"
                className="text-sm font-medium text-gray-700"
              >
                Paid for higher education expenses
              </label>
              <p className="text-sm text-gray-500 mt-0.5">
                College tuition, fees, books (Form 1098-T)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="border-t border-gray-100 pt-6">
        <label
          htmlFor="otherDeductions"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Other deductions or tax situations we should know about
        </label>
        <textarea
          id="otherDeductions"
          rows={3}
          value={formData.otherDeductions}
          onChange={(e) => updateFormData({ otherDeductions: e.target.value })}
          placeholder="e.g., HSA contributions, IRA contributions, state/local taxes paid, etc."
          className={textareaClass}
        />
      </div>
    </div>
  );
}
