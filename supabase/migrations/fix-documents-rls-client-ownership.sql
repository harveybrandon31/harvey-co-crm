-- Migration: Fix documents RLS to allow viewing via client ownership
-- Problem: Documents uploaded via intake have user_id = NULL,
-- so the existing "Users can view own documents" policy (auth.uid() = user_id) blocks them.
-- Fix: Add policies that allow access through client ownership.

-- Allow users to SELECT documents belonging to their clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view documents of own clients'
  ) THEN
    CREATE POLICY "Users can view documents of own clients" ON public.documents
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.clients
          WHERE clients.id = documents.client_id
          AND clients.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Allow users to UPDATE documents belonging to their clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update documents of own clients'
  ) THEN
    CREATE POLICY "Users can update documents of own clients" ON public.documents
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.clients
          WHERE clients.id = documents.client_id
          AND clients.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Allow users to DELETE documents belonging to their clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete documents of own clients'
  ) THEN
    CREATE POLICY "Users can delete documents of own clients" ON public.documents
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM public.clients
          WHERE clients.id = documents.client_id
          AND clients.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Back-fill: Set user_id on existing documents that have a client with a user_id
UPDATE public.documents
SET user_id = clients.user_id
FROM public.clients
WHERE documents.client_id = clients.id
  AND documents.user_id IS NULL
  AND clients.user_id IS NOT NULL;
