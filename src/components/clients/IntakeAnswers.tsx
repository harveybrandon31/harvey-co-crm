"use client";

interface IntakeResponse {
  question_key: string;
  response_value: boolean | number | string | string[];
  response_type: string;
}

interface IntakeAnswersProps {
  responses: IntakeResponse[] | null;
  intakeCompletedAt?: string | null;
}

// Human-readable labels for question keys
const QUESTION_LABELS: Record<string, string> = {
  // Income
  has_w2_income: "Has W-2 Income",
  w2_employer_count: "Number of Employers",
  has_1099_income: "Has 1099/Self-Employment Income",
  income_types: "Other Income Types",
  has_crypto: "Has Cryptocurrency Transactions",
  has_stock_sales: "Has Stock/Investment Sales",
  has_rental_income: "Has Rental Income",
  has_foreign_income: "Has Foreign Income/Accounts",
  // Deductions
  itemize_deductions: "Plans to Itemize Deductions",
  has_mortgage_interest: "Has Mortgage Interest",
  has_charitable: "Has Charitable Donations",
  has_student_loan: "Has Student Loan Interest",
  has_medical: "Has Medical Expenses",
  has_business: "Has Business Expenses",
  has_childcare: "Has Childcare Expenses",
  has_education: "Has Education Expenses",
  other_deductions: "Other Deductions",
  // Notes
  additional_notes: "Additional Notes",
};

// Group questions by category
const CATEGORIES: Record<string, string[]> = {
  "Income Sources": [
    "has_w2_income",
    "w2_employer_count",
    "has_1099_income",
    "income_types",
    "has_crypto",
    "has_stock_sales",
    "has_rental_income",
    "has_foreign_income",
  ],
  "Deductions & Credits": [
    "itemize_deductions",
    "has_mortgage_interest",
    "has_charitable",
    "has_student_loan",
    "has_medical",
    "has_business",
    "has_childcare",
    "has_education",
    "other_deductions",
  ],
  "Additional Information": ["additional_notes"],
};

function formatValue(value: boolean | number | string | string[], type: string): string {
  if (type === "boolean") {
    return value ? "Yes" : "No";
  }
  if (type === "array" && Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "None";
  }
  if (type === "number") {
    return value?.toString() || "0";
  }
  if (type === "text") {
    return value?.toString() || "-";
  }
  return value?.toString() || "-";
}

export default function IntakeAnswers({ responses, intakeCompletedAt }: IntakeAnswersProps) {
  if (!responses || responses.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Intake Answers</h2>
        <p className="text-sm text-gray-500">No intake responses recorded yet.</p>
      </div>
    );
  }

  // Create a map for quick lookup
  const responseMap = new Map<string, IntakeResponse>();
  responses.forEach((r) => responseMap.set(r.question_key, r));

  // Check if there are any "yes" answers for highlighting
  const hasYesAnswers = (keys: string[]) => {
    return keys.some((key) => {
      const response = responseMap.get(key);
      if (!response) return false;
      if (response.response_type === "boolean") return response.response_value === true;
      if (response.response_type === "array") return Array.isArray(response.response_value) && response.response_value.length > 0;
      if (response.response_type === "number") return (response.response_value as number) > 0;
      return false;
    });
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Intake Answers</h2>
        {intakeCompletedAt && (
          <span className="text-xs text-gray-500">
            Completed {new Date(intakeCompletedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="space-y-6">
        {Object.entries(CATEGORIES).map(([category, keys]) => {
          const categoryHasData = keys.some((key) => responseMap.has(key));
          if (!categoryHasData) return null;

          const isHighlighted = hasYesAnswers(keys);

          return (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                {category}
                {isHighlighted && category !== "Additional Information" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                    Review Needed
                  </span>
                )}
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                {keys.map((key) => {
                  const response = responseMap.get(key);
                  if (!response) return null;

                  const isYes =
                    response.response_type === "boolean" && response.response_value === true;
                  const hasContent =
                    response.response_type === "text" && response.response_value;
                  const hasArrayContent =
                    response.response_type === "array" &&
                    Array.isArray(response.response_value) &&
                    response.response_value.length > 0;

                  // Skip "no" answers for cleaner display, except for itemize_deductions
                  if (
                    response.response_type === "boolean" &&
                    !response.response_value &&
                    key !== "itemize_deductions"
                  ) {
                    return null;
                  }

                  // Skip empty text/array
                  if (response.response_type === "text" && !response.response_value) {
                    return null;
                  }
                  if (
                    response.response_type === "array" &&
                    (!Array.isArray(response.response_value) || response.response_value.length === 0)
                  ) {
                    return null;
                  }

                  // Full width for notes
                  const isFullWidth = key === "additional_notes" || key === "other_deductions";

                  return (
                    <div
                      key={key}
                      className={`${isFullWidth ? "sm:col-span-2" : ""} ${
                        isYes || hasContent || hasArrayContent
                          ? "bg-emerald-50 border border-emerald-200 rounded-lg p-2"
                          : ""
                      }`}
                    >
                      <dt className="text-xs font-medium text-gray-500">
                        {QUESTION_LABELS[key] || key}
                      </dt>
                      <dd
                        className={`text-sm ${
                          isYes || hasContent || hasArrayContent
                            ? "text-emerald-900 font-medium"
                            : "text-gray-900"
                        }`}
                      >
                        {formatValue(response.response_value, response.response_type)}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}
