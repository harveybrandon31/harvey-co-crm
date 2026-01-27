-- Migration: Fix intake_responses table schema
-- The original schema used denormalized columns (has_w2_income, etc.)
-- but the application code expects a normalized key-value structure
-- with question_key, response_value, response_type columns.

-- ============================================
-- STEP 1: Drop existing intake_responses table and recreate
-- ============================================

-- Drop existing table (this will cascade delete any data)
DROP TABLE IF EXISTS public.intake_responses CASCADE;

-- Recreate with the normalized structure that matches the application code
CREATE TABLE public.intake_responses (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  tax_year integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer,

  -- Normalized key-value structure
  step_number integer,
  question_key text NOT NULL,
  response_value jsonb, -- Using JSONB to store various types (boolean, number, string, array)
  response_type text NOT NULL CHECK (response_type IN ('boolean', 'number', 'text', 'array'))
);

-- ============================================
-- STEP 2: Enable RLS
-- ============================================

ALTER TABLE public.intake_responses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: RLS Policies
-- ============================================

-- Users can view intake responses of clients they created
CREATE POLICY "Users can view intake responses of own clients" ON public.intake_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = intake_responses.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- Users can manage intake responses of their own clients
CREATE POLICY "Users can manage intake responses of own clients" ON public.intake_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = intake_responses.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- Allow service role full access (needed for API submissions)
CREATE POLICY "Service role can manage all intake responses" ON public.intake_responses
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- STEP 4: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_intake_responses_client_id ON public.intake_responses(client_id);
CREATE INDEX IF NOT EXISTS idx_intake_responses_tax_year ON public.intake_responses(tax_year);
CREATE INDEX IF NOT EXISTS idx_intake_responses_question_key ON public.intake_responses(question_key);
CREATE INDEX IF NOT EXISTS idx_intake_responses_client_year ON public.intake_responses(client_id, tax_year);

-- ============================================
-- STEP 5: Trigger for updated_at
-- ============================================

DROP TRIGGER IF EXISTS handle_intake_responses_updated_at ON public.intake_responses;
CREATE TRIGGER handle_intake_responses_updated_at
  BEFORE UPDATE ON public.intake_responses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- NOTE: After running this migration, Whitney
-- (and any other clients) will need to re-submit
-- their intake forms to have data in the new format.
-- ============================================
