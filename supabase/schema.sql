-- PromptShield database schema. Paste into Supabase → SQL Editor → Run.

create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  label text not null,
  score smallint not null check (score between 0 and 100),
  grade text not null check (grade in ('A', 'B', 'C', 'D', 'F')),
  is_hardened boolean not null default false,
  breached_attacks text[] not null default '{}',
  by_category jsonb not null default '[]'
);

create index if not exists scans_user_created_idx on public.scans (user_id, created_at desc);

-- Row Level Security: every user can only see and manage their own scans.
alter table public.scans enable row level security;

drop policy if exists "Users read own scans" on public.scans;
create policy "Users read own scans" on public.scans
  for select using ((select auth.uid()) = user_id);

drop policy if exists "Users insert own scans" on public.scans;
create policy "Users insert own scans" on public.scans
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete own scans" on public.scans;
create policy "Users delete own scans" on public.scans
  for delete using ((select auth.uid()) = user_id);
