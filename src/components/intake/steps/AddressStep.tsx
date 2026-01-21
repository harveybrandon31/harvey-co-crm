"use client";

import { IntakeFormData } from "../IntakeForm";

interface AddressStepProps {
  formData: IntakeFormData;
  updateFormData: (updates: Partial<IntakeFormData>) => void;
}

const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
  { code: "DC", name: "District of Columbia" },
];

// Branded input classes
const inputClass = "mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-[#2D4A43] focus:ring-2 focus:ring-[#2D4A43]/20 sm:text-sm transition-all";
const selectClass = "mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 focus:border-[#2D4A43] focus:ring-2 focus:ring-[#2D4A43]/20 sm:text-sm transition-all bg-white";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export default function AddressStep({
  formData,
  updateFormData,
}: AddressStepProps) {
  const formatZip = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 5);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 leading-relaxed">
        Please provide your current mailing address as it should appear on your tax return.
      </p>

      <div>
        <label htmlFor="addressStreet" className={labelClass}>
          Street Address <span className="text-[#2D4A43]">*</span>
        </label>
        <input
          type="text"
          id="addressStreet"
          value={formData.addressStreet}
          onChange={(e) => updateFormData({ addressStreet: e.target.value })}
          placeholder="123 Main Street, Apt 4"
          className={inputClass}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div>
          <label htmlFor="addressCity" className={labelClass}>
            City <span className="text-[#2D4A43]">*</span>
          </label>
          <input
            type="text"
            id="addressCity"
            value={formData.addressCity}
            onChange={(e) => updateFormData({ addressCity: e.target.value })}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label htmlFor="addressState" className={labelClass}>
            State <span className="text-[#2D4A43]">*</span>
          </label>
          <select
            id="addressState"
            value={formData.addressState}
            onChange={(e) => updateFormData({ addressState: e.target.value })}
            className={selectClass}
            required
          >
            <option value="">Select a state</option>
            {US_STATES.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="addressZip" className={labelClass}>
            ZIP Code <span className="text-[#2D4A43]">*</span>
          </label>
          <input
            type="text"
            id="addressZip"
            value={formData.addressZip}
            onChange={(e) => updateFormData({ addressZip: formatZip(e.target.value) })}
            placeholder="12345"
            maxLength={5}
            className={inputClass}
            required
          />
        </div>
      </div>
    </div>
  );
}
