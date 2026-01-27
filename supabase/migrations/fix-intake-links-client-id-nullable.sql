-- Migration: Make client_id nullable in intake_links
-- The client_id should be NULL when creating links for new prospects
-- It gets set when the client completes the intake form

ALTER TABLE public.intake_links
  ALTER COLUMN client_id DROP NOT NULL;
