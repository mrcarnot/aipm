-- Run this in Supabase's SQL Editor, after the original supabase-schema.sql.
-- Adds storage for each project's own AI-generated concept tree and
-- roadmap, so they're generated once (at wizard completion) and reused
-- on every later visit rather than regenerated each time.

alter table projects
  add column if not exists tree_json jsonb,
  add column if not exists roadmap_json jsonb,
  add column if not exists dynamic_answers jsonb default '[]'::jsonb;
