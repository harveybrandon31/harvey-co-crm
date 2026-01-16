-- Invoices Schema for Harvey & Co CRM
-- Run this in your Supabase SQL Editor after the initial schema

-- Invoices table
create table public.invoices (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Invoice number (auto-generated, user-friendly)
  invoice_number text not null unique,

  -- Relations
  client_id uuid references public.clients(id) on delete cascade not null,
  tax_return_id uuid references public.tax_returns(id) on delete set null,

  -- Invoice details
  issue_date date not null default current_date,
  due_date date not null,

  -- Status
  status text default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')),

  -- Line items stored as JSONB
  line_items jsonb not null default '[]'::jsonb,

  -- Totals
  subtotal numeric(10,2) not null default 0,
  tax_rate numeric(5,2) default 0,
  tax_amount numeric(10,2) default 0,
  total numeric(10,2) not null default 0,

  -- Payment info
  paid_date date,
  paid_amount numeric(10,2),
  payment_method text,

  -- Notes
  notes text,

  -- Owner
  user_id uuid references auth.users(id) on delete cascade not null
);

-- Enable RLS
alter table public.invoices enable row level security;

-- RLS Policies
create policy "Users can view own invoices" on public.invoices
  for select using (auth.uid() = user_id);

create policy "Users can insert own invoices" on public.invoices
  for insert with check (auth.uid() = user_id);

create policy "Users can update own invoices" on public.invoices
  for update using (auth.uid() = user_id);

create policy "Users can delete own invoices" on public.invoices
  for delete using (auth.uid() = user_id);

-- Indexes
create index idx_invoices_user_id on public.invoices(user_id);
create index idx_invoices_client_id on public.invoices(client_id);
create index idx_invoices_status on public.invoices(status);
create index idx_invoices_invoice_number on public.invoices(invoice_number);

-- Trigger for updated_at
create trigger handle_invoices_updated_at
  before update on public.invoices
  for each row execute function public.handle_updated_at();

-- Function to generate invoice numbers
create or replace function generate_invoice_number()
returns text as $$
declare
  year_prefix text;
  next_num integer;
  new_invoice_number text;
begin
  year_prefix := to_char(current_date, 'YYYY');

  -- Get the highest invoice number for this year
  select coalesce(max(
    cast(substring(invoice_number from 6) as integer)
  ), 0) + 1
  into next_num
  from public.invoices
  where invoice_number like year_prefix || '-%';

  -- Format: YYYY-0001
  new_invoice_number := year_prefix || '-' || lpad(next_num::text, 4, '0');

  return new_invoice_number;
end;
$$ language plpgsql;
