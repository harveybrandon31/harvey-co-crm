// Document suggestion logic based on intake responses

export interface SuggestedDocument {
  id: string;
  name: string;
  category: string;
  description: string;
  priority: "required" | "recommended" | "optional";
  reason?: string;
}

export interface IntakeAnswers {
  hasW2Income?: boolean;
  w2EmployerCount?: number;
  has1099Income?: boolean;
  hasCryptoTransactions?: boolean;
  hasStockSales?: boolean;
  hasRentalIncome?: boolean;
  hasForeignIncome?: boolean;
  itemizeDeductions?: boolean;
  hasMortgageInterest?: boolean;
  hasCharitableDonations?: boolean;
  hasStudentLoanInterest?: boolean;
  hasMedicalExpenses?: boolean;
  hasBusinessExpenses?: boolean;
  hasChildcare?: boolean;
  hasEducationExpenses?: boolean;
  hasSpouse?: boolean;
  dependentCount?: number;
}

export function generateDocumentSuggestions(answers: IntakeAnswers): SuggestedDocument[] {
  const suggestions: SuggestedDocument[] = [];

  // Always recommend these
  suggestions.push({
    id: "drivers_license",
    name: "Driver's License / Photo ID",
    category: "id",
    description: "Valid photo identification for identity verification",
    priority: "required",
  });

  suggestions.push({
    id: "prior_return",
    name: "Prior Year Tax Return",
    category: "prior_return",
    description: "Last year's complete tax return (all pages)",
    priority: "recommended",
    reason: "Helps ensure consistency and may reveal carryover items",
  });

  // W-2 Income
  if (answers.hasW2Income) {
    const count = answers.w2EmployerCount || 1;
    for (let i = 1; i <= count; i++) {
      suggestions.push({
        id: `w2_${i}`,
        name: count > 1 ? `W-2 Form (Employer ${i})` : "W-2 Form",
        category: "w2",
        description: "Wage and tax statement from employer",
        priority: "required",
      });
    }
  }

  // 1099 Income
  if (answers.has1099Income) {
    suggestions.push({
      id: "1099_nec",
      name: "1099-NEC Forms",
      category: "1099",
      description: "Nonemployee compensation (freelance/contractor income)",
      priority: "required",
    });
    suggestions.push({
      id: "1099_misc",
      name: "1099-MISC Forms",
      category: "1099",
      description: "Miscellaneous income",
      priority: "recommended",
    });
  }

  // Stock/Investment Sales
  if (answers.hasStockSales) {
    suggestions.push({
      id: "1099_b",
      name: "1099-B Forms",
      category: "1099",
      description: "Proceeds from broker and barter exchange transactions",
      priority: "required",
    });
    suggestions.push({
      id: "brokerage_statement",
      name: "Year-End Brokerage Statement",
      category: "brokerage",
      description: "Consolidated statement showing all investment transactions",
      priority: "required",
    });
  }

  // Cryptocurrency
  if (answers.hasCryptoTransactions) {
    suggestions.push({
      id: "crypto_report",
      name: "Cryptocurrency Transaction Report",
      category: "crypto",
      description: "Export from exchange showing all crypto transactions",
      priority: "required",
      reason: "Needed to calculate capital gains/losses on crypto",
    });
    suggestions.push({
      id: "1099_da",
      name: "1099-DA Forms (if received)",
      category: "1099",
      description: "Digital asset transaction statements from exchanges",
      priority: "recommended",
    });
  }

  // Rental Income
  if (answers.hasRentalIncome) {
    suggestions.push({
      id: "rental_income",
      name: "Rental Income Records",
      category: "rental",
      description: "Documentation of all rental income received",
      priority: "required",
    });
    suggestions.push({
      id: "rental_expenses",
      name: "Rental Expense Records",
      category: "rental",
      description: "Receipts and records for property expenses, repairs, maintenance",
      priority: "required",
    });
    suggestions.push({
      id: "property_tax_statements",
      name: "Property Tax Statements",
      category: "rental",
      description: "Annual property tax statements for rental properties",
      priority: "required",
    });
  }

  // Foreign Income
  if (answers.hasForeignIncome) {
    suggestions.push({
      id: "foreign_income",
      name: "Foreign Income Documentation",
      category: "foreign",
      description: "Records of income earned from foreign sources",
      priority: "required",
    });
    suggestions.push({
      id: "fbar_records",
      name: "Foreign Bank Account Records",
      category: "foreign",
      description: "Statements for foreign accounts (needed if total exceeds $10,000)",
      priority: "required",
      reason: "May require FBAR filing",
    });
  }

  // Mortgage Interest
  if (answers.hasMortgageInterest) {
    suggestions.push({
      id: "1098_mortgage",
      name: "Form 1098 (Mortgage Interest)",
      category: "1098",
      description: "Mortgage interest statement from lender",
      priority: "required",
    });
  }

  // Student Loan Interest
  if (answers.hasStudentLoanInterest) {
    suggestions.push({
      id: "1098_e",
      name: "Form 1098-E (Student Loan Interest)",
      category: "1098",
      description: "Student loan interest statement",
      priority: "required",
    });
  }

  // Charitable Donations
  if (answers.hasCharitableDonations) {
    suggestions.push({
      id: "charitable_receipts",
      name: "Charitable Donation Receipts",
      category: "deduction",
      description: "Receipts and acknowledgment letters from charities",
      priority: "required",
    });
  }

  // Medical Expenses
  if (answers.hasMedicalExpenses && answers.itemizeDeductions) {
    suggestions.push({
      id: "medical_receipts",
      name: "Medical Expense Records",
      category: "deduction",
      description: "Receipts for medical expenses, health insurance premiums",
      priority: "recommended",
      reason: "Only deductible if exceeding 7.5% of AGI",
    });
  }

  // Business Expenses
  if (answers.hasBusinessExpenses) {
    suggestions.push({
      id: "business_expenses",
      name: "Business Expense Records",
      category: "business",
      description: "Receipts and records for business-related expenses",
      priority: "required",
    });
    suggestions.push({
      id: "mileage_log",
      name: "Vehicle Mileage Log",
      category: "business",
      description: "Log of business miles driven",
      priority: "recommended",
    });
    suggestions.push({
      id: "home_office",
      name: "Home Office Documentation",
      category: "business",
      description: "Square footage calculations, utility bills if claiming home office",
      priority: "optional",
    });
  }

  // Childcare
  if (answers.hasChildcare) {
    suggestions.push({
      id: "childcare_receipts",
      name: "Childcare Expense Records",
      category: "deduction",
      description: "Receipts and provider tax ID for childcare expenses",
      priority: "required",
      reason: "Needed for Child and Dependent Care Credit",
    });
  }

  // Education Expenses
  if (answers.hasEducationExpenses) {
    suggestions.push({
      id: "1098_t",
      name: "Form 1098-T (Tuition Statement)",
      category: "1098",
      description: "Tuition statement from educational institution",
      priority: "required",
    });
    suggestions.push({
      id: "education_receipts",
      name: "Education Expense Receipts",
      category: "education",
      description: "Receipts for books, supplies, and required materials",
      priority: "recommended",
    });
  }

  // Spouse Documents
  if (answers.hasSpouse) {
    suggestions.push({
      id: "spouse_id",
      name: "Spouse's Driver's License / Photo ID",
      category: "id",
      description: "Valid photo identification for spouse",
      priority: "required",
    });
  }

  // Dependents (Social Security cards)
  if (answers.dependentCount && answers.dependentCount > 0) {
    suggestions.push({
      id: "dependent_ssn",
      name: "Dependent Social Security Cards",
      category: "id",
      description: `Social Security cards for all ${answers.dependentCount} dependent(s)`,
      priority: "required",
    });
  }

  return suggestions;
}

export function getDocumentsByPriority(documents: SuggestedDocument[]) {
  return {
    required: documents.filter(d => d.priority === "required"),
    recommended: documents.filter(d => d.priority === "recommended"),
    optional: documents.filter(d => d.priority === "optional"),
  };
}
