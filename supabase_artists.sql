-- Lets TJ and Ariana add new artists to the website (Manage mode "+" button).
-- Run once in the Supabase SQL editor (after supabase_roles.sql).
create table if not exists public.site_artists (
  slug text primary key,
  name text not null,
  role text default 'Resident Artist',
  bio text default '',
  instagram text default '',
  photo text default '',
  photo_path text,
  position int not null default 0,
  created_at timestamptz default now()
);
alter table public.site_artists enable row level security;
drop policy if exists "Anyone can see artists" on public.site_artists;
create policy "Anyone can see artists" on public.site_artists for select using (true);
drop policy if exists "Managers add artists" on public.site_artists;
create policy "Managers add artists" on public.site_artists for insert to authenticated with check (public.can_manage_portfolios());
drop policy if exists "Managers change artists" on public.site_artists;
create policy "Managers change artists" on public.site_artists for update to authenticated using (public.can_manage_portfolios()) with check (public.can_manage_portfolios());
drop policy if exists "Managers delete artists" on public.site_artists;
create policy "Managers delete artists" on public.site_artists for delete to authenticated using (public.can_manage_portfolios());

-- Lets managers remove (hide) the original artists, e.g. when someone leaves.
alter table public.site_artists add column if not exists hidden boolean default false;
