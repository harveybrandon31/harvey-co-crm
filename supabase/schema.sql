-- Harvey & Co Financial Services CRM Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Clients table
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Basic Info
  first_name text not null,
  last_name text not null,
  email text,
  phone text,

  -- Address
  address_street text,
  address_city text,
  address_state text,
  address_zip text,

  -- Tax Info
  ssn_last_four text, -- Store only last 4 digits for reference
  filing_status text check (filing_status in ('single', 'married_joint', 'married_separate', 'head_of_household', 'qualifying_widow')),

  -- Status
  status text default 'active' check (status in ('active', 'inactive', 'prospect')),

  -- Notes
  notes text,

  -- Owner (the user who created/manages this client)
  user_id uuid references auth.users(id) on delete cascade not null
);

-- Tax Returns table
create table public.tax_returns (
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

-- Documents table (metadata - files stored in Supabase Storage)
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  client_id uuid references public.clients(id) on delete cascade not null,
  tax_return_id uuid references public.tax_returns(id) on delete set null,

  -- File info
  name text not null,
  file_path text not null,
  file_type text,
  file_size integer,

  -- Categorization
  category text check (category in ('w2', '1099', 'receipt', 'prior_return', 'id', 'other')),

  -- Upload info
  uploaded_by uuid references auth.users(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade not null
);

-- Activity Log for tracking actions
create table public.activity_log (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  user_id uuid references auth.users(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade,
  tax_return_id uuid references public.tax_returns(id) on delete cascade,

  action text not null,
  description text,
  metadata jsonb
);

-- Enable Row Level Security
alter table public.clients enable row level security;
alter table public.tax_returns enable row level security;
alter table public.documents enable row level security;
alter table public.activity_log enable row level security;

-- RLS Policies: Users can only see their own data
create policy "Users can view own clients" on public.clients
  for select using (auth.uid() = user_id);

create policy "Users can insert own clients" on public.clients
  for insert with check (auth.uid() = user_id);

create policy "Users can update own clients" on public.clients
  for update using (auth.uid() = user_id);

create policy "Users can delete own clients" on public.clients
  for delete using (auth.uid() = user_id);

-- Tax Returns policies
create policy "Users can view own tax returns" on public.tax_returns
  for select using (auth.uid() = user_id);

create policy "Users can insert own tax returns" on public.tax_returns
  for insert with check (auth.uid() = user_id);

create policy "Users can update own tax returns" on public.tax_returns
  for update using (auth.uid() = user_id);

create policy "Users can delete own tax returns" on public.tax_returns
  for delete using (auth.uid() = user_id);

-- Documents policies
create policy "Users can view own documents" on public.documents
  for select using (auth.uid() = user_id);

create policy "Users can insert own documents" on public.documents
  for insert with check (auth.uid() = user_id);

create policy "Users can update own documents" on public.documents
  for update using (auth.uid() = user_id);

create policy "Users can delete own documents" on public.documents
  for delete using (auth.uid() = user_id);

-- Activity Log policies
create policy "Users can view own activity" on public.activity_log
  for select using (auth.uid() = user_id);

create policy "Users can insert own activity" on public.activity_log
  for insert with check (auth.uid() = user_id);

-- Create indexes for better query performance
create index idx_clients_user_id on public.clients(user_id);
create index idx_clients_status on public.clients(status);
create index idx_tax_returns_client_id on public.tax_returns(client_id);
create index idx_tax_returns_user_id on public.tax_returns(user_id);
create index idx_tax_returns_status on public.tax_returns(status);
create index idx_tax_returns_tax_year on public.tax_returns(tax_year);
create index idx_documents_client_id on public.documents(client_id);
create index idx_documents_tax_return_id on public.documents(tax_return_id);
create index idx_activity_log_user_id on public.activity_log(user_id);
create index idx_activity_log_client_id on public.activity_log(client_id);

-- Function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger handle_clients_updated_at
  before update on public.clients
  for each row execute function public.handle_updated_at();

create trigger handle_tax_returns_updated_at
  before update on public.tax_returns
  for each row execute function public.handle_updated_at();

-- Storage bucket for documents (run this separately in Supabase Dashboard > Storage)
-- insert into storage.buckets (id, name, public) values ('documents', 'documents', false);
