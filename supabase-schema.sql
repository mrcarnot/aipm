-- Run this once in Supabase's SQL Editor (Project → SQL Editor → New query).

-- Each row is one saved idea a user ran through the wizard.
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  domain_id text not null,
  comfort text,
  days integer,
  depth text,
  created_at timestamptz default now()
);

-- One row per (user, namespace, progress_key) — namespace is "tree" or
-- "roadmap", progress_key is either a domainId (fast-path Explore Topics
-- use) or a project's id (Your Projects use). done_ids mirrors exactly
-- what used to be a JS Set in localStorage, just stored as a JSON array.
create table progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  namespace text not null,
  progress_key text not null,
  done_ids jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now(),
  primary key (user_id, namespace, progress_key)
);

-- Row Level Security: without this, any logged-in user could read or edit
-- every row in these tables, not just their own.
alter table projects enable row level security;
alter table progress enable row level security;

create policy "Users manage their own projects"
  on projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own progress"
  on progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
