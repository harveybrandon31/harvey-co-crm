-- Campaign Enrollments Table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS campaign_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  campaign_name VARCHAR(100) NOT NULL DEFAULT 'tax_season_2025',
  intake_link_id UUID REFERENCES intake_links(id),
  current_stage INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_email_sent_at TIMESTAMPTZ,
  next_email_due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('active', 'completed', 'unsubscribed', 'paused')),
  CONSTRAINT valid_stage CHECK (current_stage BETWEEN 1 AND 3),

  -- Prevent duplicate enrollments for same campaign
  UNIQUE(client_id, campaign_name)
);

-- Index for efficient cron queries
CREATE INDEX idx_campaign_enrollments_next_due
ON campaign_enrollments(next_email_due_at)
WHERE status = 'active';

-- Index for client lookups
CREATE INDEX idx_campaign_enrollments_client
ON campaign_enrollments(client_id);

-- Enable RLS
ALTER TABLE campaign_enrollments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all enrollments (since this is a single-user system)
CREATE POLICY "Users can view campaign enrollments" ON campaign_enrollments
  FOR SELECT USING (true);

-- Policy: Users can insert enrollments
CREATE POLICY "Users can insert campaign enrollments" ON campaign_enrollments
  FOR INSERT WITH CHECK (true);

-- Policy: Users can update enrollments
CREATE POLICY "Users can update campaign enrollments" ON campaign_enrollments
  FOR UPDATE USING (true);

-- Policy: Users can delete enrollments
CREATE POLICY "Users can delete campaign enrollments" ON campaign_enrollments
  FOR DELETE USING (true);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_campaign_enrollment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER campaign_enrollments_updated_at
  BEFORE UPDATE ON campaign_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_enrollment_timestamp();
