-- Harvey & Co Tax Client Intake System Schema
-- Run this in your Supabase SQL Editor after the initial schema
-- This extends the existing tables and adds new ones for the intake system

-- ============================================
-- STEP 1: Extend the clients table
-- ============================================

-- Add new columns to existing clients table
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS ssn_encrypted text, -- Full SSN encrypted at app level
  ADD COLUMN IF NOT EXISTS has_spouse boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS spouse_first_name text,
  ADD COLUMN IF NOT EXISTS spouse_last_name text,
  ADD COLUMN IF NOT EXISTS spouse_dob date,
  ADD COLUMN IF NOT EXISTS spouse_ssn_encrypted text,
  ADD COLUMN IF NOT EXISTS intake_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS intake_completed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS account_created boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pipeline_status text DEFAULT 'new_intake';

-- Add check constraint for pipeline_status
ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_pipeline_status_check;
ALTER TABLE public.clients
  ADD CONSTRAINT clients_pipeline_status_check
  CHECK (pipeline_status IN ('new_intake', 'documents_needed', 'in_preparation', 'ready_for_review', 'filed', 'complete'));

-- Make user_id nullable for no-login intake clients
ALTER TABLE public.clients
  ALTER COLUMN user_id DROP NOT NULL;

-- ============================================
-- STEP 2: Create dependents table
-- ============================================

CREATE TABLE IF NOT EXISTS public.dependents (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,

  -- Name fields
  first_name text NOT NULL,
  last_name text NOT NULL,

  -- Personal info
  date_of_birth date,
  ssn_encrypted text, -- Encrypted SSN

  -- Relationship - flexible text to match form values
  relationship text,

  -- Living situation
  months_lived_with integer DEFAULT 12,

  -- For tax purposes
  is_student boolean DEFAULT false,
  is_disabled boolean DEFAULT false
);

-- ============================================
-- STEP 3: Create intake_responses table
-- ============================================

-- Using a normalized key-value structure to store intake responses
-- This allows flexibility in the questions asked without schema changes
CREATE TABLE IF NOT EXISTS public.intake_responses (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  tax_year integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer,

  -- Normalized key-value structure
  step_number integer,
  question_key text NOT NULL,
  response_value jsonb, -- Stores various types: boolean, number, string, array
  response_type text NOT NULL CHECK (response_type IN ('boolean', 'number', 'text', 'array'))
);

-- ============================================
-- STEP 4: Create intake_links table
-- ============================================

CREATE TABLE IF NOT EXISTS public.intake_links (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Link can be for new client or existing client
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,

  -- Secure token for the link
  token text UNIQUE NOT NULL,

  -- Who this link was sent to
  email text,

  -- Expiration and usage tracking
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,

  -- Who created this link (the preparer)
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Optional: pre-fill client name
  prefill_first_name text,
  prefill_last_name text
);

-- ============================================
-- STEP 5: Create tasks table
-- ============================================

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,

  title text NOT NULL,
  description text,

  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  due_date date,
  completed_at timestamp with time zone,

  -- Who owns this task
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================
-- STEP 6: Update documents table for intake
-- ============================================

-- Add document category options for intake
ALTER TABLE public.documents
  DROP CONSTRAINT IF EXISTS documents_category_check;
ALTER TABLE public.documents
  ADD CONSTRAINT documents_category_check
  CHECK (category IN ('w2', '1099', '1099_nec', '1099_k', '1099_r', 'ssa_1099', 'schedule_e', 'brokerage_statement', 'crypto_report', 'receipt', 'prior_return', 'id', 'other'));

-- Make user_id nullable for documents uploaded via intake
ALTER TABLE public.documents
  ALTER COLUMN user_id DROP NOT NULL;

-- Add tax_year column if not exists
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS tax_year integer;

-- ============================================
-- STEP 7: Enable RLS on new tables
-- ============================================

ALTER TABLE public.dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 8: RLS Policies for dependents
-- ============================================

-- Admins can manage dependents through client ownership
CREATE POLICY "Users can view dependents of own clients" ON public.dependents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = dependents.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert dependents for own clients" ON public.dependents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = dependents.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update dependents of own clients" ON public.dependents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = dependents.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete dependents of own clients" ON public.dependents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = dependents.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- Allow intake link access to insert dependents
CREATE POLICY "Intake links can insert dependents" ON public.dependents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.intake_links
      WHERE intake_links.client_id = dependents.client_id
      AND intake_links.used_at IS NULL
      AND intake_links.expires_at > now()
    )
  );

-- Allow service role full access (needed for API submissions)
CREATE POLICY "Service role can manage all dependents" ON public.dependents
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- STEP 9: RLS Policies for intake_responses
-- ============================================

CREATE POLICY "Users can view intake responses of own clients" ON public.intake_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = intake_responses.client_id
      AND clients.user_id = auth.uid()
    )
  );

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
-- STEP 10: RLS Policies for intake_links
-- ============================================

CREATE POLICY "Users can view own intake links" ON public.intake_links
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create intake links" ON public.intake_links
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own intake links" ON public.intake_links
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own intake links" ON public.intake_links
  FOR DELETE USING (created_by = auth.uid());

-- ============================================
-- STEP 11: RLS Policies for tasks
-- ============================================

CREATE POLICY "Users can view tasks they created or are assigned to" ON public.tasks
  FOR SELECT USING (
    created_by = auth.uid() OR assigned_to = auth.uid()
  );

CREATE POLICY "Users can insert tasks" ON public.tasks
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update tasks they created or are assigned to" ON public.tasks
  FOR UPDATE USING (
    created_by = auth.uid() OR assigned_to = auth.uid()
  );

CREATE POLICY "Users can delete own tasks" ON public.tasks
  FOR DELETE USING (created_by = auth.uid());

-- ============================================
-- STEP 12: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_dependents_client_id ON public.dependents(client_id);
CREATE INDEX IF NOT EXISTS idx_intake_responses_client_id ON public.intake_responses(client_id);
CREATE INDEX IF NOT EXISTS idx_intake_responses_tax_year ON public.intake_responses(tax_year);
CREATE INDEX IF NOT EXISTS idx_intake_responses_question_key ON public.intake_responses(question_key);
CREATE INDEX IF NOT EXISTS idx_intake_responses_client_year ON public.intake_responses(client_id, tax_year);
CREATE INDEX IF NOT EXISTS idx_intake_links_token ON public.intake_links(token);
CREATE INDEX IF NOT EXISTS idx_intake_links_expires_at ON public.intake_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_intake_links_client_id ON public.intake_links(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON public.tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_clients_pipeline_status ON public.clients(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_clients_intake_completed ON public.clients(intake_completed);

-- ============================================
-- STEP 13: Triggers for updated_at
-- ============================================

CREATE TRIGGER handle_intake_responses_updated_at
  BEFORE UPDATE ON public.intake_responses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- STEP 14: Function to generate secure tokens
-- ============================================

CREATE OR REPLACE FUNCTION generate_intake_token()
RETURNS text AS $$
DECLARE
  token text;
BEGIN
  -- Generate a URL-safe random token (22 chars, ~131 bits of entropy)
  token := encode(gen_random_bytes(16), 'base64');
  -- Replace URL-unsafe characters
  token := replace(replace(replace(token, '+', '-'), '/', '_'), '=', '');
  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 15: Function to create intake link
-- ============================================

CREATE OR REPLACE FUNCTION create_intake_link(
  p_email text DEFAULT NULL,
  p_client_id uuid DEFAULT NULL,
  p_prefill_first_name text DEFAULT NULL,
  p_prefill_last_name text DEFAULT NULL,
  p_expires_days integer DEFAULT 7
)
RETURNS TABLE(id uuid, token text, expires_at timestamp with time zone) AS $$
DECLARE
  v_token text;
  v_expires_at timestamp with time zone;
  v_id uuid;
BEGIN
  v_token := generate_intake_token();
  v_expires_at := now() + (p_expires_days || ' days')::interval;

  INSERT INTO public.intake_links (
    token,
    email,
    client_id,
    prefill_first_name,
    prefill_last_name,
    expires_at,
    created_by
  ) VALUES (
    v_token,
    p_email,
    p_client_id,
    p_prefill_first_name,
    p_prefill_last_name,
    v_expires_at,
    auth.uid()
  ) RETURNING intake_links.id INTO v_id;

  RETURN QUERY SELECT v_id, v_token, v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 16: Function to validate intake link
-- ============================================

CREATE OR REPLACE FUNCTION validate_intake_link(p_token text)
RETURNS TABLE(
  is_valid boolean,
  link_id uuid,
  client_id uuid,
  email text,
  prefill_first_name text,
  prefill_last_name text,
  error_message text
) AS $$
DECLARE
  v_link public.intake_links%ROWTYPE;
BEGIN
  -- Look up the link
  SELECT * INTO v_link
  FROM public.intake_links
  WHERE intake_links.token = p_token;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::uuid, NULL::text, NULL::text, NULL::text, 'Link not found'::text;
    RETURN;
  END IF;

  IF v_link.used_at IS NOT NULL THEN
    RETURN QUERY SELECT false, v_link.id, v_link.client_id, v_link.email, v_link.prefill_first_name, v_link.prefill_last_name, 'Link has already been used'::text;
    RETURN;
  END IF;

  IF v_link.expires_at < now() THEN
    RETURN QUERY SELECT false, v_link.id, v_link.client_id, v_link.email, v_link.prefill_first_name, v_link.prefill_last_name, 'Link has expired'::text;
    RETURN;
  END IF;

  -- Link is valid
  RETURN QUERY SELECT true, v_link.id, v_link.client_id, v_link.email, v_link.prefill_first_name, v_link.prefill_last_name, NULL::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 17: Update clients RLS for intake
-- ============================================

-- Allow anonymous insert for intake (no user_id required)
DROP POLICY IF EXISTS "Users can insert own clients" ON public.clients;
CREATE POLICY "Users can insert own clients" ON public.clients
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Allow viewing clients without user_id for admin purposes
DROP POLICY IF EXISTS "Users can view own clients" ON public.clients;
CREATE POLICY "Users can view own clients" ON public.clients
  FOR SELECT USING (
    auth.uid() = user_id OR
    (user_id IS NULL AND EXISTS (
      SELECT 1 FROM public.intake_links
      WHERE intake_links.client_id = clients.id
      AND intake_links.created_by = auth.uid()
    ))
  );

-- Update policy for clients
DROP POLICY IF EXISTS "Users can update own clients" ON public.clients;
CREATE POLICY "Users can update own clients" ON public.clients
  FOR UPDATE USING (
    auth.uid() = user_id OR
    (user_id IS NULL AND EXISTS (
      SELECT 1 FROM public.intake_links
      WHERE intake_links.client_id = clients.id
      AND intake_links.created_by = auth.uid()
    ))
  );

-- ============================================
-- STEP 18: Update documents RLS for intake
-- ============================================

-- Allow documents to be uploaded without user_id
DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
CREATE POLICY "Users can insert own documents" ON public.documents
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Allow viewing documents through client ownership
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = documents.client_id
      AND clients.user_id = auth.uid()
    ) OR
    (user_id IS NULL AND EXISTS (
      SELECT 1 FROM public.intake_links il
      JOIN public.clients c ON c.id = il.client_id
      WHERE c.id = documents.client_id
      AND il.created_by = auth.uid()
    ))
  );

-- ============================================
-- STORAGE: Create bucket for client documents
-- Run this command separately in Supabase Dashboard > Storage
-- or via the Supabase CLI
-- ============================================

-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'client-documents',
--   'client-documents',
--   false,
--   52428800, -- 50MB limit
--   ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
-- );

-- Storage policies (run separately in Supabase Dashboard > Storage > Policies)
--
-- Policy: Allow authenticated users to upload files
-- CREATE POLICY "Authenticated users can upload files"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'client-documents');
--
-- Policy: Allow users to view files they own or through client ownership
-- CREATE POLICY "Users can view own files"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (bucket_id = 'client-documents');
