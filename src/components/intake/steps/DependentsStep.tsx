"use client";

import { IntakeFormData } from "../IntakeForm";

interface DependentsStepProps {
  formData: IntakeFormData;
  updateFormData: (updates: Partial<IntakeFormData>) => void;
}

const RELATIONSHIPS = [
  "Son",
  "Daughter",
  "Stepson",
  "Stepdaughter",
  "Foster Child",
  "Brother",
  "Sister",
  "Half Brother",
  "Half Sister",
  "Stepbrother",
  "Stepsister",
  "Grandchild",
  "Niece",
  "Nephew",
  "Parent",
  "Grandparent",
  "Other",
];

// Branded input classes
const inputClass = "mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-[#2D4A43] focus:ring-2 focus:ring-[#2D4A43]/20 sm:text-sm transition-all";
const selectClass = "mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 focus:border-[#2D4A43] focus:ring-2 focus:ring-[#2D4A43]/20 sm:text-sm transition-all bg-white";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export default function DependentsStep({
  formData,
  updateFormData,
}: DependentsStepProps) {
  const formatSSN = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 9);
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  };

  const addDependent = () => {
    const newDependent = {
      id: `dep-${Date.now()}`,
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      ssn: "",
      relationship: "",
      monthsLivedWith: 12,
    };
    updateFormData({
      dependents: [...formData.dependents, newDependent],
    });
  };

  const removeDependent = (id: string) => {
    updateFormData({
      dependents: formData.dependents.filter((d) => d.id !== id),
    });
  };

  const updateDependent = (
    id: string,
    field: string,
    value: string | number
  ) => {
    updateFormData({
      dependents: formData.dependents.map((d) =>
        d.id === id ? { ...d, [field]: value } : d
      ),
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 leading-relaxed">
        Add any dependents you will be claiming on your tax return. This includes
        children, relatives, or others who qualify as dependents.
      </p>

      {formData.dependents.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          <svg
            className="mx-auto h-12 w-12 text-[#2D4A43]/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
          <p className="mt-3 text-sm text-gray-500">No dependents added yet</p>
          <button
            type="button"
            onClick={addDependent}
            className="mt-4 inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-[#2D4A43] hover:bg-[#3D5A53] transition-all"
          >
            Add Dependent
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {formData.dependents.map((dependent, index) => (
            <div
              key={dependent.id}
              className="border-2 border-gray-200 rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-5">
                <h4 className="font-brand-heading text-base font-medium text-gray-900">
                  Dependent {index + 1}
                </h4>
                <button
                  type="button"
                  onClick={() => removeDependent(dependent.id)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>
                    First Name <span className="text-[#2D4A43]">*</span>
                  </label>
                  <input
                    type="text"
                    value={dependent.firstName}
                    onChange={(e) =>
                      updateDependent(dependent.id, "firstName", e.target.value)
                    }
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Last Name <span className="text-[#2D4A43]">*</span>
                  </label>
                  <input
                    type="text"
                    value={dependent.lastName}
                    onChange={(e) =>
                      updateDependent(dependent.id, "lastName", e.target.value)
                    }
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Date of Birth <span className="text-[#2D4A43]">*</span>
                  </label>
                  <input
                    type="date"
                    value={dependent.dateOfBirth}
                    onChange={(e) =>
                      updateDependent(dependent.id, "dateOfBirth", e.target.value)
                    }
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Social Security Number <span className="text-[#2D4A43]">*</span>
                  </label>
                  <input
                    type="text"
                    value={dependent.ssn}
                    onChange={(e) =>
                      updateDependent(dependent.id, "ssn", formatSSN(e.target.value))
                    }
                    placeholder="XXX-XX-XXXX"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Relationship <span className="text-[#2D4A43]">*</span>
                  </label>
                  <select
                    value={dependent.relationship}
                    onChange={(e) =>
                      updateDependent(dependent.id, "relationship", e.target.value)
                    }
                    className={selectClass}
                    required
                  >
                    <option value="">Select relationship</option>
                    {RELATIONSHIPS.map((rel) => (
                      <option key={rel} value={rel.toLowerCase()}>
                        {rel}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    Months Lived With You
                  </label>
                  <select
                    value={dependent.monthsLivedWith}
                    onChange={(e) =>
                      updateDependent(
                        dependent.id,
                        "monthsLivedWith",
                        parseInt(e.target.value)
                      )
                    }
                    className={selectClass}
                  >
                    {[...Array(13)].map((_, i) => (
                      <option key={i} value={i}>
                        {i} {i === 1 ? "month" : "months"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addDependent}
            className="inline-flex items-center px-4 py-2.5 border-2 border-gray-200 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <svg
              className="h-4 w-4 mr-2"
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
            Add Another Dependent
          </button>
        </div>
      )}

      <div className="bg-[#2D4A43]/5 border border-[#2D4A43]/10 rounded-xl p-5">
        <h4 className="text-sm font-medium text-[#2D4A43]">
          Who qualifies as a dependent?
        </h4>
        <ul className="mt-3 text-sm text-gray-600 list-disc list-inside space-y-1.5">
          <li>Children under age 19 (or under 24 if a full-time student)</li>
          <li>Relatives who live with you and earn less than $4,700/year</li>
          <li>Must be a U.S. citizen or resident</li>
          <li>Cannot file a joint return with a spouse</li>
        </ul>
      </div>
    </div>
  );
}
