export interface ParsedClient {
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  ssn_last_four: string | null;
  filing_status: string | null;
  status: string;
  notes: string | null;
}

export interface ParseResult {
  success: boolean;
  data: ParsedClient[];
  errors: { row: number; message: string }[];
}

const VALID_FILING_STATUSES = [
  "single",
  "married_joint",
  "married_separate",
  "head_of_household",
  "qualifying_widow",
];

const VALID_CLIENT_STATUSES = ["active", "inactive", "prospect"];

const REQUIRED_COLUMNS = ["first_name", "last_name"];

const COLUMN_ALIASES: Record<string, string> = {
  // First name variations
  first_name: "first_name",
  firstname: "first_name",
  "first name": "first_name",
  first: "first_name",

  // Last name variations
  last_name: "last_name",
  lastname: "last_name",
  "last name": "last_name",
  last: "last_name",

  // Email variations
  email: "email",
  "email address": "email",
  "e-mail": "email",

  // Phone variations
  phone: "phone",
  telephone: "phone",
  "phone number": "phone",
  cell: "phone",
  mobile: "phone",

  // Address variations
  address_street: "address_street",
  street: "address_street",
  address: "address_street",
  "street address": "address_street",

  address_city: "address_city",
  city: "address_city",

  address_state: "address_state",
  state: "address_state",

  address_zip: "address_zip",
  zip: "address_zip",
  zipcode: "address_zip",
  "zip code": "address_zip",
  postal: "address_zip",
  "postal code": "address_zip",

  // SSN variations
  ssn_last_four: "ssn_last_four",
  ssn: "ssn_last_four",
  "ssn last 4": "ssn_last_four",
  "last 4 ssn": "ssn_last_four",

  // Filing status variations
  filing_status: "filing_status",
  "filing status": "filing_status",

  // Status variations
  status: "status",
  "client status": "status",

  // Notes variations
  notes: "notes",
  note: "notes",
  comments: "notes",
  comment: "notes",
};

function normalizeColumnName(name: string): string {
  const normalized = name.toLowerCase().trim();
  return COLUMN_ALIASES[normalized] || normalized;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function validateFilingStatus(value: string | null): string | null {
  if (!value) return null;

  const normalized = value.toLowerCase().replace(/[\s-]/g, "_");

  // Handle common variations
  const mappings: Record<string, string> = {
    single: "single",
    married_joint: "married_joint",
    married_filing_jointly: "married_joint",
    mfj: "married_joint",
    married_separate: "married_separate",
    married_filing_separately: "married_separate",
    mfs: "married_separate",
    head_of_household: "head_of_household",
    hoh: "head_of_household",
    qualifying_widow: "qualifying_widow",
    qualifying_widower: "qualifying_widow",
    qw: "qualifying_widow",
  };

  const mapped = mappings[normalized];
  return mapped && VALID_FILING_STATUSES.includes(mapped) ? mapped : null;
}

function validateClientStatus(value: string | null): string {
  if (!value) return "active";

  const normalized = value.toLowerCase().trim();
  return VALID_CLIENT_STATUSES.includes(normalized) ? normalized : "active";
}

function validateSSN(value: string | null): string | null {
  if (!value) return null;

  // Extract only digits
  const digits = value.replace(/\D/g, "");

  // If full SSN provided, take last 4
  if (digits.length >= 4) {
    return digits.slice(-4);
  }

  return null;
}

export function parseCSV(content: string): ParseResult {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length < 2) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, message: "CSV must have a header row and at least one data row" }],
    };
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]).map(normalizeColumnName);

  // Check for required columns
  const missingColumns = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missingColumns.length > 0) {
    return {
      success: false,
      data: [],
      errors: [
        {
          row: 0,
          message: `Missing required columns: ${missingColumns.join(", ")}. Required: first_name, last_name`,
        },
      ],
    };
  }

  const data: ParsedClient[] = [];
  const errors: { row: number; message: string }[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const rowData: Record<string, string> = {};

    headers.forEach((header, index) => {
      rowData[header] = values[index] || "";
    });

    // Validate required fields
    if (!rowData.first_name?.trim()) {
      errors.push({ row: i + 1, message: "Missing first name" });
      continue;
    }

    if (!rowData.last_name?.trim()) {
      errors.push({ row: i + 1, message: "Missing last name" });
      continue;
    }

    // Build client object
    const client: ParsedClient = {
      first_name: rowData.first_name.trim(),
      last_name: rowData.last_name.trim(),
      email: rowData.email?.trim() || null,
      phone: rowData.phone?.trim() || null,
      address_street: rowData.address_street?.trim() || null,
      address_city: rowData.address_city?.trim() || null,
      address_state: rowData.address_state?.trim()?.toUpperCase()?.slice(0, 2) || null,
      address_zip: rowData.address_zip?.trim() || null,
      ssn_last_four: validateSSN(rowData.ssn_last_four),
      filing_status: validateFilingStatus(rowData.filing_status),
      status: validateClientStatus(rowData.status),
      notes: rowData.notes?.trim() || null,
    };

    // Validate email format if provided
    if (client.email && !isValidEmail(client.email)) {
      errors.push({ row: i + 1, message: `Invalid email format: ${client.email}` });
      continue;
    }

    data.push(client);
  }

  return {
    success: errors.length === 0,
    data,
    errors,
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function generateSampleCSV(): string {
  const headers = [
    "first_name",
    "last_name",
    "email",
    "phone",
    "address_street",
    "address_city",
    "address_state",
    "address_zip",
    "ssn_last_four",
    "filing_status",
    "status",
    "notes",
  ];

  const sampleData = [
    [
      "John",
      "Smith",
      "john.smith@email.com",
      "555-123-4567",
      "123 Main St",
      "Austin",
      "TX",
      "78701",
      "1234",
      "married_joint",
      "active",
      "New client referred by Jane Doe",
    ],
    [
      "Jane",
      "Doe",
      "jane.doe@email.com",
      "555-987-6543",
      "456 Oak Ave",
      "Houston",
      "TX",
      "77001",
      "5678",
      "single",
      "active",
      "",
    ],
  ];

  return [headers.join(","), ...sampleData.map((row) => row.join(","))].join("\n");
}
