-- Run this in your Supabase SQL Editor

create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  username text not null,
  name text not null,
  category text not null,
  idea text not null,
  result jsonb not null,
  sentiment text not null,
  urls text[] default '{}',
  is_public boolean default false,
  created_at timestamptz default now()
);

-- Allow all operations via anon key (internal tool)
alter table public.sessions enable row level security;

create policy "allow_all" on public.sessions
  for all using (true) with check (true);
