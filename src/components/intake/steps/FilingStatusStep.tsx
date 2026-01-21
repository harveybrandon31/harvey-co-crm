"use client";

import { IntakeFormData } from "../IntakeForm";

interface FilingStatusStepProps {
  formData: IntakeFormData;
  updateFormData: (updates: Partial<IntakeFormData>) => void;
}

const FILING_STATUSES = [
  {
    value: "single",
    label: "Single",
    description: "Unmarried or legally separated",
  },
  {
    value: "married_joint",
    label: "Married Filing Jointly",
    description: "Married couples filing one return together",
  },
  {
    value: "married_separate",
    label: "Married Filing Separately",
    description: "Married couples each filing their own return",
  },
  {
    value: "head_of_household",
    label: "Head of Household",
    description: "Unmarried with a qualifying dependent",
  },
  {
    value: "qualifying_widow",
    label: "Qualifying Surviving Spouse",
    description: "Spouse died in the past 2 years with a dependent child",
  },
];

// Branded input classes
const inputClass = "mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-[#2D4A43] focus:ring-2 focus:ring-[#2D4A43]/20 sm:text-sm transition-all";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export default function FilingStatusStep({
  formData,
  updateFormData,
}: FilingStatusStepProps) {
  const formatSSN = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 9);
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  };

  const showSpouseInfo =
    formData.filingStatus === "married_joint" ||
    formData.filingStatus === "married_separate";

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 leading-relaxed">
        Select your filing status for this tax year. If you&apos;re unsure, we can help
        determine the best status during your consultation.
      </p>

      <div>
        <label className={labelClass}>
          Filing Status <span className="text-[#2D4A43]">*</span>
        </label>
        <div className="space-y-3 mt-2">
          {FILING_STATUSES.map((status) => (
            <label
              key={status.value}
              className={`relative flex cursor-pointer rounded-xl border-2 p-4 transition-all ${
                formData.filingStatus === status.value
                  ? "border-[#2D4A43] bg-[#2D4A43]/5"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="filingStatus"
                value={status.value}
                checked={formData.filingStatus === status.value}
                onChange={(e) => {
                  updateFormData({
                    filingStatus: e.target.value,
                    hasSpouse:
                      e.target.value === "married_joint" ||
                      e.target.value === "married_separate",
                  });
                }}
                className="sr-only"
              />
              <div className="flex items-center">
                <div
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    formData.filingStatus === status.value
                      ? "border-[#2D4A43] bg-[#2D4A43]"
                      : "border-gray-300"
                  }`}
                >
                  {formData.filingStatus === status.value && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
                <div className="ml-4">
                  <span className="block text-sm font-medium text-gray-900">
                    {status.label}
                  </span>
                  <span className="block text-sm text-gray-500 mt-0.5">
                    {status.description}
                  </span>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {showSpouseInfo && (
        <div className="border-t border-gray-100 pt-6 mt-6">
          <h3 className="font-brand-heading text-lg font-medium text-gray-900 mb-4">
            Spouse Information
          </h3>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="spouseFirstName" className={labelClass}>
                  Spouse First Name <span className="text-[#2D4A43]">*</span>
                </label>
                <input
                  type="text"
                  id="spouseFirstName"
                  value={formData.spouseFirstName}
                  onChange={(e) =>
                    updateFormData({ spouseFirstName: e.target.value })
                  }
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="spouseLastName" className={labelClass}>
                  Spouse Last Name <span className="text-[#2D4A43]">*</span>
                </label>
                <input
                  type="text"
                  id="spouseLastName"
                  value={formData.spouseLastName}
                  onChange={(e) =>
                    updateFormData({ spouseLastName: e.target.value })
                  }
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="spouseDob" className={labelClass}>
                  Spouse Date of Birth <span className="text-[#2D4A43]">*</span>
                </label>
                <input
                  type="date"
                  id="spouseDob"
                  value={formData.spouseDob}
                  onChange={(e) => updateFormData({ spouseDob: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="spouseSsn" className={labelClass}>
                  Spouse SSN <span className="text-[#2D4A43]">*</span>
                </label>
                <input
                  type="text"
                  id="spouseSsn"
                  value={formData.spouseSsn}
                  onChange={(e) =>
                    updateFormData({ spouseSsn: formatSSN(e.target.value) })
                  }
                  placeholder="XXX-XX-XXXX"
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
