-- Migration: Fix documents table for intake uploads
-- Ensures the table supports intake form document uploads

-- Make user_id nullable for documents uploaded via intake
ALTER TABLE public.documents
  ALTER COLUMN user_id DROP NOT NULL;

-- Add tax_year column if not exists
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS tax_year integer;

-- Update category check constraint to include all intake categories
ALTER TABLE public.documents
  DROP CONSTRAINT IF EXISTS documents_category_check;

ALTER TABLE public.documents
  ADD CONSTRAINT documents_category_check
  CHECK (category IN (
    'w2', '1099', '1099_nec', '1099_k', '1099_r', 'ssa_1099',
    'schedule_e', 'brokerage_statement', 'crypto_report',
    'receipt', 'prior_return', 'id', 'other',
    'drivers_license', '1098'
  ));

-- Add RLS policy for service role to manage documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage all documents'
  ) THEN
    CREATE POLICY "Service role can manage all documents" ON public.documents
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Ensure the storage bucket exists (run separately if needed)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'client-documents',
--   'client-documents',
--   false,
--   52428800, -- 50MB limit
--   ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/heic']
-- ) ON CONFLICT (id) DO NOTHING;
