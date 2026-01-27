"use client";

import { useState, useEffect } from "react";

interface DateInputProps {
  id: string;
  value: string; // Expected format: YYYY-MM-DD (standard date format)
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  placeholder?: string;
}

/**
 * Date input that allows manual text entry in MM/DD/YYYY format
 * Internally converts to/from YYYY-MM-DD for form state
 */
export default function DateInput({
  id,
  value,
  onChange,
  className = "",
  required = false,
  placeholder = "MM/DD/YYYY",
}: DateInputProps) {
  // Convert YYYY-MM-DD to MM/DD/YYYY for display
  const formatForDisplay = (isoDate: string): string => {
    if (!isoDate) return "";
    const parts = isoDate.split("-");
    if (parts.length !== 3) return isoDate;
    const [year, month, day] = parts;
    return `${month}/${day}/${year}`;
  };

  // Convert MM/DD/YYYY to YYYY-MM-DD for storage
  const formatForStorage = (displayDate: string): string => {
    if (!displayDate) return "";

    // Remove any non-numeric characters except slashes
    const cleaned = displayDate.replace(/[^\d/]/g, "");
    const parts = cleaned.split("/");

    if (parts.length === 3) {
      const [month, day, year] = parts;
      // Only convert if we have valid-looking parts
      if (month && day && year && year.length === 4) {
        const mm = month.padStart(2, "0");
        const dd = day.padStart(2, "0");
        return `${year}-${mm}-${dd}`;
      }
    }

    return "";
  };

  const [displayValue, setDisplayValue] = useState(formatForDisplay(value));

  // Update display when value prop changes
  useEffect(() => {
    setDisplayValue(formatForDisplay(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;

    // Auto-format: add slashes after MM and DD
    const digits = input.replace(/\D/g, "");
    if (digits.length >= 2 && !input.includes("/")) {
      input = digits.slice(0, 2) + "/" + digits.slice(2);
    }
    if (digits.length >= 4 && input.split("/").length < 3) {
      const parts = input.split("/");
      if (parts.length === 2 && parts[1].length >= 2) {
        input = parts[0] + "/" + parts[1].slice(0, 2) + "/" + parts[1].slice(2);
      }
    }

    // Limit length
    if (input.length > 10) {
      input = input.slice(0, 10);
    }

    setDisplayValue(input);

    // Convert to ISO format and update parent
    const isoDate = formatForStorage(input);
    if (isoDate || input === "") {
      onChange(isoDate);
    }
  };

  const handleBlur = () => {
    // On blur, try to parse and reformat
    const isoDate = formatForStorage(displayValue);
    if (isoDate) {
      setDisplayValue(formatForDisplay(isoDate));
      onChange(isoDate);
    }
  };

  return (
    <input
      type="text"
      id={id}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      required={required}
      inputMode="numeric"
      autoComplete="off"
    />
  );
}
