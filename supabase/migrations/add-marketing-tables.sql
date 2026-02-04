-- Marketing Hub: Campaigns and Recipients
-- Run this migration in Supabase SQL editor

-- Campaigns table
create table if not exists public.campaigns (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  name text not null,
  description text,
  type text not null check (type in ('email', 'sms', 'both')),
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),

  -- Content
  subject text,           -- email subject line
  email_body text,        -- email HTML body
  sms_body text,          -- SMS message body

  -- Targeting
  audience_filter jsonb,  -- filter criteria for audience selection
  audience_count integer default 0,

  -- Scheduling
  scheduled_at timestamp with time zone,
  sent_at timestamp with time zone,

  -- Stats
  total_recipients integer default 0,
  delivered_count integer default 0,
  opened_count integer default 0,
  clicked_count integer default 0,
  bounced_count integer default 0,
  failed_count integer default 0,

  -- Creator
  created_by uuid references auth.users(id) on delete set null
);

-- Campaign recipients table
create table if not exists public.campaign_recipients (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,

  -- Delivery info
  channel text not null check (channel in ('email', 'sms')),
  status text not null default 'pending' check (status in ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,

  -- Error tracking
  error_message text,

  -- External IDs for tracking
  external_id text,       -- Twilio SID or Resend ID

  unique(campaign_id, client_id, channel)
);

-- Indexes
create index if not exists idx_campaigns_status on public.campaigns(status);
create index if not exists idx_campaigns_created_at on public.campaigns(created_at desc);
create index if not exists idx_campaign_recipients_campaign on public.campaign_recipients(campaign_id);
create index if not exists idx_campaign_recipients_client on public.campaign_recipients(client_id);
create index if not exists idx_campaign_recipients_status on public.campaign_recipients(status);

-- RLS
alter table public.campaigns enable row level security;
alter table public.campaign_recipients enable row level security;

-- Policies: authenticated users can manage campaigns
create policy "Authenticated users can view campaigns"
  on public.campaigns for select
  to authenticated
  using (true);

create policy "Authenticated users can create campaigns"
  on public.campaigns for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update campaigns"
  on public.campaigns for update
  to authenticated
  using (true);

create policy "Authenticated users can delete campaigns"
  on public.campaigns for delete
  to authenticated
  using (true);

create policy "Authenticated users can view campaign recipients"
  on public.campaign_recipients for select
  to authenticated
  using (true);

create policy "Authenticated users can manage campaign recipients"
  on public.campaign_recipients for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update campaign recipients"
  on public.campaign_recipients for update
  to authenticated
  using (true);
