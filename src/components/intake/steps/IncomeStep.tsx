"use client";

import { IntakeFormData } from "../IntakeForm";

interface IncomeStepProps {
  formData: IntakeFormData;
  updateFormData: (updates: Partial<IntakeFormData>) => void;
}

const INCOME_TYPES = [
  { id: "wages", label: "W-2 Wages (Employment Income)" },
  { id: "self_employment", label: "Self-Employment / 1099-NEC Income" },
  { id: "interest", label: "Interest Income (1099-INT)" },
  { id: "dividends", label: "Dividend Income (1099-DIV)" },
  { id: "retirement", label: "Retirement Distributions (1099-R)" },
  { id: "social_security", label: "Social Security Benefits (SSA-1099)" },
  { id: "unemployment", label: "Unemployment Compensation (1099-G)" },
  { id: "gambling", label: "Gambling Winnings (W-2G)" },
];

// Branded checkbox classes
const checkboxClass = "h-5 w-5 rounded border-gray-300 text-[#2D4A43] focus:ring-[#2D4A43] focus:ring-offset-0";
const selectClass = "block w-32 rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-[#2D4A43] focus:ring-2 focus:ring-[#2D4A43]/20 sm:text-sm transition-all bg-white";

export default function IncomeStep({
  formData,
  updateFormData,
}: IncomeStepProps) {
  const toggleIncomeType = (typeId: string) => {
    const current = formData.incomeTypes;
    if (current.includes(typeId)) {
      updateFormData({
        incomeTypes: current.filter((t) => t !== typeId),
      });
    } else {
      updateFormData({
        incomeTypes: [...current, typeId],
      });
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 leading-relaxed">
        Tell us about your income sources for the tax year. Check all that apply.
      </p>

      {/* W-2 Employment */}
      <div className={`border-2 rounded-xl p-5 transition-all ${formData.hasW2Income ? "border-[#2D4A43] bg-[#2D4A43]/5" : "border-gray-200"}`}>
        <div className="flex items-start">
          <div className="flex items-center h-5 mt-0.5">
            <input
              id="hasW2Income"
              type="checkbox"
              checked={formData.hasW2Income}
              onChange={(e) => updateFormData({ hasW2Income: e.target.checked })}
              className={checkboxClass}
            />
          </div>
          <div className="ml-4">
            <label htmlFor="hasW2Income" className="text-sm font-medium text-gray-900">
              I received W-2 income from an employer
            </label>
            <p className="text-sm text-gray-500 mt-0.5">
              Wages, salaries, tips from employment
            </p>
          </div>
        </div>

        {formData.hasW2Income && (
          <div className="mt-4 ml-9 pt-4 border-t border-[#2D4A43]/10">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How many W-2s will you have?
            </label>
            <select
              value={formData.w2EmployerCount}
              onChange={(e) =>
                updateFormData({ w2EmployerCount: parseInt(e.target.value) })
              }
              className={selectClass}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 1099 Self-Employment */}
      <div className={`border-2 rounded-xl p-5 transition-all ${formData.has1099Income ? "border-[#2D4A43] bg-[#2D4A43]/5" : "border-gray-200"}`}>
        <div className="flex items-start">
          <div className="flex items-center h-5 mt-0.5">
            <input
              id="has1099Income"
              type="checkbox"
              checked={formData.has1099Income}
              onChange={(e) => updateFormData({ has1099Income: e.target.checked })}
              className={checkboxClass}
            />
          </div>
          <div className="ml-4">
            <label htmlFor="has1099Income" className="text-sm font-medium text-gray-900">
              I received 1099-NEC/MISC or self-employment income
            </label>
            <p className="text-sm text-gray-500 mt-0.5">
              Freelance, contract work, gig economy, or business income
            </p>
          </div>
        </div>
      </div>

      {/* Other Income Types */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Other Income Sources (check all that apply)
        </label>
        <div className="space-y-3">
          {INCOME_TYPES.slice(2).map((type) => (
            <div key={type.id} className="flex items-center">
              <input
                id={type.id}
                type="checkbox"
                checked={formData.incomeTypes.includes(type.id)}
                onChange={() => toggleIncomeType(type.id)}
                className={checkboxClass}
              />
              <label htmlFor={type.id} className="ml-3 text-sm text-gray-700">
                {type.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Investment Questions */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="font-brand-heading text-lg font-medium text-gray-900 mb-4">
          Investment & Special Income
        </h3>

        <div className="space-y-4">
          <div className={`flex items-start p-4 rounded-lg transition-all ${formData.hasStockSales ? "bg-[#2D4A43]/5" : ""}`}>
            <div className="flex items-center h-5 mt-0.5">
              <input
                id="hasStockSales"
                type="checkbox"
                checked={formData.hasStockSales}
                onChange={(e) => updateFormData({ hasStockSales: e.target.checked })}
                className={checkboxClass}
              />
            </div>
            <div className="ml-4">
              <label htmlFor="hasStockSales" className="text-sm font-medium text-gray-700">
                Sold stocks, bonds, or mutual funds
              </label>
              <p className="text-sm text-gray-500 mt-0.5">
                You&apos;ll receive a 1099-B from your brokerage
              </p>
            </div>
          </div>

          <div className={`flex items-start p-4 rounded-lg transition-all ${formData.hasCryptoTransactions ? "bg-[#2D4A43]/5" : ""}`}>
            <div className="flex items-center h-5 mt-0.5">
              <input
                id="hasCryptoTransactions"
                type="checkbox"
                checked={formData.hasCryptoTransactions}
                onChange={(e) =>
                  updateFormData({ hasCryptoTransactions: e.target.checked })
                }
                className={checkboxClass}
              />
            </div>
            <div className="ml-4">
              <label
                htmlFor="hasCryptoTransactions"
                className="text-sm font-medium text-gray-700"
              >
                Bought, sold, or exchanged cryptocurrency
              </label>
              <p className="text-sm text-gray-500 mt-0.5">
                Bitcoin, Ethereum, or other digital currencies
              </p>
            </div>
          </div>

          <div className={`flex items-start p-4 rounded-lg transition-all ${formData.hasRentalIncome ? "bg-[#2D4A43]/5" : ""}`}>
            <div className="flex items-center h-5 mt-0.5">
              <input
                id="hasRentalIncome"
                type="checkbox"
                checked={formData.hasRentalIncome}
                onChange={(e) => updateFormData({ hasRentalIncome: e.target.checked })}
                className={checkboxClass}
              />
            </div>
            <div className="ml-4">
              <label htmlFor="hasRentalIncome" className="text-sm font-medium text-gray-700">
                Received rental income from property
              </label>
              <p className="text-sm text-gray-500 mt-0.5">
                Income from renting out real estate
              </p>
            </div>
          </div>

          <div className={`flex items-start p-4 rounded-lg transition-all ${formData.hasForeignIncome ? "bg-[#2D4A43]/5" : ""}`}>
            <div className="flex items-center h-5 mt-0.5">
              <input
                id="hasForeignIncome"
                type="checkbox"
                checked={formData.hasForeignIncome}
                onChange={(e) => updateFormData({ hasForeignIncome: e.target.checked })}
                className={checkboxClass}
              />
            </div>
            <div className="ml-4">
              <label htmlFor="hasForeignIncome" className="text-sm font-medium text-gray-700">
                Received income from foreign sources
              </label>
              <p className="text-sm text-gray-500 mt-0.5">
                Or have foreign bank accounts/assets over $10,000
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
