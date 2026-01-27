"use client";

import { IntakeFormData } from "../IntakeForm";
import DateInput from "../DateInput";

interface PersonalInfoStepProps {
  formData: IntakeFormData;
  updateFormData: (updates: Partial<IntakeFormData>) => void;
}

// Branded input class
const inputClass = "mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-[#2D4A43] focus:ring-2 focus:ring-[#2D4A43]/20 sm:text-sm transition-all";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export default function PersonalInfoStep({
  formData,
  updateFormData,
}: PersonalInfoStepProps) {
  const formatSSN = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 9);
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 leading-relaxed">
        Please provide your personal information. All fields marked with <span className="text-[#2D4A43]">*</span> are required.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="firstName" className={labelClass}>
            First Name <span className="text-[#2D4A43]">*</span>
          </label>
          <input
            type="text"
            id="firstName"
            value={formData.firstName}
            onChange={(e) => updateFormData({ firstName: e.target.value })}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label htmlFor="lastName" className={labelClass}>
            Last Name <span className="text-[#2D4A43]">*</span>
          </label>
          <input
            type="text"
            id="lastName"
            value={formData.lastName}
            onChange={(e) => updateFormData({ lastName: e.target.value })}
            className={inputClass}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="email" className={labelClass}>
            Email Address <span className="text-[#2D4A43]">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone Number <span className="text-[#2D4A43]">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => updateFormData({ phone: formatPhone(e.target.value) })}
            placeholder="(555) 555-5555"
            className={inputClass}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="dateOfBirth" className={labelClass}>
            Date of Birth <span className="text-[#2D4A43]">*</span>
          </label>
          <DateInput
            id="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={(value) => updateFormData({ dateOfBirth: value })}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label htmlFor="ssn" className={labelClass}>
            Social Security Number <span className="text-[#2D4A43]">*</span>
          </label>
          <input
            type="text"
            id="ssn"
            value={formData.ssn}
            onChange={(e) => updateFormData({ ssn: formatSSN(e.target.value) })}
            placeholder="XXX-XX-XXXX"
            className={inputClass}
            required
          />
          <p className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-[#2D4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Your SSN is encrypted and securely stored
          </p>
        </div>
      </div>
    </div>
  );
}
