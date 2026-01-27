-- Migration: Ensure clients table has all spouse/intake columns
-- These columns were added via ALTER TABLE in intake-system.sql
-- but may not exist if that migration wasn't fully run

-- Add missing columns to clients table
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS ssn_encrypted text,
  ADD COLUMN IF NOT EXISTS has_spouse boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS spouse_first_name text,
  ADD COLUMN IF NOT EXISTS spouse_last_name text,
  ADD COLUMN IF NOT EXISTS spouse_dob date,
  ADD COLUMN IF NOT EXISTS spouse_ssn_encrypted text,
  ADD COLUMN IF NOT EXISTS intake_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS intake_completed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS account_created boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pipeline_status text DEFAULT 'new_intake';

-- Add check constraint for pipeline_status if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clients_pipeline_status_check'
  ) THEN
    ALTER TABLE public.clients
      ADD CONSTRAINT clients_pipeline_status_check
      CHECK (pipeline_status IN ('new_intake', 'documents_needed', 'in_preparation', 'ready_for_review', 'filed', 'complete'));
  END IF;
END $$;

-- Make user_id nullable for no-login intake clients (if not already)
ALTER TABLE public.clients
  ALTER COLUMN user_id DROP NOT NULL;
