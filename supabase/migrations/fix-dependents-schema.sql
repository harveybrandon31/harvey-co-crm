-- Migration: Fix dependents table schema
-- The original schema used different column names than the application expects.
-- The app expects: first_name, last_name, ssn_encrypted, relationship (flexible), months_lived_with
-- The schema had: full_name, lived_with_more_than_half_year, relationship (constrained)

-- ============================================
-- STEP 1: Drop and recreate dependents table
-- ============================================

DROP TABLE IF EXISTS public.dependents CASCADE;

CREATE TABLE public.dependents (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,

  -- Name fields (matching API expectations)
  first_name text NOT NULL,
  last_name text NOT NULL,

  -- Personal info
  date_of_birth date,
  ssn_encrypted text, -- Encrypted SSN

  -- Relationship - flexible text to match form values (son, daughter, stepson, etc.)
  relationship text,

  -- Living situation
  months_lived_with integer DEFAULT 12,

  -- For tax purposes (optional fields for future use)
  is_student boolean DEFAULT false,
  is_disabled boolean DEFAULT false
);

-- ============================================
-- STEP 2: Enable RLS
-- ============================================

ALTER TABLE public.dependents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: RLS Policies
-- ============================================

-- Users can view dependents of their own clients
CREATE POLICY "Users can view dependents of own clients" ON public.dependents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = dependents.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- Users can insert dependents for their own clients
CREATE POLICY "Users can insert dependents for own clients" ON public.dependents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = dependents.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- Users can update dependents of their own clients
CREATE POLICY "Users can update dependents of own clients" ON public.dependents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = dependents.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- Users can delete dependents of their own clients
CREATE POLICY "Users can delete dependents of own clients" ON public.dependents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = dependents.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- Service role can manage all dependents (needed for API submissions)
CREATE POLICY "Service role can manage all dependents" ON public.dependents
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- STEP 4: Create index for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_dependents_client_id ON public.dependents(client_id);

-- ============================================
-- NOTE: After running this migration, clients
-- will need to re-submit their intake forms
-- to have dependent data saved correctly.
-- ============================================
