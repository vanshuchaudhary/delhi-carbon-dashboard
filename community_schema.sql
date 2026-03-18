-- ─────────────────────────────────────────────────────────────────────────────
-- Community Feedback & Video Stories Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT NOT NULL CHECK (char_length(comment) <= 1000),
  upvotes     INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "reviews_select_all" ON public.reviews
  FOR SELECT USING (true);

-- Authenticated users can insert their own reviews
CREATE POLICY "reviews_insert_own" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "reviews_delete_own" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

-- 2. Upvote increment RPC (avoids race conditions)
CREATE OR REPLACE FUNCTION increment_review_upvotes(review_id UUID)
RETURNS VOID AS $$
  UPDATE public.reviews
  SET upvotes = upvotes + 1
  WHERE id = review_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Video stories table
CREATE TABLE IF NOT EXISTS public.video_stories (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  video_url      TEXT NOT NULL,
  thumbnail_url  TEXT,
  caption        TEXT CHECK (char_length(caption) <= 200),
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.video_stories ENABLE ROW LEVEL SECURITY;

-- Anyone can read stories
CREATE POLICY "stories_select_all" ON public.video_stories
  FOR SELECT USING (true);

-- Authenticated users can insert their own stories
CREATE POLICY "stories_insert_own" ON public.video_stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own stories
CREATE POLICY "stories_delete_own" ON public.video_stories
  FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- STORAGE: Run this AFTER creating the 'user-videos' bucket in the Dashboard
-- ─────────────────────────────────────────────────────────────────────────────
-- INSERT INTO storage.buckets (id, name, public) VALUES ('user-videos', 'user-videos', true)
-- ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-videos');

CREATE POLICY "storage_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'user-videos' AND auth.role() = 'authenticated');
