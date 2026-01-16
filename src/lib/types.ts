export type ClientStatus = "active" | "inactive" | "prospect";

export type FilingStatus =
  | "single"
  | "married_joint"
  | "married_separate"
  | "head_of_household"
  | "qualifying_widow";

export type ReturnType =
  | "1040"
  | "1040-SR"
  | "1065"
  | "1120"
  | "1120-S"
  | "990"
  | "other";

export type ReturnStatus =
  | "not_started"
  | "in_progress"
  | "pending_review"
  | "pending_client"
  | "ready_to_file"
  | "filed"
  | "accepted"
  | "rejected";

export type DocumentCategory =
  | "w2"
  | "1099"
  | "receipt"
  | "prior_return"
  | "id"
  | "other";

export interface Client {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  ssn_last_four: string | null;
  filing_status: FilingStatus | null;
  status: ClientStatus;
  notes: string | null;
  user_id: string;
}

export interface TaxReturn {
  id: string;
  created_at: string;
  updated_at: string;
  client_id: string;
  tax_year: number;
  return_type: ReturnType;
  status: ReturnStatus;
  due_date: string | null;
  extended_due_date: string | null;
  filed_date: string | null;
  accepted_date: string | null;
  total_income: number | null;
  total_deductions: number | null;
  tax_liability: number | null;
  refund_amount: number | null;
  amount_due: number | null;
  preparation_fee: number | null;
  fee_paid: boolean;
  notes: string | null;
  user_id: string;
}

export interface Document {
  id: string;
  created_at: string;
  client_id: string;
  tax_return_id: string | null;
  name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  category: DocumentCategory | null;
  uploaded_by: string | null;
  user_id: string;
}

export interface ActivityLog {
  id: string;
  created_at: string;
  user_id: string;
  client_id: string | null;
  tax_return_id: string | null;
  action: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Invoice {
  id: string;
  created_at: string;
  updated_at: string;
  invoice_number: string;
  client_id: string;
  tax_return_id: string | null;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  line_items: InvoiceLineItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  paid_date: string | null;
  paid_amount: number | null;
  payment_method: string | null;
  notes: string | null;
  user_id: string;
}
