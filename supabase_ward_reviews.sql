-- ─────────────────────────────────────────────────────────────────────────────
-- Ward Reviews — Clerk-compatible schema
-- Run in: Supabase Dashboard → SQL Editor → New Query
--
-- IMPORTANT: user_id is TEXT (not UUID) because Clerk user IDs are strings
-- like "user_2abc123..." — they are NOT Supabase auth UUIDs.
-- Inserts are done server-side via the service-role key, so RLS policies
-- use a simple text match rather than auth.uid().
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ward_reviews (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Clerk user ID (e.g. "user_2NtrqxxxxxxxxxxxxxxX") stored as plain text
  user_id     TEXT        NOT NULL,
  ward_name   TEXT        NOT NULL,
  rating      INTEGER     NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT        NOT NULL CHECK (char_length(comment) >= 1 AND char_length(comment) <= 1000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast per-ward lookups (the most common query pattern)
CREATE INDEX IF NOT EXISTS idx_ward_reviews_ward_name
  ON public.ward_reviews (ward_name, created_at DESC);

-- ─── Row-Level Security ───────────────────────────────────────────────────────
-- Enable RLS. All writes go through the server-side service-role key (bypasses
-- RLS), so these policies only gate direct anon/authenticated client access.
ALTER TABLE public.ward_reviews ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can see all reviews (no login required to browse)
CREATE POLICY "ward_reviews_select_all"
  ON public.ward_reviews
  FOR SELECT
  USING (true);

-- Inserts are BLOCKED for anon/authenticated roles — only the service-role
-- (used by /api/reviews) can insert, which already enforces Clerk auth.
-- This prevents users from bypassing the API and writing directly.
CREATE POLICY "ward_reviews_insert_service_only"
  ON public.ward_reviews
  FOR INSERT
  WITH CHECK (false);   -- always deny; service-role bypasses this entirely

-- Deletes similarly blocked at the client level
CREATE POLICY "ward_reviews_delete_service_only"
  ON public.ward_reviews
  FOR DELETE
  USING (false);
