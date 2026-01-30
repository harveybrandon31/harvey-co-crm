-- Migration: Create missing tax_returns table
-- The table was defined in schema.sql but never applied to the database.

-- Tax Returns table
CREATE TABLE IF NOT EXISTS public.tax_returns (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  client_id uuid references public.clients(id) on delete cascade not null,

  -- Return Info
  tax_year integer not null,
  return_type text not null check (return_type in ('1040', '1040-SR', '1065', '1120', '1120-S', '990', 'other')),

  -- Status tracking
  status text default 'not_started' check (status in ('not_started', 'in_progress', 'pending_review', 'pending_client', 'ready_to_file', 'filed', 'accepted', 'rejected')),

  -- Important dates
  due_date date,
  extended_due_date date,
  filed_date date,
  accepted_date date,

  -- Financial summary
  total_income numeric(12,2),
  total_deductions numeric(12,2),
  tax_liability numeric(12,2),
  refund_amount numeric(12,2),
  amount_due numeric(12,2),

  -- Fees
  preparation_fee numeric(10,2),
  fee_paid boolean default false,

  notes text,
  user_id uuid references auth.users(id) on delete cascade not null
);

-- Enable RLS
ALTER TABLE public.tax_returns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own tax returns" ON public.tax_returns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tax returns" ON public.tax_returns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tax returns" ON public.tax_returns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tax returns" ON public.tax_returns
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tax_returns_client_id ON public.tax_returns(client_id);
CREATE INDEX IF NOT EXISTS idx_tax_returns_user_id ON public.tax_returns(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_returns_status ON public.tax_returns(status);
CREATE INDEX IF NOT EXISTS idx_tax_returns_tax_year ON public.tax_returns(tax_year);

-- Updated_at trigger
CREATE TRIGGER handle_tax_returns_updated_at
  BEFORE UPDATE ON public.tax_returns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
